import { Array, Effect, Option, Schema, pipe } from 'effect'
import { Command, type Runtime, type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  STAGE_PAUSE_MILLISECONDS,
  runInProcess,
} from '../adapters/in-process.ts'
import {
  type Frame,
  enterDomain,
  runOverMcp,
  sendRaw,
} from '../adapters/in-tab-mcp.ts'
import type { CapabilityName, RunRecord } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import { applySettings } from '../domain/settings.ts'
import { callerThoughts } from '../domain/thinking.ts'
import {
  PlaceId,
  World,
  applyRootsUpdate,
  panMap,
  passSessionTimeout,
  reconnectClient,
  reinstallPackage,
  resetSlice,
  useFetchPolicy,
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
  Station,
  type Weather,
  maxSpanIn,
  worldFor,
} from './model.ts'

const APP_LOG_LIMIT = 40
const REPLAY_STEP_MILLISECONDS = 450

// COMMAND

const labPace = Pace.slowedBy(STAGE_PAUSE_MILLISECONDS)

const parseInput = (inputJson: string): unknown =>
  Option.getOrElse(
    Option.liftThrowable((text: string): unknown => JSON.parse(text))(
      inputJson,
    ),
    () => ({}),
  )

export const RunCapability = Command.define('RunCapability', {
  args: {
    runId: Schema.Number,
    world: World,
    station: Schema.String,
    capability: Schema.String,
    inputJson: Schema.String,
  },
  messages: [Message.CompletedRunCapability],
  interrupt: true,
  execute: ({ runId, world, station, capability, inputJson }) =>
    runOverMcp(world, station, capability, parseInput(inputJson), labPace).pipe(
      Effect.map(result =>
        Message.CompletedRunCapability({
          runId,
          record: result.record,
          world: result.world,
          frames: result.frames,
          tools: result.tools,
        }),
      ),
      Effect.catch(() =>
        Effect.map(
          runInProcess(world, capability, parseInput(inputJson)),
          result =>
            Message.CompletedRunCapability({
              runId,
              record: result.record,
              world: result.world,
            }),
        ),
      ),
    ),
})

export const EnterDomain = Command.define('EnterDomain', {
  args: { world: World, station: Station },
  messages: [Message.CompletedEnterDomain, Message.FailedEnterDomain],
  execute: ({ world, station }) =>
    enterDomain(world, station, labPace).pipe(
      Effect.map(entered =>
        Message.CompletedEnterDomain({
          station,
          tools: entered.tools,
          frames: entered.frames,
        }),
      ),
      Effect.catch(() => Effect.succeed(Message.FailedEnterDomain())),
    ),
})

