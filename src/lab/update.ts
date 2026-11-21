import { Array, Effect, Option, Schema, pipe } from 'effect'
import { Command, type Runtime, type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { runInProcess } from '../adapters/in-process.ts'
import type { CapabilityName, RunRecord } from '../domain/capabilities.ts'
import { PlaceId, World } from '../domain/world.ts'
import { Message } from './message.ts'
import {
  type Chapter,
  type Model,
  Replay,
  RunState,
  type Weather,
  worldFor,
} from './model.ts'

const APP_LOG_LIMIT = 40
const REPLAY_STEP_MILLISECONDS = 450

// COMMAND

export const RunCapability = Command.define('RunCapability', {
  args: {
    runId: Schema.Number,
    world: World,
    capability: Schema.String,
    from: PlaceId,
    to: PlaceId,
    url: Schema.String,
  },
  messages: [Message.CompletedRunCapability],
  interrupt: true,
  execute: ({ runId, world, capability, from, to, url }) =>
    runInProcess(
      world,
      capability,
      capability === 'fetch_page' ? { url } : { from, to },
    ).pipe(
      Effect.map(result =>
        Message.CompletedRunCapability({
          runId,
          record: result.record,
          world: result.world,
        }),
      ),
    ),
})

export const WaitBeforeNextEvent = Command.define('WaitBeforeNextEvent', {
  args: { runId: Schema.Number, cursor: Schema.Number },
  messages: [Message.CompletedWaitBeforeNextEvent],
  execute: ({ runId, cursor }) =>
    Effect.sleep(`${REPLAY_STEP_MILLISECONDS} millis`).pipe(
      Effect.as(Message.CompletedWaitBeforeNextEvent({ runId, cursor })),
    ),
})

// INIT

export const initialModel: Model = {
  station: 'valley',
  chapter: 'discover',
  completedChapters: [],
  weather: 'calm',
  fetchPolicy: 'every-hop',
  url: 'https://valley.test/notice',
  world: worldFor('calm'),
  maybeSelected: Option.none(),
  from: 'forge',
  to: 'dock',
  run: RunState.Idle(),
  nextRunId: 1,
  replay: Replay.Complete(),
  tab: 'engine',
  appLog: [],
  nextAppLogSeq: 1,
}

export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: initialModel,
})

// UPDATE

type UpdateReturn = Update.Return<Model, Message>

export const finishedRecord = (run: RunState): Option.Option<RunRecord> =>
  RunState.match(run, {
    Idle: () => Option.none(),
    Running: () => Option.none(),
    Succeeded: ({ record }) => Option.some(record),
    Failed: ({ record }) => Option.some(record),
    Cancelled: () => Option.none(),
  })

export const finishedRunId = (run: RunState): Option.Option<number> =>
  RunState.match(run, {
    Idle: () => Option.none(),
    Running: () => Option.none(),
    Succeeded: ({ runId }) => Option.some(runId),
    Failed: ({ runId }) => Option.some(runId),
    Cancelled: () => Option.none(),
  })

const eventCount = (run: RunState): number =>
  Option.match(finishedRecord(run), {
    onNone: () => 0,
    onSome: record => record.events.length,
  })

const complete = (model: Model, chapters: ReadonlyArray<Chapter>): Model =>
  modifyFields(model, {
    completedChapters: completed => Array.dedupe([...completed, ...chapters]),
  })

const logged = (model: Model, message: Message): Model =>
  modifyFields(model, {
    appLog: entries =>
      Array.takeRight(
        [...entries, { seq: model.nextAppLogSeq, tag: message._tag }],
        APP_LOG_LIMIT,
      ),
    nextAppLogSeq: seq => seq + 1,
  })

const interruptIfRunning = (model: Model) =>
  RunState.isAnyOf(['Running'])(model.run)
    ? [
        RunCapability.Interrupt(outcome =>
          Message.CompletedCancelRunCapability({ outcome }),
        ),
      ]
    : []

const freshWorld = (model: Model, weather: Weather): Model =>
  modifyFields(model, {
    weather: () => weather,
    world: () => worldFor(weather, model.fetchPolicy),
    run: () => RunState.Idle(),
    replay: () => Replay.Complete(),
  })

