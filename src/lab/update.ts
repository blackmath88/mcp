import { Array, Effect, Option, Schema, pipe } from 'effect'
import { Command, type Runtime, type Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  STAGE_PAUSE_MILLISECONDS,
  runInProcess,
} from '../adapters/in-process.ts'
import {
  type Frame,
  answerServer,
  enterDomain,
  runOverMcp,
  sendRaw,
} from '../adapters/in-tab-mcp.ts'
import { DEFAULT_PROGRAM, runProgram } from '../adapters/python-runner.ts'
import { listRemoteTools } from '../adapters/remote-listing.ts'
import type { CapabilityName, RunRecord } from '../domain/capabilities.ts'
import {
  CHANGED_EXAMPLE_LISTING,
  EXAMPLE_LISTING,
  parseListing,
} from '../domain/foreign.ts'
import { fingerprintOf, pinNew } from '../domain/lens.ts'
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
import { needsApproval } from './approval.ts'
import { beltOf, findCapability } from './belt.ts'
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
import { route, stepOf } from './story.ts'

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

export const AnswerServer = Command.define('AnswerServer', {
  args: {
    answer: Schema.Literals(['small', 'long', 'decline', 'cancel']),
  },
  messages: [Message.CompletedAnswerServer],
  execute: ({ answer }) =>
    Effect.sync(() => {
      answerServer(answer)
      return Message.CompletedAnswerServer()
    }),
})

export const AskRemote = Command.define('AskRemote', {
  args: { url: Schema.String },
  messages: [Message.CompletedAskRemote, Message.FailedAskRemote],
  execute: ({ url }) =>
    listRemoteTools(url).pipe(
      Effect.map(listing =>
        Message.CompletedAskRemote({
          json: listing.json,
          tools: listing.tools,
        }),
      ),
      Effect.catch(error =>
        Effect.succeed(Message.FailedAskRemote({ reason: error.message })),
      ),
    ),
})