export const SendRaw = Command.define('SendRaw', {
  args: { world: World, station: Schema.String, text: Schema.String },
  messages: [Message.CompletedSendRaw, Message.FailedSendRaw],
  execute: ({ world, station, text }) =>
    sendRaw(world, station, text, labPace).pipe(
      Effect.map(sent =>
        Option.match(sent.record, {
          onNone: () =>
            Message.CompletedSendRaw({
              note: sent.note,
              frames: sent.frames,
              tools: sent.tools,
              world: sent.world,
            }),
          onSome: record =>
            Message.CompletedSendRaw({
              note: sent.note,
              frames: sent.frames,
              tools: sent.tools,
              world: sent.world,
              record,
            }),
        }),
      ),
      Effect.catch(() => Effect.succeed(Message.FailedSendRaw())),
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

export const inputFor = (capability: string, model: Model): unknown =>
  capability === 'fetch_page'
    ? { url: model.url }
    : capability === 'remember'
      ? { entity: model.entity, observation: model.observation }
      : capability === 'recall'
        ? { entity: model.entity }
        : capability === 'plan_steps'
          ? { from: model.from, to: model.to, thoughts: callerThoughts }
          : capability === 'read_file'
            ? { path: model.path }
            : capability === 'click'
              ? { target: model.target }
              : capability === 'show_map'
                ? { place: model.place }
                : capability === 'call_tool'
                  ? { name: model.toolName }
                  : capability === 'go_to'
                    ? { client: model.client, place: model.place }
                    : capability === 'where_am_i'
                      ? { client: model.client }
                      : capability === 'find_route' ||
                          capability === 'build_path' ||
                          capability === 'connect_places'
                        ? { from: model.from, to: model.to }
                        : {}

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
  reading: 'person',
  savedRuns: [],
  frames: [],
  tools: [],
  connection: 'connecting',
  consoleText: '',
  consoleNote: '',
  transport: 'mcp-in-tab',
  tab: 'engine',
  backstage: 'collapsed',
  appLog: [],
  nextAppLogSeq: 1,
}

export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: initialModel,
  commands: [EnterDomain({ world: initialModel.world, station: 'valley' })],
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

const defaultCapability = (station: Station): Option.Option<CapabilityName> =>
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
                          : Option.none()

const FRAME_LIMIT = 80

const keepFrames = (
  previous: ReadonlyArray<Frame>,
  added: ReadonlyArray<Frame>,
): ReadonlyArray<Frame> => Array.takeRight([...previous, ...added], FRAME_LIMIT)

const presetText = (preset: string, model: Model): string => {
  const tool = Option.getOrElse(model.maybeSelected, () => 'read_map')
  const call = (params: unknown) =>
    JSON.stringify(
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params },
      null,
      2,
    )
  if (preset === 'unknown-method') {
    return JSON.stringify(
      { jsonrpc: '2.0', id: 1, method: 'tools/destroy' },
      null,
      2,
    )
  }
  if (preset === 'no-name') {
    return call({})
  }
  if (preset === 'wrong-arguments') {
    return call({ name: tool, arguments: { from: 'mill', to: 'the moon' } })
  }
  if (preset === 'not-a-request') {
    return JSON.stringify({ hello: 'server' }, null, 2)
  }
  if (preset === 'not-json') {
    return '{ "jsonrpc": "2.0", "id": 1, "method": '
  }
  return call({ name: tool, arguments: inputFor(tool, model) })
}

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
    world: world =>
      resetSlice({ ...world, maxSpan: maxSpanIn(weather) }, 'valley'),
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
      model: modifyFields(model, {
        station: () => station,
        maybeSelected: () => defaultCapability(station),
        savedRuns: saved => [
          ...Array.filter(saved, entry => entry.station !== model.station),
          {
            station: model.station,
            run: RunState.isAnyOf(['Running'])(model.run)
              ? RunState.Idle()
              : model.run,
          },
        ],
        run: () =>
          pipe(
            model.savedRuns,
            Array.findFirst(entry => entry.station === station),
            Option.match({
              onNone: () => RunState.Idle(),
              onSome: entry => entry.run,
            }),
          ),
        replay: () => Replay.Complete(),
        reading: () => 'person',
      }),
      commands: [
        ...interruptIfRunning(model),
        EnterDomain({ world: model.world, station }),
      ],
    }),

    SelectedPolicy: ({ policy }) => ({
      model: modifyFields(model, {
        fetchPolicy: () => policy,
        world: world => useFetchPolicy(world, policy),
        run: () => RunState.Idle(),
      }),
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
      model: modifyFields(model, {
        world: world => resetSlice(useFsBuild(world, build), 'filesystem'),
        run: () => RunState.Idle(),
      }),
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
                  station: model.station,
                  capability: capability,
                  inputJson: JSON.stringify(inputFor(capability, model)),
                }),
              ],
            }),
          }),

    CompletedRunCapability: ({ runId, record, world, frames, tools }) =>
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
                    frames: previous => keepFrames(previous, frames ?? []),
                    tools: previous => tools ?? previous,
                    transport: () =>
                      frames === undefined ? 'in-process' : 'mcp-in-tab',
                    conversation: lines => [...lines, ...spoken(record)],
                    run: () =>
                      record.outcome._tag === 'Succeeded'
                        ? RunState.Succeeded({ runId, record })
                        : RunState.Failed({ runId, record }),
                    replay: () => Replay.Complete(),
                    backstage: backstage =>
                      record.outcome._tag === 'Failed' ? 'open' : backstage,
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

    ClickedRun: ({ name }) =>
      RunState.isAnyOf(['Running'])(model.run)
        ? { model }
        : {
            model: modifyFields(model, {
              maybeSelected: () => Option.some(name),
              run: () =>
                RunState.Running({ runId: model.nextRunId, capability: name }),
              nextRunId: runId => runId + 1,
              replay: () => Replay.Complete(),
            }),
            commands: [
              RunCapability({
                runId: model.nextRunId,
                world: model.world,
                station: model.station,
                capability: name,
                inputJson: JSON.stringify(inputFor(name, model)),
              }),
            ],
          },

    ClickedMapPlace: ({ place }) => ({
      model: modifyFields(model, {
        place: () => place,
        world: world => (world.app.view === '' ? world : panMap(world, place)),
      }),
    }),

    SelectedReading: ({ reading }) => ({
      model: modifyFields(model, { reading: () => reading }),
    }),

    ClickedInspectRun: () => ({
      model: complete(
        modifyFields(model, {
          tab: () => 'engine',
          backstage: () => 'open',
        }),
        ['trace'],
      ),
    }),

    CompletedEnterDomain: ({ station, tools, frames }) => ({
      model: modifyFields(model, {
        tools: previous => (station === model.station ? tools : previous),
        connection: () => 'connected',
        frames: previous => keepFrames(previous, frames),
      }),
    }),

    FailedEnterDomain: () => ({
      model: modifyFields(model, { connection: () => 'offline' }),
    }),

    UpdatedConsoleText: ({ value }) => ({
      model: modifyFields(model, { consoleText: () => value }),
    }),

    ClickedConsolePreset: ({ preset }) => ({
      model: modifyFields(model, {
        consoleText: () => presetText(preset, model),
        consoleNote: () => '',
      }),
    }),

    ClickedSendRaw: () => ({
      model: modifyFields(model, { consoleNote: () => 'Sending…' }),
      commands: [
        SendRaw({
          world: model.world,
          station: model.station,
          text: model.consoleText,
        }),
      ],
    }),

    CompletedSendRaw: ({ note, frames, tools, world, record }) => ({
      model: modifyFields(model, {
        consoleNote: () => note,
        frames: previous => keepFrames(previous, frames),
        tools: previous =>
          Array.isReadonlyArrayEmpty(tools) ? previous : tools,
        world: () => world,
        run: previous =>
          record === undefined
            ? previous
            : record.outcome._tag === 'Succeeded'
              ? RunState.Succeeded({ runId: model.nextRunId, record })
              : RunState.Failed({ runId: model.nextRunId, record }),
        nextRunId: runId => (record === undefined ? runId : runId + 1),
        replay: () => Replay.Complete(),
      }),
    }),

    FailedSendRaw: () => ({
      model: modifyFields(model, {
        consoleNote: () =>
          'The in-tab connection is not available, so nothing could be sent.',
      }),
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
      model: modifyFields(model, {
        world: world => resetSlice(world, model.station),
        run: () => RunState.Idle(),
        replay: () => Replay.Complete(),
        conversation: lines => (model.station === 'memory' ? [] : lines),
        serverStarts: starts => (model.station === 'memory' ? 1 : starts),
      }),
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