const select = (model: Model, name: CapabilityName): Model =>
  complete(modifyFields(model, { maybeSelected: () => Option.some(name) }), [
    'discover',
    'inspect',
  ])

const withEndpoints = (model: Model, from: PlaceId, to: PlaceId): Model =>
  modifyFields(model, { from: () => from, to: () => to })

const openChapter = (model: Model, chapter: Chapter): UpdateReturn => {
  const entered = modifyFields(model, {
    chapter: () => chapter,
    station: () => 'valley',
  })
  if (chapter === 'discover') {
    return {
      model: complete(
        modifyFields(entered, { maybeSelected: () => Option.none() }),
        ['discover'],
      ),
    }
  }
  if (chapter === 'inspect') {
    return {
      model: withEndpoints(select(entered, 'find_route'), 'forge', 'mill'),
    }
  }
  if (chapter === 'use') {
    return {
      model: withEndpoints(select(entered, 'build_path'), 'mill', 'archive'),
    }
  }
  if (chapter === 'trace') {
    return {
      model: complete(modifyFields(entered, { tab: () => 'engine' }), [
        'trace',
      ]),
    }
  }
  if (chapter === 'program') {
    return {
      model: withEndpoints(
        select(freshWorld(entered, 'calm'), 'connect_places'),
        'forge',
        'dock',
      ),
      commands: interruptIfRunning(model),
    }
  }
  if (chapter === 'bend') {
    return {
      model: withEndpoints(
        select(freshWorld(entered, 'storm'), 'connect_places'),
        'forge',
        'dock',
      ),
      commands: interruptIfRunning(model),
    }
  }
  return {
    model: complete(modifyFields(entered, { tab: () => 'recording' }), [
      'entrances',
    ]),
  }
}

const withPlace = (
  model: Model,
  value: string,
  assign: (place: PlaceId) => Model,
): Model =>
  Option.match(Schema.decodeUnknownOption(PlaceId)(value), {
    onNone: () => model,
    onSome: assign,
  })

const advance = (model: Model, cursor: number): Replay =>
  cursor + 1 >= eventCount(model.run)
    ? Replay.Complete()
    : Replay.Paused({ cursor: cursor + 1 })