export const EnterDomain = Command.define('EnterDomain', {
  args: { world: World, station: Station, tamper: Schema.Boolean },
  messages: [Message.CompletedEnterDomain, Message.FailedEnterDomain],
  execute: ({ world, station, tamper }) =>
    enterDomain(world, station, labPace, tamper).pipe(
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

export const RunPython = Command.define('RunPython', {
  args: { world: World, station: Schema.String, code: Schema.String },
  messages: [Message.CompletedRunPython, Message.FailedRunPython],
  execute: ({ world, station, code }) =>
    runProgram(world, station, code, labPace).pipe(
      Effect.map(ran =>
        Message.CompletedRunPython({
          output: ran.output,
          error: ran.error,
          world: ran.world,
          frames: ran.frames,
          tools: ran.tools,
        }),
      ),
      Effect.catch(() => Effect.succeed(Message.FailedRunPython())),
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
                : capability === 'profile_server'
                  ? { name: 'memory' }
                  : capability === 'call_tool'
                    ? { name: model.toolName }
                    : capability === 'go_to'
                      ? { client: model.client, place: model.place }
                      : capability === 'move_crate'
                        ? { to: 'ship' }
                        : capability === 'where_am_i'
                          ? { client: model.client }
                          : capability === 'find_route' ||
                              capability === 'build_path' ||
                              capability === 'connect_places'
                            ? { from: model.from, to: model.to }
                            : {}

// INIT

export const initialModel: Model = {
  station: 'fetch',
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
  maybeExample: Option.none(),
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
  program: DEFAULT_PROGRAM,
  pythonOutput: '',
  pythonError: '',
  python: 'idle',
  screen: 'bench',
  atlasView: 'map',
  pastedTools: '',
  remoteUrl: '',
  remoteNote: '',
  remoteState: 'idle',
  pastedPins: [],
  pins: [],
  approval: 'never',
  pending: Option.none(),
  declined: '',
  asking: Option.none(),
  canvasFull: false,
  approvedLast: '',
  watching: false,
  tampered: false,
  lens: 'family',
  transport: 'mcp-in-tab',
  tab: 'engine',
  backstage: 'collapsed',
  appLog: [],
  nextAppLogSeq: 1,
}

export const init: Runtime.ApplicationInit<Model, Message> = () => ({
  model: modifyFields(initialModel, { screen: () => 'landing' }),
  commands: [
    EnterDomain({
      world: initialModel.world,
      station: initialModel.station,
      tamper: false,
    }),
  ],
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
                    : station === 'inspector'
                      ? Option.some('profile_server')
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

// The host asks first when its rule says so. Nothing is sent until the
// person approves; a denied call never reaches the server.
const startRun = (
  model: Model,
  name: CapabilityName,
  inputJson: string,
): UpdateReturn =>
  RunState.isAnyOf(['Running'])(model.run)
    ? { model }
    : needsApproval(model.approval, name)
      ? {
          model: modifyFields(model, {
            maybeSelected: () => Option.some(name),
            pending: () => Option.some({ name, inputJson, kind: 'tool' }),
            declined: () => '',
          }),
        }
      : sendRun(model, name, inputJson)

const sendRun = (
  model: Model,
  name: CapabilityName,
  inputJson: string,
): UpdateReturn =>
  RunState.isAnyOf(['Running'])(model.run)
    ? { model }
    : {
        model: modifyFields(model, {
          pending: () => Option.none(),
          declined: () => '',
          watching: () => false,
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
            inputJson,
          }),
        ],
      }

const runPython = (model: Model): UpdateReturn => ({
  model: modifyFields(model, {
    pending: () => Option.none(),
    declined: () => '',
    python: () => 'running',
    pythonOutput: () => '',
    pythonError: () => '',
    run: () => RunState.Idle(),
    maybeSelected: () => Option.some('write_entry'),
    tab: () => 'frames',
  }),
  commands: [
    RunPython({
      world: model.world,
      station: model.station,
      code: model.program,
    }),
  ],
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

export const update = (current: Model, message: Message): UpdateReturn => {
  const model = logged(current, message)
  return Message.match<UpdateReturn>(message, {
    SelectedStation: ({ station }) => ({
      model: modifyFields(model, {
        station: () => station,
        tampered: () => false,
        pending: () => Option.none(),
        declined: () => '',
        watching: () => false,
        screen: () => 'bench',
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
        EnterDomain({ world: model.world, station, tamper: false }),
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

    SelectedExample: ({ id }) => ({
      model: modifyFields(model, { maybeExample: () => Option.some(id) }),
    }),

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
      Option.match(model.maybeSelected, {
        onNone: () => ({ model }),
        onSome: capability =>
          startRun(
            model,
            capability,
            JSON.stringify(inputFor(capability, model)),
          ),
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
      startRun(model, name, JSON.stringify(inputFor(name, model))),

    ClickedRunWith: ({ name, inputJson }) => startRun(model, name, inputJson),

    ClickedFetch: ({ url }) =>
      startRun(
        modifyFields(model, { url: () => url }),
        'fetch_page',
        JSON.stringify({ url }),
      ),

    ClickedSendRoot: ({ root }) => ({
      model: modifyFields(model, {
        rootChoice: () => root,
        world: world => applyRootsUpdate(world, [root]),
      }),
    }),

    ClickedClientEvent: ({ client, event }) => ({
      model: modifyFields(model, {
        world: world =>
          event === 'reconnect'
            ? reconnectClient(world, client)
            : vanishClient(world, client),
      }),
    }),

    UpdatedProgram: ({ value }) => ({
      model: modifyFields(model, { program: () => value }),
    }),

    ClickedRunPython: () =>
      model.python === 'running'
        ? { model }
        : needsApproval(model.approval, 'run_python')
          ? {
              model: modifyFields(model, {
                pending: () =>
                  Option.some({
                    name: 'run_python',
                    inputJson: '',
                    kind: 'program',
                  }),
                declined: () => '',
              }),
            }
          : runPython(model),

    CompletedRunPython: ({ output, error, world, frames, tools }) => ({
      model: modifyFields(model, {
        python: () => 'done',
        pythonOutput: () => output,
        pythonError: () => error,
        world: () => world,
        frames: previous => keepFrames(previous, frames),
        tools: previous =>
          Array.isReadonlyArrayEmpty(tools) ? previous : tools,
      }),
    }),

    FailedRunPython: () => ({
      model: modifyFields(model, { python: () => 'unavailable' }),
    }),

    ClickedHome: () => ({
      model: modifyFields(model, { screen: () => 'home' }),
    }),

    SelectedAtlasView: ({ view }) => ({
      model: modifyFields(model, { atlasView: () => view }),
    }),

    SelectedLens: ({ lens }) => ({
      model: modifyFields(model, { lens: () => lens }),
    }),

    ClickedTamper: ({ on }) => ({
      model: modifyFields(model, {
        tampered: () => on,
        tab: () => 'lens',
        backstage: () => 'open',
      }),
      commands: [
        EnterDomain({ world: model.world, station: model.station, tamper: on }),
      ],
    }),

    SelectedApprovalRule: ({ rule }) => ({
      model: modifyFields(model, {
        approval: () => rule,
        pending: () => Option.none(),
      }),
    }),

    ServerAsked: ({ question }) => ({
      model: modifyFields(model, { asking: () => Option.some(question) }),
    }),

    AnsweredServer: ({ answer }) => ({
      model: modifyFields(model, { asking: () => Option.none() }),
      commands: [AnswerServer({ answer })],
    }),

    CompletedAnswerServer: () => ({ model }),

    ClickedApprove: () =>
      Option.match(model.pending, {
        onNone: () => ({ model }),
        onSome: pending => {
          const approved = modifyFields(model, {
            approvedLast: () => pending.name,
          })
          return pending.kind === 'program'
            ? runPython(approved)
            : Option.match(findCapability(pending.name), {
                onNone: () => ({
                  model: modifyFields(model, { pending: () => Option.none() }),
                }),
                onSome: capability =>
                  sendRun(approved, capability.name, pending.inputJson),
              })
        },
      }),

    ClickedDeny: () => ({
      model: modifyFields(model, {
        declined: () =>
          Option.match(model.pending, {
            onNone: () => '',
            onSome: pending => pending.name,
          }),
        pending: () => Option.none(),
      }),
    }),

    ClickedNerdEntry: () => {
      const opened = update(
        model,
        Message.SelectedStation({ station: 'valley' }),
      )
      return {
        ...opened,
        model: modifyFields(opened.model, {
          tab: () => 'console',
          backstage: () => 'open',
        }),
      }
    },

    UpdatedRemoteUrl: ({ value }) => ({
      model: modifyFields(model, { remoteUrl: () => value }),
    }),

    ClickedAskRemote: () =>
      model.remoteUrl.trim() === ''
        ? { model }
        : {
            model: modifyFields(model, {
              remoteState: () => 'asking',
              remoteNote: () => 'Asking the server for its tool list…',
            }),
            commands: [AskRemote({ url: model.remoteUrl.trim() })],
          },

    CompletedAskRemote: ({ json, tools }) => ({
      model: modifyFields(model, {
        remoteState: () => 'idle',
        pastedTools: () => json,
        remoteNote: () =>
          `The server listed ${tools} tool${tools === 1 ? '' : 's'}. Only initialize and tools/list were sent; nothing was called.`,
      }),
    }),

    FailedAskRemote: ({ reason }) => ({
      model: modifyFields(model, {
        remoteState: () => 'idle',
        remoteNote: () => reason,
      }),
    }),

    UpdatedPastedTools: ({ value }) => ({
      model: modifyFields(model, { pastedTools: () => value }),
    }),

    ClickedLoadExample: () => ({
      model: modifyFields(model, { pastedTools: () => EXAMPLE_LISTING }),
    }),

    ClickedPinListing: () => {
      const parsed = parseListing(model.pastedTools)
      return {
        model: modifyFields(model, {
          pastedPins: () =>
            parsed.ok
              ? parsed.tools.map(tool => ({
                  name: tool.name,
                  fingerprint: fingerprintOf(tool),
                  description: tool.description,
                }))
              : [],
        }),
      }
    },

    ClickedLoadChangedExample: () => ({
      model: modifyFields(model, {
        pastedTools: () => CHANGED_EXAMPLE_LISTING,
      }),
    }),

    ClickedLanding: () => ({
      model: modifyFields(model, { screen: () => 'landing' }),
    }),

    ClickedLibrary: () => ({
      model: modifyFields(model, { screen: () => 'library' }),
    }),

    ClickedIntro: () => ({
      model: modifyFields(model, { screen: () => 'intro' }),
    }),

    ClickedRouteStep: ({ direction }) => {
      const here = stepOf(model.station)
      const next = route[here + (direction === 'next' ? 1 : -1)]
      return next === undefined
        ? { model }
        : update(model, Message.SelectedStation({ station: next.station }))
    },

    ClickedWatch: () => {
      const rewound = update(model, Message.ClickedReplayFromStart())
      const played = update(rewound.model, Message.ClickedPlay())
      return {
        ...played,
        model: modifyFields(played.model, { watching: () => true }),
      }
    },

    ClickedShowOnAtlas: () => ({
      model: modifyFields(model, {
        screen: () => 'home',
        atlasView: () => 'map',
      }),
    }),

    ClickedOpenInventory: () => ({
      model: modifyFields(model, {
        screen: () => 'home',
        atlasView: () => 'list',
      }),
    }),

    // Selecting a slot inspects it. It never runs anything.
    PressedSlotKey: ({ slot }) => ({
      model: Option.match(Option.fromNullishOr(beltOf(model).tools[slot - 1]), {
        onNone: () => model,
        onSome: capability => select(model, capability.name),
      }),
    }),

    ClickedOpenSpecimen: ({ name }) =>
      Option.match(findCapability(name), {
        onNone: () => ({ model }),
        onSome: capability => {
          if (capability.specimen === model.station) {
            return {
              model: modifyFields(model, {
                screen: () => 'bench',
                maybeSelected: () => Option.some(name),
              }),
            }
          }
          const opened = update(
            model,
            Message.SelectedStation({ station: capability.specimen }),
          )
          return {
            ...opened,
            model: modifyFields(opened.model, {
              maybeSelected: () => Option.some(name),
            }),
          }
        },
      }),

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
        pins: pins => pinNew(pins, tools),
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
            asking: () => Option.none(),
          }),
          commands: [
            ...interruptIfRunning(model),
            ...(Option.isSome(model.asking)
              ? [AnswerServer({ answer: 'cancel' })]
              : []),
          ],
        }),
      }),

    ClickedReset: () => ({
      model: modifyFields(model, {
        world: world => resetSlice(world, model.station),
        run: () => RunState.Idle(),
        replay: () => Replay.Complete(),
        conversation: lines => (model.station === 'memory' ? [] : lines),
        serverStarts: starts => (model.station === 'memory' ? 1 : starts),
        python: state => (state === 'running' ? state : 'idle'),
        pythonOutput: () => '',
        pythonError: () => '',
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

    ClickedCanvasFull: ({ on }) => ({
      model: modifyFields(model, { canvasFull: () => on }),
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
