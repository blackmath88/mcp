import { Array, Effect, Option, Schema, pipe } from 'effect'
import { Command, type Runtime, type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { runInProcess } from '../adapters/in-process.ts'
import type { CapabilityName, RunRecord } from '../domain/capabilities.ts'
import { applySettings } from '../domain/settings.ts'
import { callerThoughts } from '../domain/thinking.ts'
import {
  PlaceId,
  World,
  applyRootsUpdate,
  carrySettings,
  panMap,
  passSessionTimeout,
  reconnectClient,
  reinstallPackage,
  useFsBuild,
  useGatewayBuild,
  usePerception,
  useServerSchema,
  useStoragePath,
  useThinkingMode,
  vanishClient,
} from '../domain/world.ts'
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
    entity: Schema.String,
    observation: Schema.String,
    path: Schema.String,
    target: Schema.String,
    client: Schema.String,
    place: Schema.String,
    toolName: Schema.String,
  },
  messages: [Message.CompletedRunCapability],
  interrupt: true,
  execute: ({
    runId,
    world,
    capability,
    from,
    to,
    url,
    entity,
    observation,
    path,
    target,
    client,
    place,
    toolName,
  }) =>
    runInProcess(
      world,
      capability,
      capability === 'fetch_page'
        ? { url }
        : capability === 'remember'
          ? { entity, observation }
          : capability === 'recall'
            ? { entity }
            : capability === 'plan_steps'
              ? { from, to, thoughts: callerThoughts }
              : capability === 'read_file'
                ? { path }
                : capability === 'click'
                  ? { target }
                  : capability === 'show_map'
                    ? { place }
                    : capability === 'call_tool'
                      ? { name: toolName }
                      : capability === 'go_to'
                        ? { client, place }
                        : capability === 'where_am_i'
                          ? { client }
                          : { from, to },
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
  entity: 'Workshop A',
  observation: 'belongs to Team Blue',
  path: '/valley/mill/ledger.txt',
  target: 'gate',
  rootChoice: '/valley/mill',
  client: 'A',
  place: 'forge',
  toolName: 'inspect',
  conversation: [],
  serverStarts: 1,
  world: worldFor('calm'),
  maybeSelected: Option.none(),
  from: 'forge',
  to: 'dock',
  run: RunState.Idle(),
  nextRunId: 1,
  replay: Replay.Complete(),
  tab: 'engine',
  backstage: 'open',
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

const spoken = (record: RunRecord): ReadonlyArray<string> => {
  if (record.outcome._tag === 'Failed') {
    return []
  }
  const output = record.outcome.output
  if (output._tag === 'Remembered') {
    return [`You said: ${output.entity} ${output.observation}.`]
  }
  if (output._tag === 'Recalled') {
    return [
      `Recall said: ${output.entity} ${
        Array.isReadonlyArrayEmpty(output.observations)
          ? 'has nothing stored'
          : output.observations.join('; ')
      }.`,
    ]
  }
  return []
}

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
    world: () => carrySettings(worldFor(weather), model.world),
    conversation: () => [],
    serverStarts: () => 1,
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
          station === 'fetch'
            ? Option.some('fetch_page')
            : station === 'memory'
              ? Option.some('remember')
              : station === 'thinking'
                ? Option.some('plan_steps')
                : station === 'filesystem'
                  ? Option.some('read_file')
                  : station === 'perception'
                    ? Option.some('take_snapshot')
                    : station === 'apps'
                      ? Option.some('show_map')
                      : station === 'code-mode'
                        ? Option.some('run_as_calls')
                        : station === 'delegation'
                          ? Option.some('ask_expert')
                          : station === 'iteration'
                            ? Option.some('refine_plan')
                            : station === 'network'
                              ? Option.some('list_inventory')
                              : station === 'cli'
                                ? Option.some('generate_cli')
                                : station === 'local-remote'
                                  ? Option.some('go_to')
                                  : Option.none(),
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

    SelectedStoragePath: ({ storagePath }) => ({
      model: modifyFields(model, {
        world: world => useStoragePath(world, storagePath),
      }),
    }),

    SelectedThinkingMode: ({ mode }) => ({
      model: modifyFields(model, {
        world: world => useThinkingMode(world, mode),
        run: () => RunState.Idle(),
      }),
      commands: interruptIfRunning(model),
    }),

    SelectedEntity: ({ value }) => ({
      model: modifyFields(model, { entity: () => value }),
    }),

    SelectedObservation: ({ value }) => ({
      model: modifyFields(model, { observation: () => value }),
    }),

    SelectedFsBuild: ({ build }) => ({
      model: freshWorld(
        modifyFields(model, { world: world => useFsBuild(world, build) }),
        model.weather,
      ),
      commands: interruptIfRunning(model),
    }),

    SelectedPerception: ({ mode }) => ({
      model: modifyFields(model, {
        world: world => usePerception(world, mode),
      }),
    }),

    SelectedPath: ({ value }) => ({
      model: modifyFields(model, { path: () => value }),
    }),

    SelectedTarget: ({ value }) => ({
      model: modifyFields(model, { target: () => value }),
    }),

    SelectedRootChoice: ({ value }) => ({
      model: modifyFields(model, { rootChoice: () => value }),
    }),

    ClickedSendRoots: () => ({
      model: modifyFields(model, {
        world: world => applyRootsUpdate(world, [model.rootChoice]),
      }),
    }),

    ClickedRevokeRoots: () => ({
      model: modifyFields(model, {
        world: world => applyRootsUpdate(world, []),
      }),
    }),

    SelectedServerSchema: ({ version }) => ({
      model: modifyFields(model, {
        world: world => useServerSchema(world, version),
      }),
    }),

    SelectedGatewayBuild: ({ build }) => ({
      model: modifyFields(model, {
        world: world => useGatewayBuild(world, build),
        run: () => RunState.Idle(),
      }),
      commands: interruptIfRunning(model),
    }),

    SelectedClient: ({ value }) => ({
      model: modifyFields(model, { client: () => value }),
    }),

    SelectedGatewayPlace: ({ value }) => ({
      model: modifyFields(model, { place: () => value }),
    }),

    SelectedSetting: ({ setting }) => ({
      model: modifyFields(model, {
        world: world => applySettings(world, [setting]),
        run: () => RunState.Idle(),
      }),
      commands: interruptIfRunning(model),
    }),

    SelectedToolName: ({ value }) => ({
      model: modifyFields(model, { toolName: () => value }),
    }),

    ClickedPanMap: () => ({
      model: modifyFields(model, {
        world: world => panMap(world, model.place),
      }),
    }),

    ClickedReconnectClient: () => ({
      model: modifyFields(model, {
        world: world => reconnectClient(world, model.client),
      }),
    }),

    ClickedVanishClient: () => ({
      model: modifyFields(model, {
        world: world => vanishClient(world, model.client),
      }),
    }),

    ClickedPassTimeout: () => ({
      model: modifyFields(model, { world: world => passSessionTimeout(world) }),
    }),

    ClickedRestartClient: () => ({
      model: modifyFields(model, { conversation: () => [] }),
    }),

    ClickedRestartServer: () => ({
      model: modifyFields(model, { serverStarts: starts => starts + 1 }),
    }),

    ClickedReinstallPackage: () => ({
      model: modifyFields(model, {
        world: world => reinstallPackage(world),
        serverStarts: starts => starts + 1,
      }),
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
                  entity: model.entity,
                  observation: model.observation,
                  path: model.path,
                  target: model.target,
                  client: model.client,
                  place: model.place,
                  toolName: model.toolName,
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
                    conversation: lines => [...lines, ...spoken(record)],
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

    ClickedToggleBackstage: () => ({
      model: modifyFields(model, {
        backstage: backstage => (backstage === 'open' ? 'collapsed' : 'open'),
      }),
    }),

    SelectedTab: ({ tab }) => ({
      model: complete(
        modifyFields(model, { tab: () => tab, backstage: () => 'open' }),
        tab === 'recording' ? ['entrances'] : [],
      ),
    }),
  })
}