export const update = (current: Model, message: Message) => {
  const model = logged(current, message)
  return Message.match<UpdateReturn>(message, {
    SelectedStation: ({ station }) => ({
      model: modifyFields(freshWorld(model, model.weather), {
        station: () => station,
        maybeSelected: () =>
          station === 'fetch' ? Option.some('fetch_page') : Option.none(),
        tab: () => 'engine',
      }),
      commands: interruptIfRunning(model),
    }),

    SelectedPolicy: ({ policy }) => ({
      model: freshWorld(
        modifyFields(model, { fetchPolicy: () => policy }),
        model.weather,
      ),
      commands: interruptIfRunning(model),
    }),

    SelectedUrl: ({ value }) => ({
      model: modifyFields(model, { url: () => value }),
    }),

    ClickedChapter: ({ chapter }) => openChapter(model, chapter),

    SelectedCapability: ({ name }) => ({ model: select(model, name) }),

    SelectedFrom: ({ value }) => ({
      model: withPlace(model, value, place =>
        modifyFields(model, { from: () => place }),
      ),
    }),

    SelectedTo: ({ value }) => ({
      model: withPlace(model, value, place =>
        modifyFields(model, { to: () => place }),
      ),
    }),

    SelectedWeather: ({ weather }) => ({
      model: freshWorld(model, weather),
      commands: interruptIfRunning(model),
    }),

    ClickedExecute: () =>
      RunState.isAnyOf(['Running'])(model.run)
        ? { model }
        : Option.match(model.maybeSelected, {
            onNone: () => ({ model }),
            onSome: capability => ({
              model: modifyFields(model, {
                run: () =>
                  RunState.Running({ runId: model.nextRunId, capability }),
                nextRunId: runId => runId + 1,
                replay: () => Replay.Complete(),
              }),
              commands: [
                RunCapability({
                  runId: model.nextRunId,
                  world: model.world,
                  capability,
                  from: model.from,
                  to: model.to,
                  url: model.url,
                }),
              ],
            }),
          }),

    CompletedRunCapability: ({ runId, record, world }) =>
      RunState.match<UpdateReturn>(model.run, {
        Idle: () => ({ model }),
        Succeeded: () => ({ model }),
        Failed: () => ({ model }),
        Cancelled: () => ({ model }),
        Running: running =>
          running.runId !== runId
            ? { model }
            : {
                model: complete(
                  modifyFields(model, {
                    world: () => world,
                    run: () =>
                      record.outcome._tag === 'Succeeded'
                        ? RunState.Succeeded({ runId, record })
                        : RunState.Failed({ runId, record }),
                    replay: () => Replay.Complete(),
                  }),
                  pipe(
                    [
                      record.outcome._tag === 'Succeeded' ? ['use'] : [],
                      record.outcome._tag === 'Succeeded' &&
                      running.capability === 'connect_places'
                        ? ['program']
                        : [],
                      record.outcome._tag === 'Failed' &&
                      model.weather === 'storm'
                        ? ['bend']
                        : [],
                    ] satisfies ReadonlyArray<ReadonlyArray<Chapter>>,
                    Array.flatten,
                  ),
                ),
              },
      }),

    ClickedCancel: () =>
      RunState.match<UpdateReturn>(model.run, {
        Idle: () => ({ model }),
        Succeeded: () => ({ model }),
        Failed: () => ({ model }),
        Cancelled: () => ({ model }),
        Running: ({ runId, capability }) => ({
          model: modifyFields(model, {
            run: () => RunState.Cancelled({ runId, capability }),
          }),
          commands: interruptIfRunning(model),
        }),
      }),

    ClickedReset: () => ({
      model: freshWorld(model, model.weather),
      commands: interruptIfRunning(model),
    }),

    CompletedCancelRunCapability: () => ({ model }),

    ClickedReplayFromStart: () => ({
      model: complete(
        modifyFields(model, {
          replay: () =>
            eventCount(model.run) === 0
              ? Replay.Complete()
              : Replay.Paused({ cursor: 0 }),
        }),
        ['trace'],
      ),
    }),

    ClickedStep: () => ({
      model: complete(
        modifyFields(model, {
          replay: replay =>
            Replay.match(replay, {
              Complete: () => Replay.Complete(),
              Paused: ({ cursor }) => advance(model, cursor),
              Playing: ({ cursor }) => advance(model, cursor),
            }),
        }),
        ['trace'],
      ),
    }),

    ClickedPlay: () =>
      Option.match(finishedRunId(model.run), {
        onNone: () => ({ model }),
        onSome: runId => {
          const cursor = Replay.match(model.replay, {
            Complete: () => 0,
            Paused: paused => paused.cursor,
            Playing: playing => playing.cursor,
          })
          return {
            model: complete(
              modifyFields(model, { replay: () => Replay.Playing({ cursor }) }),
              ['trace'],
            ),
            commands: [WaitBeforeNextEvent({ runId, cursor })],
          }
        },
      }),

    ClickedPause: () => ({
      model: modifyFields(model, {
        replay: replay =>
          Replay.match(replay, {
            Complete: () => Replay.Complete(),
            Paused: paused => Replay.Paused({ cursor: paused.cursor }),
            Playing: ({ cursor }) => Replay.Paused({ cursor }),
          }),
      }),
    }),

    ClickedShowAll: () => ({
      model: modifyFields(model, { replay: () => Replay.Complete() }),
    }),

    CompletedWaitBeforeNextEvent: ({ runId, cursor }) =>
      Replay.match<UpdateReturn>(model.replay, {
        Complete: () => ({ model }),
        Paused: () => ({ model }),
        Playing: playing => {
          const isCurrent =
            playing.cursor === cursor &&
            Option.contains(finishedRunId(model.run), runId)
          if (!isCurrent) {
            return { model }
          }
          if (cursor + 1 >= eventCount(model.run)) {
            return {
              model: modifyFields(model, { replay: () => Replay.Complete() }),
            }
          }
          return {
            model: modifyFields(model, {
              replay: () => Replay.Playing({ cursor: cursor + 1 }),
            }),
            commands: [WaitBeforeNextEvent({ runId, cursor: cursor + 1 })],
          }
        },
      }),

    SelectedTab: ({ tab }) => ({
      model: complete(
        modifyFields(model, { tab: () => tab }),
        tab === 'recording' ? ['entrances'] : [],
      ),
    }),
  })
}
