import { Array, Option, Order, pipe } from 'effect'
import { type Document, type Html, type HtmlBuilder } from 'foldkit/html'

import route from '../../specimens/route.json'
import { STAGE_PAUSE_MILLISECONDS } from '../adapters/in-process.ts'
import {
  type Capability,
  type CapabilityName,
  type RunRecord,
  catalogue,
} from '../domain/capabilities.ts'
import { fieldsOf, helpText } from '../domain/cli-snapshot.ts'
import { siteUrls } from '../domain/fetch.ts'
import { filePaths, rootChoices } from '../domain/files.ts'
import { clients, gatewayPlaces } from '../domain/gateway.ts'
import { inventoryOf } from '../domain/later.ts'
import { entities, observations, pathLabel } from '../domain/memory.ts'
import { controls } from '../domain/perception.ts'
import type { ComponentId, EngineEvent } from '../domain/services.ts'
import { callerThoughts } from '../domain/thinking.ts'
import {
  type FetchPolicy,
  type FsBuild,
  type GatewayBuild,
  LAUNCH_DIRECTORIES,
  NO_ARTIFACT,
  NO_SNAPSHOT,
  type Path,
  type Perception,
  type PlaceId,
  type StoragePath,
  type ThinkingMode,
  type World,
  isAllowed,
  joins,
} from '../domain/world.ts'
import recording from '../recordings/entrances.json'
import { Message } from './message.ts'
import {
  type BackstageTab,
  type Chapter,
  type Model,
  Replay,
  RunState,
  type Station,
  type Weather,
  maxSpanIn,
} from './model.ts'
import { finishedRecord } from './update.ts'

type H = HtmlBuilder<Message>

// CONTENT

type ChapterInfo = Readonly<{
  id: Chapter
  name: string
  prompt: string
}>

const chapters: ReadonlyArray<ChapterInfo> = [
  {
    id: 'discover',
    name: 'Discover the kit',
    prompt:
      'You have entered the valley. Four items are on offer. Pick one to see what it really is.',
  },
  {
    id: 'inspect',
    name: 'Inspect an item',
    prompt:
      'The route finder only answers questions. Read its card: what can you observe, request, change?',
  },
  {
    id: 'use',
    name: 'Use it',
    prompt:
      'The path builder changes the map. Execute it and watch the revision and the artifact.',
  },
  {
    id: 'trace',
    name: 'Follow the trace',
    prompt:
      'Backstage lists what the engine did in your last run. Step through it one event at a time.',
  },
  {
    id: 'program',
    name: 'Run a program',
    prompt:
      'This item is a program. Give it a goal, not an instruction, and see what machinery it brings.',
  },
  {
    id: 'bend',
    name: 'Bend it',
    prompt:
      'A storm lowers the span limit. Same goal, same item. Find out which part refuses, and what was left undone.',
  },
  {
    id: 'entrances',
    name: 'Other entrances',
    prompt:
      'The same engine has a CLI and an MCP server. Backstage shows a real recorded exchange with each.',
  },
]

const affordanceLabel: Record<Capability['affordance'], string> = {
  readable: 'read',
  queryable: 'ask',
  operable: 'act',
  program: 'program',
}

const componentNames: Record<ComponentId, string> = {
  adapter: 'In-process adapter',
  catalogue: 'Capability catalogue',
  map: 'Map engine',
  planner: 'Planner',
  validator: 'Validator',
  'world-store': 'World store',
  'artifact-store': 'Artifact store',
  fetcher: 'Fetcher',
  'robots-policy': 'Robots policy',
  'synthetic-web': 'Synthetic web',
  'memory-graph': 'Memory server',
  disk: 'Disk',
  'thinking-tool': 'Thinking tool',
  'expert-model': 'Expert model (stand-in)',
  'file-server': 'File server',
  boundary: 'Boundary check',
  'synthetic-files': 'Synthetic files',
  'browser-tool': 'Browser tool',
  'accessibility-tree': 'Accessibility tree',
  'synthetic-page': 'Synthetic page',
  'cli-generator': 'CLI generator',
  'generated-cli': 'Generated CLI',
  'live-client': 'Live client',
  'crate-server': 'Crate server',
  gateway: 'Gateway',
  'child-process': 'Server process',
  'map-app': 'Map app server',
  'app-view': 'App view',
  ledger: 'Ledger',
  sandbox: 'Sandbox',
  'expert-tool': 'Expert tool',
  evaluator: 'Evaluator (stand-in)',
  generator: 'Generator (stand-in)',
  'workflow-engine': 'Workflow engine',
  federation: 'Federating gateway',
  'forge-backend': 'Forge backend',
  'dock-backend': 'Dock backend',
}

const componentRoles: Record<ComponentId, string> = {
  adapter:
    'Hands your request to the engine. It has no approval step of its own.',
  catalogue: 'Resolves the capability name and checks the shape of the input.',
  map: 'Reads the map, finds routes and builds single paths.',
  planner:
    'Runs the workshop: inspects, proposes a link, sequences the stages.',
  validator: 'Enforces the span limit and refuses duplicate paths.',
  'world-store': 'Holds the map and its revision.',
  'artifact-store': 'Keeps what runs produce.',
  fetcher:
    'Follows the URL and every redirect, and decides when to ask the policy.',
  'robots-policy':
    'Says whether one URL may be fetched. It only answers when asked.',
  'synthetic-web': 'Four made-up pages on valley.test. No real network.',
  'memory-graph': 'Reads and appends facts. Holds nothing between calls.',
  disk: 'Two made-up folders. Only one is read at a time.',
  'thinking-tool':
    'Returns a plan. Where the plan comes from depends on the build.',
  'expert-model': 'A scripted stand-in for another model. No inference runs.',
  'file-server': 'Reads a file if the boundary check lets it.',
  boundary: 'Compares a path with the effective allowed directories.',
  'synthetic-files': 'Three made-up text files.',
  'browser-tool': 'Takes snapshots and clicks, by reference or by coordinates.',
  'accessibility-tree': 'Lists only controls that have a role and a name.',
  'synthetic-page': 'Four made-up controls. Every click re-renders it.',
  'cli-generator': 'Reads the tool list once and bakes it into an artifact.',
  'generated-cli': 'Checks arguments against its embedded schema, then calls.',
  'live-client': 'Lists the tools before every call.',
  'crate-server': 'Accepts ship_crates under its current schema only.',
  gateway:
    'Bridges network clients to stdio server processes and decides who shares one.',
  'child-process': 'A stateful server process. It holds one current place.',
  'map-app': 'Opens the map app and relays questions to it.',
  'app-view': 'The interactive map on screen. The person can move it.',
  ledger: 'Appends entries. It cannot undo one.',
  sandbox: 'Runs a caller-written program in isolation.',
  'expert-tool': 'Hands a job to another model under one of three contracts.',
  evaluator: 'Rates a draft. Scripted; no inference runs.',
  generator: 'Writes a draft. Scripted; no inference runs.',
  'workflow-engine': 'Runs the refine loop and decides when to stop.',
  federation:
    'One entrance in front of two backends. It merges their tool lists.',
  'forge-backend': 'Offers inspect and ship.',
  'dock-backend': 'Offers inspect and weigh.',
}

const laterComponents: Readonly<
  Record<LaterStation, ReadonlyArray<ComponentId>>
> = {
  apps: ['adapter', 'catalogue', 'map-app', 'app-view'],
  'code-mode': ['adapter', 'catalogue', 'sandbox', 'ledger'],
  delegation: [
    'adapter',
    'catalogue',
    'expert-tool',
    'expert-model',
    'artifact-store',
  ],
  iteration: [
    'adapter',
    'catalogue',
    'workflow-engine',
    'generator',
    'evaluator',
  ],
  network: [
    'adapter',
    'catalogue',
    'federation',
    'forge-backend',
    'dock-backend',
  ],
}

type LaterStation =
  | 'apps'
  | 'code-mode'
  | 'delegation'
  | 'iteration'
  | 'network'

const asLater = (station: Station): Option.Option<LaterStation> =>
  station === 'apps' ||
  station === 'code-mode' ||
  station === 'delegation' ||
  station === 'iteration' ||
  station === 'network'
    ? Option.some(station)
    : Option.none()

const componentsOf = (station: Station): ReadonlyArray<ComponentId> =>
  Option.match(asLater(station), {
    onSome: later => laterComponents[later],
    onNone: () => earlierComponentsOf(station),
  })

const earlierComponentsOf = (station: Station): ReadonlyArray<ComponentId> =>
  station === 'fetch'
    ? ['adapter', 'catalogue', 'fetcher', 'robots-policy', 'synthetic-web']
    : station === 'memory'
      ? ['adapter', 'catalogue', 'memory-graph', 'disk']
      : station === 'thinking'
        ? ['adapter', 'catalogue', 'thinking-tool', 'map', 'expert-model']
        : station === 'filesystem'
          ? [
              'adapter',
              'catalogue',
              'file-server',
              'boundary',
              'synthetic-files',
            ]
          : station === 'cli'
            ? [
                'adapter',
                'catalogue',
                'cli-generator',
                'generated-cli',
                'live-client',
                'crate-server',
              ]
            : station === 'local-remote'
              ? ['adapter', 'catalogue', 'gateway', 'child-process']
              : station === 'perception'
                ? [
                    'adapter',
                    'catalogue',
                    'browser-tool',
                    'accessibility-tree',
                    'synthetic-page',
                  ]
                : [
                    'adapter',
                    'catalogue',
                    'planner',
                    'map',
                    'validator',
                    'world-store',
                    'artifact-store',
                  ]

type Specimen = (typeof route.specimens)[number]

const stations: ReadonlyArray<Station> = [
  'valley',
  'fetch',
  'memory',
  'thinking',
  'filesystem',
  'perception',
  'cli',
  'local-remote',
  'apps',
  'code-mode',
  'delegation',
  'iteration',
  'network',
]

const stationOf = (id: string): Station =>
  Option.getOrElse(
    Array.findFirst(stations, station => station === id),
    () => 'valley' as const,
  )

type JourneyPhase = 'inventory' | 'workshop' | 'follow'

const phaseNames: Record<JourneyPhase, string> = {
  inventory: 'Explore the inventory',
  workshop: 'Open the workshop',
  follow: 'Follow the work',
}

const phaseExamples: Record<JourneyPhase, string> = {
  inventory: 'Maps · fetch · memory · files',
  workshop: 'Thinking · CLI · apps · code',
  follow: 'Gateways · delegation · loops',
}

const phaseOrder: ReadonlyArray<JourneyPhase> = [
  'inventory',
  'workshop',
  'follow',
]

const phaseOf: Record<Station, JourneyPhase> = {
  valley: 'inventory',
  fetch: 'inventory',
  memory: 'inventory',
  filesystem: 'inventory',
  perception: 'inventory',
  thinking: 'workshop',
  cli: 'workshop',
  apps: 'workshop',
  'code-mode': 'workshop',
  'local-remote': 'follow',
  delegation: 'follow',
  iteration: 'follow',
  network: 'follow',
}

const phaseStations = (phase: JourneyPhase): ReadonlyArray<Station> =>
  Array.filter(stations, station => phaseOf[station] === phase)

const stationTitle = (station: Station): string =>
  Option.match(findSpecimen(station), {
    onNone: () => 'The valley',
    onSome: specimen => specimen.title,
  })

const stationSource = (station: Station): string =>
  Option.match(findSpecimen(station), {
    onNone: () => 'MCP Lab',
    onSome: specimen => specimen.anchor.repo,
  })

const findSpecimen = (station: Station): Option.Option<Specimen> =>
  Array.findFirst(route.specimens, specimen => specimen.id === station)

const storagePaths: ReadonlyArray<
  Readonly<{ id: StoragePath; label: string }>
> = [
  { id: 'package-cache', label: 'Package cache (default)' },
  { id: 'home', label: 'Home folder' },
]

const thinkingModes: ReadonlyArray<
  Readonly<{ id: ThinkingMode; label: string }>
> = [
  { id: 'record', label: 'Records your thoughts' },
  { id: 'compute', label: 'Computes from the map' },
  { id: 'consult', label: 'Asks another model' },
]

const fsBuilds: ReadonlyArray<Readonly<{ id: FsBuild; label: string }>> = [
  { id: 'default', label: 'Roots replace' },
  { id: 'confine', label: 'Roots only narrow' },
  { id: 'pre-fix', label: 'Before the fix' },
]

const perceptions: ReadonlyArray<Readonly<{ id: Perception; label: string }>> =
  [
    { id: 'snapshot', label: 'Snapshot only' },
    { id: 'vision', label: 'Coordinates on' },
  ]

const serverSchemas: ReadonlyArray<Readonly<{ id: number; label: string }>> = [
  { id: 1, label: 'Server schema v1' },
  { id: 2, label: 'v2 adds destination' },
]

const gatewayBuilds: ReadonlyArray<
  Readonly<{ id: GatewayBuild; label: string }>
> = [
  { id: 'shared', label: 'One shared process' },
  { id: 'per-connection', label: 'A process per connection' },
]

const policies: ReadonlyArray<Readonly<{ id: FetchPolicy; label: string }>> = [
  { id: 'every-hop', label: 'Check every hop' },
  { id: 'first-hop', label: 'First URL only' },
  { id: 'none', label: 'Never check' },
]

// DERIVED

const findCapability = (name: CapabilityName): Option.Option<Capability> =>
  Array.findFirst(catalogue, capability => capability.name === name)

const visibleEvents = (model: Model): ReadonlyArray<EngineEvent> =>
  Option.match(finishedRecord(model.run), {
    onNone: () => [],
    onSome: record =>
      Replay.match(model.replay, {
        Complete: () => record.events,
        Paused: ({ cursor }) => Array.take(record.events, cursor),
        Playing: ({ cursor }) => Array.take(record.events, cursor),
      }),
  })

const routeOf = (record: RunRecord): ReadonlyArray<PlaceId> => {
  if (record.outcome._tag === 'Failed') {
    return []
  }
  const output = record.outcome.output
  return output._tag === 'RouteFound' || output._tag === 'PlacesConnected'
    ? output.route.places
    : []
}

const isOnRoute = (path: Path, route: ReadonlyArray<PlaceId>): boolean =>
  pipe(
    Array.zip(route, route.slice(1)),
    Array.some(([a, b]) => joins(path, a, b)),
  )

const outcomeText = (record: RunRecord): string => {
  if (record.outcome._tag === 'Failed') {
    return record.outcome.message
  }
  const output = record.outcome.output
  if (output._tag === 'MapRead') {
    return `${output.places.length} places, ${output.paths.length} paths, revision ${output.revision}, span limit ${output.maxSpan}.`
  }
  if (output._tag === 'RouteFound') {
    return `Route: ${output.route.places.join(' → ')} (span ${output.route.span}).`
  }
  if (output._tag === 'MapShown') {
    return `The map app opened, centred on ${output.place}.`
  }
  if (output._tag === 'ViewReported') {
    return output.differsFromToolResult
      ? `The app says it is looking at ${output.place}. That is not where the tool result said.`
      : `The app says it is looking at ${output.place}.`
  }
  if (output._tag === 'BatchDone') {
    return `${output.written} entries written as ${output.mode}. The caller received ${output.resultsReported} result(s).`
  }
  if (output._tag === 'ExpertReplied') {
    return `“${output.reply}”`
  }
  if (output._tag === 'LoopFinished') {
    return `Returned draft ${output.returnedDraft} of ${output.draftsWritten}: ${output.stoppedBecause.replace(/\.$/, '')}.`
  }
  if (output._tag === 'LoopResumed') {
    return output.generationsRedone === 0
      ? 'After the crash it continued at draft 3. Nothing was written twice.'
      : `After the crash it started over. ${output.generationsRedone} drafts were written a second time.`
  }
  if (output._tag === 'InventoryListed') {
    return `${output.tools.length} tools are offered. ${output.hidden === 0 ? 'None is hidden.' : `${output.hidden} is hidden by a name collision.`}`
  }
  if (output._tag === 'ToolCalled') {
    return `${output.name} was answered by the ${output.answeredBy}: “${output.answer}”`
  }
  if (output._tag === 'CliGenerated') {
    return `Generated a CLI from schema v${output.schemaVersion}. That schema is now baked in.`
  }
  if (output._tag === 'CratesShipped') {
    return `Shipped via ${output.via}, sending ${output.sentFields.join(' and ')}.`
  }
  if (output._tag === 'WentTo') {
    return `Client ${output.client} went to ${output.place}. Process #${output.childId} served it.`
  }
  if (output._tag === 'WhereAmI') {
    return `Client ${output.client} is told: ${output.place === '' ? 'nowhere yet' : output.place}. Process #${output.childId} answered.`
  }
  if (output._tag === 'FileRead') {
    return `${output.path}: “${output.content}”`
  }
  if (output._tag === 'SnapshotTaken') {
    return `The snapshot lists ${output.entries.length} controls. ${output.notExposed} more are on the page but not in it.`
  }
  if (output._tag === 'Clicked') {
    return `Clicked ${output.target} by ${output.how}. The page is now at revision ${output.pageRevision}.`
  }
  if (output._tag === 'Remembered') {
    return `Stored in ${output.storedAt}. The file now has ${output.factsInFile} line(s).`
  }
  if (output._tag === 'Recalled') {
    return Array.isReadonlyArrayEmpty(output.observations)
      ? `Nothing is stored about ${output.entity} at ${output.readFrom}.`
      : `${output.entity}: ${output.observations.join('; ')}.`
  }
  if (output._tag === 'PlanMade') {
    return `A plan written by ${output.madeBy}. ${output.checkedAgainstMap ? 'Derived from the map.' : 'Not checked against the map.'}`
  }
  if (output._tag === 'PageFetched') {
    return `Returned “${output.title}” from ${output.finalUrl} after ${output.hops.length} hop(s) and ${output.robotsChecks} robots check(s).`
  }
  return output.artifact.summary
}

const failureOrigin = (record: RunRecord): Option.Option<ComponentId> =>
  pipe(
    record.events,
    Array.findFirst(event => event.kind === 'failed'),
    Option.map(event => event.component),
  )

type Answer = Readonly<{ question: string; answer: string }>

const fiveAnswers = (model: Model): ReadonlyArray<Answer> => {
  const maybeRecord = finishedRecord(model.run)
  const ask = (question: string, answer: (record: RunRecord) => string) => ({
    question,
    answer: Option.match(maybeRecord, { onNone: () => '', onSome: answer }),
  })
  return [
    ask('Who chose the action?', record => {
      const planned = Array.findFirst(
        record.events,
        event => event.operation === 'plan',
      )
      return Option.isSome(planned)
        ? 'You chose the goal. The planner chose which path to build. No model is involved on this page.'
        : 'You, by pressing Execute. No model is involved on this page.'
    }),
    ask('Was anyone asked?', record =>
      pipe(
        record.events,
        Array.findFirst(
          event =>
            event.component === 'validator' ||
            event.component === 'robots-policy' ||
            event.component === 'boundary',
        ),
        Option.match({
          onNone: () =>
            'No. This simulation has no approval prompt, and no component checked the request.',
          onSome: event =>
            `No. This simulation has no approval prompt. The ${componentNames[event.component].toLowerCase()} applied a rule in code.`,
        }),
      ),
    ),
    ask(
      'Where did it run?',
      record =>
        `In this browser tab, across ${
          pipe(
            record.events,
            Array.map(event => event.component),
            Array.dedupe,
          ).length
        } engine components.`,
    ),
    ask('What state changed?', record =>
      pipe(
        record.events,
        Array.filter(event => event.kind === 'state-changed'),
        Array.match({
          onEmpty: () => 'Nothing.',
          onNonEmpty: changes =>
            Array.map(
              changes,
              change =>
                `${componentNames[change.component]}: ${change.operation}.`,
            ).join(' '),
        }),
      ),
    ),
    ask('What evidence reached you?', record =>
      Option.match(failureOrigin(record), {
        onNone: () =>
          `${record.events.length} engine events and the result shown onstage.`,
        onSome: component =>
          `${record.events.length} engine events. The first failure is in the ${componentNames[component].toLowerCase()}.`,
      }),
    ),
  ]
}

// VIEW

export const view = (model: Model, h: H): Document => ({
  title: 'MCP Lab',
  body: h.div(
    [h.Class(`ide backstage-${model.backstage}`)],
    [
      titlebarView(model, h),
      h.nav(
        [h.Class('sidebar'), h.AriaLabel('Journey and kit')],
        [journeyView(model, h), kitView(model, h)],
      ),
      workbenchView(model, h),
      inspectorView(model, h),
      backstageView(model, h),
      statusbarView(model, h),
    ],
  ),
})

const titlebarView = (model: Model, h: H): Html =>
  h.header(
    [h.Class('titlebar')],
    [
      h.h1([], ['MCP Lab']),
      h.p(
        [h.Class('location'), h.AriaLabel('Current location')],
        [
          `${phaseNames[phaseOf[model.station]]} › `,
          h.b([], [stationTitle(model.station)]),
        ],
      ),
      h.span([h.Class('simtag')], ['Real MCP · made-up data']),
      phaseMapView(model, h),
    ],
  )

const phaseMapView = (model: Model, h: H): Html =>
  h.nav(
    [h.Class('phase-map'), h.AriaLabel('Learning path, simple to complex')],
    Array.map(phaseOrder, (phase, index) =>
      h.button(
        [
          h.Type('button'),
          h.Class('phase-stop'),
          h.AriaCurrent(phaseOf[model.station] === phase ? 'step' : 'false'),
          h.OnClick(
            Message.SelectedStation({
              station: Option.getOrElse(
                Array.head(phaseStations(phase)),
                () => 'valley' as const,
              ),
            }),
          ),
        ],
        [
          h.span([h.Class('phase-number')], [String(index + 1)]),
          h.span([h.Class('phase-name')], [phaseNames[phase]]),
          h.small([], [phaseExamples[phase]]),
        ],
      ),
    ),
  )

const bendRowView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('bendrow')],
    [
      Option.isSome(asLater(model.station))
        ? laterBend(model, h)
        : model.station === 'valley'
          ? bendView(
              'Weather',
              [
                weatherButton(model, 'calm', 'Calm', h),
                weatherButton(model, 'storm', 'Storm', h),
              ],
              h,
            )
          : model.station === 'fetch'
            ? bendView(
                'Robots policy',
                Array.map(policies, policy =>
                  h.button(
                    [
                      h.Type('button'),
                      h.AriaPressed(
                        model.world.fetchPolicy === policy.id
                          ? 'true'
                          : 'false',
                      ),
                      h.OnClick(Message.SelectedPolicy({ policy: policy.id })),
                    ],
                    [policy.label],
                  ),
                ),
                h,
              )
            : model.station === 'memory'
              ? bendView(
                  'Storage path',
                  Array.map(storagePaths, path =>
                    h.button(
                      [
                        h.Type('button'),
                        h.AriaPressed(
                          model.world.memory.storagePath === path.id
                            ? 'true'
                            : 'false',
                        ),
                        h.OnClick(
                          Message.SelectedStoragePath({ storagePath: path.id }),
                        ),
                      ],
                      [path.label],
                    ),
                  ),
                  h,
                )
              : model.station === 'filesystem'
                ? bendView(
                    'Server build',
                    Array.map(fsBuilds, build =>
                      h.button(
                        [
                          h.Type('button'),
                          h.AriaPressed(
                            model.world.files.build === build.id
                              ? 'true'
                              : 'false',
                          ),
                          h.OnClick(
                            Message.SelectedFsBuild({ build: build.id }),
                          ),
                        ],
                        [build.label],
                      ),
                    ),
                    h,
                  )
                : model.station === 'cli'
                  ? bendView(
                      'Server schema',
                      Array.map(serverSchemas, schema =>
                        h.button(
                          [
                            h.Type('button'),
                            h.AriaPressed(
                              model.world.cli.serverSchema === schema.id
                                ? 'true'
                                : 'false',
                            ),
                            h.OnClick(
                              Message.SelectedServerSchema({
                                version: schema.id,
                              }),
                            ),
                          ],
                          [schema.label],
                        ),
                      ),
                      h,
                    )
                  : model.station === 'local-remote'
                    ? bendView(
                        'Gateway build',
                        Array.map(gatewayBuilds, build =>
                          h.button(
                            [
                              h.Type('button'),
                              h.AriaPressed(
                                model.world.gateway.build === build.id
                                  ? 'true'
                                  : 'false',
                              ),
                              h.OnClick(
                                Message.SelectedGatewayBuild({
                                  build: build.id,
                                }),
                              ),
                            ],
                            [build.label],
                          ),
                        ),
                        h,
                      )
                    : model.station === 'perception'
                      ? bendView(
                          'Perception',
                          Array.map(perceptions, mode =>
                            h.button(
                              [
                                h.Type('button'),
                                h.AriaPressed(
                                  model.world.page.mode === mode.id
                                    ? 'true'
                                    : 'false',
                                ),
                                h.OnClick(
                                  Message.SelectedPerception({ mode: mode.id }),
                                ),
                              ],
                              [mode.label],
                            ),
                          ),
                          h,
                        )
                      : model.station === 'thinking'
                        ? bendView(
                            'What is inside',
                            Array.map(thinkingModes, mode =>
                              h.button(
                                [
                                  h.Type('button'),
                                  h.AriaPressed(
                                    model.world.thinkingMode === mode.id
                                      ? 'true'
                                      : 'false',
                                  ),
                                  h.OnClick(
                                    Message.SelectedThinkingMode({
                                      mode: mode.id,
                                    }),
                                  ),
                                ],
                                [mode.label],
                              ),
                            ),
                            h,
                          )
                        : h.empty,
    ],
  )

const bendView = (label: string, buttons: ReadonlyArray<Html>, h: H): Html =>
  h.div(
    [h.Class('bend')],
    [
      h.span([h.Class('bendlabel')], ['Bend it']),
      h.div([h.Class('seg'), h.Role('group'), h.AriaLabel(label)], buttons),
    ],
  )

const weatherButton = (
  model: Model,
  weather: Weather,
  label: string,
  h: H,
): Html =>
  h.button(
    [
      h.Type('button'),
      h.AriaPressed(model.weather === weather ? 'true' : 'false'),
      h.OnClick(Message.SelectedWeather({ weather })),
    ],
    [`${label} · span limit ${maxSpanIn(weather)}`],
  )

// SIDEBAR

const journeyView = (model: Model, h: H): Html =>
  h.section(
    [h.Class('side-section')],
    [
      h.label(
        [h.For('source-jump'), h.Class('side-title')],
        ['Browse by source'],
      ),
      h.select(
        [
          h.Id('source-jump'),
          h.Class('source-jump'),
          h.Value(model.station),
          h.OnChange(value =>
            Message.SelectedStation({ station: stationOf(value) }),
          ),
        ],
        pipe(
          stations,
          Array.sort(Order.mapInput(Order.String, stationSource)),
          Array.map(station =>
            h.option(
              [h.Value(station), h.Selected(station === model.station)],
              [`${stationSource(station)} · ${stationTitle(station)}`],
            ),
          ),
        ),
      ),
      h.h2([h.Class('side-title')], [phaseNames[phaseOf[model.station]]]),
      h.ol(
        [h.Class('journey')],
        Array.map(phaseStations(phaseOf[model.station]), station =>
          h.keyed('li')(
            station,
            [],
            [
              h.button(
                [
                  h.Type('button'),
                  h.Class('rung'),
                  h.AriaCurrent(station === model.station ? 'page' : 'false'),
                  h.OnClick(Message.SelectedStation({ station })),
                ],
                [
                  h.span(
                    [h.Class('n')],
                    [String(stations.indexOf(station)).padStart(2, '0')],
                  ),
                  h.span([h.Class('t')], [stationTitle(station)]),
                  h.span(
                    [h.Class('k')],
                    [
                      model.savedRuns.some(
                        entry =>
                          entry.station === station &&
                          !RunState.isAnyOf(['Idle'])(entry.run),
                      )
                        ? 'visited'
                        : '',
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      model.station === 'valley'
        ? h.details(
            [h.Class('fold'), h.Open(true)],
            [
              h.summary([], ['Valley walkthrough']),
              h.ol(
                [h.Class('journey steps')],
                Array.map(chapters, (chapter, index) =>
                  h.keyed('li')(
                    chapter.id,
                    [],
                    [
                      h.button(
                        [
                          h.Type('button'),
                          h.Class('rung'),
                          h.AriaCurrent(
                            model.chapter === chapter.id ? 'step' : 'false',
                          ),
                          h.OnClick(
                            Message.ClickedChapter({ chapter: chapter.id }),
                          ),
                        ],
                        [
                          h.span([h.Class('n')], [`${index + 1}`]),
                          h.span([h.Class('t')], [chapter.name]),
                          h.span(
                            [h.Class('k')],
                            [
                              model.completedChapters.includes(chapter.id)
                                ? 'done'
                                : '',
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          )
        : h.empty,
    ],
  )

const kitView = (model: Model, h: H): Html =>
  Array.match(
    Array.filter(
      catalogue,
      capability => capability.specimen === model.station,
    ),
    {
      onEmpty: () => h.empty,
      onNonEmpty: items =>
        h.section(
          [h.Class('side-section')],
          [
            h.h2([h.Class('side-title')], ['Your kit']),
            h.ul(
              [h.Class('slots')],
              Array.map(items, capability =>
                h.keyed('li')(
                  capability.name,
                  [],
                  [slotView(model, capability, h)],
                ),
              ),
            ),
          ],
        ),
    },
  )

const slotView = (model: Model, capability: Capability, h: H): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class(`slotb ${capability.affordance}`),
      h.AriaLabel(
        `${capability.title}, ${affordanceLabel[capability.affordance]}`,
      ),
      h.AriaPressed(
        Option.contains(model.maybeSelected, capability.name)
          ? 'true'
          : 'false',
      ),
      h.OnClick(Message.SelectedCapability({ name: capability.name })),
    ],
    [
      h.span([h.Class('slot-kind')], [affordanceLabel[capability.affordance]]),
      h.span([h.Class('slot-name')], [capability.title]),
    ],
  )

// INSPECTOR

const inspectorView = (model: Model, h: H): Html =>
  h.aside(
    [h.Class('inspector'), h.AriaLabel('Inspector')],
    [
      h.h2([h.Class('side-title')], ['Inspector']),
      Option.match(Option.flatMap(model.maybeSelected, findCapability), {
        onNone: () =>
          h.p([h.Class('side-note')], ['Pick an item from the kit.']),
        onSome: capability => cardView(capability, h),
      }),
      Option.match(finishedRecord(model.run), {
        onNone: () => h.empty,
        onSome: () =>
          h.details(
            [h.Class('fold'), h.Open(true)],
            [
              h.summary([], ['Five questions about your last run']),
              fiveView(model, h),
            ],
          ),
      }),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['What is real on this page']),
          h.p(
            [h.Class('side-note')],
            [
              'Every run is a real tools/call from a real MCP client to a real MCP server, both in this tab, over an in-memory transport. The data is made up. There is no model, no approval step and no network. Discovering an item is not permission to use it; here nothing checks who you are.',
            ],
          ),
        ],
      ),
    ],
  )

const cardView = (capability: Capability, h: H): Html =>
  h.div(
    [h.Class('card')],
    [
      h.h3([], [`${capability.title} · ${capability.name}`]),
      h.p([h.Class('desc')], [capability.description]),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['Six facts about this item']),
          h.dl(
            [h.Class('facts')],
            [
              factView('What can I observe?', capability.observe, h),
              factView('What can I request?', capability.request, h),
              factView('What does it produce?', capability.produces, h),
              factView('What can change?', capability.changes, h),
              factView('When does it finish?', capability.finishes, h),
              factView(
                'What does it depend on?',
                Array.map(
                  capability.dependsOn,
                  component => componentNames[component],
                ).join(', '),
                h,
              ),
            ],
          ),
        ],
      ),
    ],
  )

const factView = (question: string, answer: string, h: H): Html =>
  h.div([], [h.dt([], [question]), h.dd([], [answer])])

// STATUS BAR

const statusbarView = (model: Model, h: H): Html =>
  h.footer(
    [h.Class('statusbar')],
    [
      h.span([], ['Made-up data · real MCP client and server in this tab']),
      h.span([], ['No model · no network']),
      h.span(
        [],
        [
          Option.isSome(asLater(model.station))
            ? 'every model here is a scripted stand-in'
            : model.station === 'valley'
              ? `${model.weather} valley · map revision ${model.world.revision}`
              : model.station === 'fetch'
                ? `robots policy: ${model.world.fetchPolicy}`
                : model.station === 'memory'
                  ? `storage: ${pathLabel[model.world.memory.storagePath]} · server start #${model.serverStarts}`
                  : model.station === 'thinking'
                    ? `build: ${model.world.thinkingMode}`
                    : model.station === 'filesystem'
                      ? `allowed now: ${model.world.files.allowed.join(', ') || 'nothing'}`
                      : model.station === 'cli'
                        ? `server schema v${model.world.cli.serverSchema} · CLI embeds ${model.world.cli.artifactSchema === NO_ARTIFACT ? 'nothing yet' : `v${model.world.cli.artifactSchema}`}`
                        : model.station === 'local-remote'
                          ? `${model.world.gateway.children.length} server process(es) behind the gateway`
                          : model.station === 'perception'
                            ? `page revision ${model.world.page.revision} · ${model.world.page.mode}`
                            : 'reference only · unverified',
        ],
      ),
    ],
  )

// SPECIMEN

const specimenView = (specimen: Specimen, h: H): Html =>
  h.div(
    [h.Class('specimen')],
    [
      h.div(
        [h.Class('prompt')],
        [
          h.div(
            [],
            [
              h.h2(
                [],
                [
                  `${String(specimen.number).padStart(2, '0')} · ${specimen.title}`,
                ],
              ),
              h.p([h.Class('question')], [specimen.question]),
            ],
          ),
          h.span(
            [h.Class('pill')],
            [
              specimen.status === 'simulated'
                ? 'Simulated here'
                : 'Reference only · not built',
            ],
          ),
        ],
      ),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], [`Anchor: ${specimen.anchor.repo}`]),
          h.p([], [specimen.anchor.note]),
          ...Array.map(specimen.diversions, diversion =>
            h.p(
              [],
              [h.b([], [`Diversion, ${diversion.repo}: `]), diversion.note],
            ),
          ),
        ],
      ),
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['Where it bends, and the experiment']),
          h.p([], [specimen.bent]),
          h.p([], [h.b([], ['Experiment: ']), specimen.experiment]),
        ],
      ),
      h.details(
        [h.Class('fold')],
        [
          h.summary(
            [],
            [
              `Sources (${specimen.sources.length}), ${'checked' in specimen ? 'read, not pinned' : 'unverified'}`,
            ],
          ),
          'checked' in specimen ? h.p([], [specimen.checked]) : h.empty,
          h.ul(
            [h.Class('sources')],
            Array.map(specimen.sources, source =>
              h.keyed('li')(
                source,
                [],
                [
                  h.a(
                    [h.Href(source), h.Target('_blank'), h.Rel('noreferrer')],
                    [source.replace('https://github.com/', '')],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ],
  )

const fetchBenchView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('ctl')],
    [
      h.label(
        [h.For('url'), h.Class('field')],
        [
          h.span([], ['URL on the synthetic site']),
          h.select(
            [
              h.Id('url'),
              h.Value(model.url),
              h.OnChange(value => Message.SelectedUrl({ value })),
            ],
            Array.map(siteUrls, url =>
              h.option([h.Value(url), h.Selected(url === model.url)], [url]),
            ),
          ),
        ],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn'),
          h.Disabled(RunState.isAnyOf(['Running'])(model.run)),
          h.OnClick(Message.ClickedExecute()),
        ],
        ['Execute fetch_page'],
      ),
    ],
  )

const fetchedPageView = (model: Model, h: H): Html =>
  Option.match(finishedRecord(model.run), {
    onNone: () => h.empty,
    onSome: record =>
      record.outcome._tag === 'Succeeded' &&
      record.outcome.output._tag === 'PageFetched'
        ? h.div(
            [h.Class('card')],
            [
              h.h3([], ['What came back']),
              h.p(
                [h.Class('pathlist')],
                [record.outcome.output.hops.join(' → ')],
              ),
              h.pre([h.Class('page')], [record.outcome.output.markdown]),
            ],
          )
        : h.empty,
  })

// MEMORY

const optionSelect = (
  id: string,
  label: string,
  selected: string,
  options: ReadonlyArray<string>,
  toMessage: (value: string) => Message,
  h: H,
): Html =>
  h.label(
    [h.For(id), h.Class('field')],
    [
      h.span([], [label]),
      h.select(
        [h.Id(id), h.Value(selected), h.OnChange(toMessage)],
        Array.map(options, option =>
          h.option(
            [h.Value(option), h.Selected(option === selected)],
            [option],
          ),
        ),
      ),
    ],
  )

const memoryBenchView = (model: Model, h: H): Html => {
  const isRemember = Option.contains(model.maybeSelected, 'remember')
  return h.div(
    [h.Class('ctl')],
    [
      optionSelect(
        'entity',
        'Entity',
        model.entity,
        entities,
        value => Message.SelectedEntity({ value }),
        h,
      ),
      isRemember
        ? optionSelect(
            'observation',
            'Statement',
            model.observation,
            observations,
            value => Message.SelectedObservation({ value }),
            h,
          )
        : h.empty,
      h.button(
        [
          h.Type('button'),
          h.Class('btn'),
          h.Disabled(RunState.isAnyOf(['Running'])(model.run)),
          h.OnClick(Message.ClickedExecute()),
        ],
        [isRemember ? 'Execute remember' : 'Execute recall'],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost'),
          h.OnClick(Message.ClickedRestartClient()),
        ],
        ['Restart the client'],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost'),
          h.OnClick(Message.ClickedRestartServer()),
        ],
        ['Restart the server'],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost'),
          h.OnClick(Message.ClickedReinstallPackage()),
        ],
        ['Reinstall the package'],
      ),
    ],
  )
}

const factLines = (
  facts: ReadonlyArray<Readonly<{ entity: string; observation: string }>>,
  h: H,
): Html =>
  Array.match(facts, {
    onEmpty: () => h.p([h.Class('none')], ['empty']),
    onNonEmpty: lines =>
      h.ol(
        [h.Class('lines')],
        Array.map(lines, (fact, index) =>
          h.keyed('li')(`${index}`, [], [`${fact.entity} ${fact.observation}`]),
        ),
      ),
  })

const memoryPlacesView = (model: Model, h: H): Html => {
  const memory = model.world.memory
  return h.div(
    [h.Class('places')],
    [
      h.div(
        [h.Class('placebox')],
        [
          h.h3([], ['The conversation']),
          h.p([h.Class('where')], ['in the client · gone on client restart']),
          Array.match(model.conversation, {
            onEmpty: () => h.p([h.Class('none')], ['empty']),
            onNonEmpty: lines =>
              h.ol(
                [h.Class('lines')],
                Array.map(lines, (line, index) =>
                  h.keyed('li')(`${index}`, [], [line]),
                ),
              ),
          }),
        ],
      ),
      h.div(
        [h.Class('placebox')],
        [
          h.h3([], ['The server process']),
          h.p(
            [h.Class('where')],
            [`start #${model.serverStarts} · reads the file on every call`],
          ),
          h.p([h.Class('none')], ['holds nothing between calls']),
        ],
      ),
      h.div(
        [
          h.Class(
            `placebox ${memory.storagePath === 'package-cache' ? 'active' : ''}`,
          ),
        ],
        [
          h.h3([], ['Package cache']),
          h.p(
            [h.Class('where')],
            [
              `${pathLabel['package-cache']} · wiped on reinstall${memory.storagePath === 'package-cache' ? ' · in use' : ''}`,
            ],
          ),
          factLines(memory.packageCache, h),
        ],
      ),
      h.div(
        [h.Class(`placebox ${memory.storagePath === 'home' ? 'active' : ''}`)],
        [
          h.h3([], ['Home folder']),
          h.p(
            [h.Class('where')],
            [
              `${pathLabel.home} · survives reinstall${memory.storagePath === 'home' ? ' · in use' : ''}`,
            ],
          ),
          factLines(memory.home, h),
        ],
      ),
    ],
  )
}

// FILESYSTEM

const executeButton = (model: Model, label: string, h: H): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class('btn'),
      h.Disabled(RunState.isAnyOf(['Running'])(model.run)),
      h.OnClick(Message.ClickedExecute()),
    ],
    [label],
  )

const filesBenchView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('ctl')],
    [
      optionSelect(
        'path',
        'File',
        model.path,
        filePaths,
        value => Message.SelectedPath({ value }),
        h,
      ),
      executeButton(model, 'Execute read_file', h),
      optionSelect(
        'root',
        'Client root',
        model.rootChoice,
        rootChoices,
        value => Message.SelectedRootChoice({ value }),
        h,
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost'),
          h.OnClick(Message.ClickedSendRoots()),
        ],
        ['Client sends this root'],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost'),
          h.OnClick(Message.ClickedRevokeRoots()),
        ],
        ['Client revokes its roots'],
      ),
    ],
  )

const pathLines = (paths: ReadonlyArray<string>, h: H): Html =>
  Array.match(paths, {
    onEmpty: () => h.p([h.Class('none')], ['nothing']),
    onNonEmpty: lines =>
      h.ul(
        [h.Class('lines plain-list')],
        Array.map(lines, line => h.keyed('li')(line, [], [line])),
      ),
  })

const boundaryView = (model: Model, h: H): Html => {
  const files = model.world.files
  return h.div(
    [h.Class('places')],
    [
      h.div(
        [h.Class('placebox')],
        [
          h.h3([], ['Set at launch']),
          h.p([h.Class('where')], ['command line · never changes']),
          pathLines(LAUNCH_DIRECTORIES, h),
        ],
      ),
      h.div(
        [h.Class('placebox')],
        [
          h.h3([], ['Sent by the client']),
          h.p([h.Class('where')], ['roots · last update']),
          pathLines(files.clientRoots, h),
        ],
      ),
      h.div(
        [h.Class('placebox active')],
        [
          h.h3([], ['What the server enforces now']),
          h.p([h.Class('where')], [files.note]),
          pathLines(files.allowed, h),
        ],
      ),
      h.div(
        [h.Class('placebox')],
        [
          h.h3([], ['Files']),
          h.p([h.Class('where')], ['readable right now?']),
          h.ul(
            [h.Class('lines plain-list')],
            Array.map(filePaths, path =>
              h.keyed('li')(
                path,
                [],
                [`${isAllowed(files, path) ? 'yes' : 'no'} · ${path}`],
              ),
            ),
          ),
        ],
      ),
    ],
  )
}

// PERCEPTION

const perceptionBenchView = (model: Model, h: H): Html => {
  const isClick = Option.contains(model.maybeSelected, 'click')
  return h.div(
    [h.Class('ctl')],
    [
      isClick
        ? optionSelect(
            'target',
            'Control',
            model.target,
            Array.map(controls, control => control.id),
            value => Message.SelectedTarget({ value }),
            h,
          )
        : h.empty,
      executeButton(
        model,
        isClick ? 'Execute click' : 'Execute take_snapshot',
        h,
      ),
    ],
  )
}

const controlState = (model: Model, id: string): string => {
  const page = model.world.page
  if (id === 'gate') {
    return page.gate ? 'open' : 'closed'
  }
  if (id === 'lever') {
    return page.lever ? 'pulled' : 'up'
  }
  if (id === 'valve') {
    return page.valve ? 'open' : 'shut'
  }
  return `rung ${page.bell} time(s)`
}

const pageView = (model: Model, h: H): Html => {
  const page = model.world.page
  const hasSnapshot = page.snapshotRevision !== NO_SNAPSHOT
  const isFresh = page.snapshotRevision === page.revision
  return h.div(
    [h.Class('places')],
    [
      h.div(
        [h.Class('placebox')],
        [
          h.h3([], ['The page, as a person sees it']),
          h.p(
            [h.Class('where')],
            [`revision ${page.revision} · four controls`],
          ),
          h.ul(
            [h.Class('tiles')],
            Array.map(controls, control =>
              h.keyed('li')(
                control.id,
                [],
                [
                  h.b([], [control.label]),
                  h.span([], [controlState(model, control.id)]),
                  h.small([], [control.madeOf]),
                ],
              ),
            ),
          ),
        ],
      ),
      h.div(
        [h.Class('placebox active')],
        [
          h.h3([], ['The page, as the tool perceives it']),
          h.p(
            [h.Class('where')],
            [
              !hasSnapshot
                ? 'no snapshot taken yet'
                : isFresh
                  ? `snapshot of revision ${page.snapshotRevision} · current`
                  : `snapshot of revision ${page.snapshotRevision} · stale, the page is at ${page.revision}`,
            ],
          ),
          hasSnapshot
            ? h.ul(
                [h.Class('lines plain-list')],
                Array.flatMap(controls, (control, index) =>
                  control.inSnapshot
                    ? [
                        h.keyed('li')(
                          control.id,
                          [],
                          [
                            `r${page.snapshotRevision}e${index + 1} · button · “${control.label}”`,
                          ],
                        ),
                      ]
                    : [],
                ),
              )
            : h.p([h.Class('none')], ['nothing']),
          h.p(
            [h.Class('where')],
            [
              page.mode === 'vision'
                ? 'Coordinates are on: the tool can click any point, without knowing what is there.'
                : 'The Lever and the Valve have no role or name, so they never appear here.',
            ],
          ),
        ],
      ),
    ],
  )
}

// CLI SNAPSHOT

const cliBenchView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('ctl')],
    [
      h.p([h.Class('goal')], ['You want to ship 3 crates to the dock.']),
      executeButton(
        model,
        Option.match(model.maybeSelected, {
          onNone: () => 'Execute',
          onSome: name => `Execute ${name}`,
        }),
        h,
      ),
    ],
  )

const cliPlacesView = (model: Model, h: H): Html => {
  const cli = model.world.cli
  const hasArtifact = cli.artifactSchema !== NO_ARTIFACT
  const isStale = hasArtifact && cli.artifactSchema !== cli.serverSchema
  return h.div(
    [h.Class('places')],
    [
      h.div(
        [h.Class('placebox')],
        [
          h.h3([], ['The server, right now']),
          h.p([h.Class('where')], [`schema v${cli.serverSchema}`]),
          pathLines(
            [`ship_crates(${fieldsOf(cli.serverSchema).join(', ')})`],
            h,
          ),
        ],
      ),
      h.div(
        [h.Class('placebox active')],
        [
          h.h3([], ['The generated CLI']),
          h.p(
            [h.Class('where')],
            [
              !hasArtifact
                ? 'not generated yet'
                : isStale
                  ? `embeds schema v${cli.artifactSchema} · stale, and it cannot know`
                  : `embeds schema v${cli.artifactSchema} · matches the server`,
            ],
          ),
          hasArtifact
            ? pathLines([helpText(cli.artifactSchema)], h)
            : h.p([h.Class('none')], ['nothing']),
        ],
      ),
      h.div(
        [h.Class('placebox')],
        [
          h.h3([], ['A live call']),
          h.p([h.Class('where')], ['embeds nothing · asks every time']),
          h.p([h.Class('none')], ['lists the tools, then calls']),
        ],
      ),
    ],
  )
}

// GATEWAY

const gatewayBenchView = (model: Model, h: H): Html => {
  const isGoTo = Option.contains(model.maybeSelected, 'go_to')
  return h.div(
    [h.Class('ctl')],
    [
      optionSelect(
        'client',
        'Client',
        model.client,
        clients,
        value => Message.SelectedClient({ value }),
        h,
      ),
      isGoTo
        ? optionSelect(
            'gateway-place',
            'Place',
            model.place,
            gatewayPlaces,
            value => Message.SelectedGatewayPlace({ value }),
            h,
          )
        : h.empty,
      executeButton(model, isGoTo ? 'Execute go_to' : 'Execute where_am_i', h),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost'),
          h.OnClick(Message.ClickedReconnectClient()),
        ],
        ['This client reconnects'],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost'),
          h.OnClick(Message.ClickedVanishClient()),
        ],
        ['This client vanishes'],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost'),
          h.OnClick(Message.ClickedPassTimeout()),
        ],
        ['Session timeout passes'],
      ),
    ],
  )
}

const processesView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('places')],
    Array.match(model.world.gateway.children, {
      onEmpty: () => [
        h.div(
          [h.Class('placebox')],
          [
            h.h3([], ['No server process yet']),
            h.p(
              [h.Class('where')],
              ['one is spawned when a client first connects'],
            ),
          ],
        ),
      ],
      onNonEmpty: children =>
        Array.map(children, child =>
          h.div(
            [h.Class(`placebox ${child.orphaned ? '' : 'active'}`)],
            [
              h.h3([], [`Server process #${child.id}`]),
              h.p(
                [h.Class('where')],
                [
                  child.orphaned
                    ? `orphaned · was client ${child.owner}’s · still running`
                    : child.owner === 'shared'
                      ? 'shared by every client'
                      : `owned by client ${child.owner}’s connection`,
                ],
              ),
              h.p(
                [],
                [
                  child.place === ''
                    ? 'current place: none'
                    : `current place: ${child.place}`,
                ],
              ),
            ],
          ),
        ),
    }),
  )

// STATIONS 08 TO 12

const settingButtons = (
  current: string,
  key: string,
  options: ReadonlyArray<Readonly<{ value: string; label: string }>>,
  h: H,
): ReadonlyArray<Html> =>
  Array.map(options, option =>
    h.button(
      [
        h.Type('button'),
        h.AriaPressed(current === option.value ? 'true' : 'false'),
        h.OnClick(
          Message.SelectedSetting({ setting: `${key}=${option.value}` }),
        ),
      ],
      [option.label],
    ),
  )

const laterBend = (model: Model, h: H): Html => {
  const world = model.world
  if (model.station === 'apps') {
    return bendView(
      'App tools',
      settingButtons(
        world.app.tools,
        'app',
        [
          { value: 'on', label: 'App can be asked' },
          { value: 'off', label: 'App cannot be asked' },
        ],
        h,
      ),
      h,
    )
  }
  if (model.station === 'code-mode') {
    return bendView(
      'Fault',
      settingButtons(
        world.ledger.fault,
        'fault',
        [
          { value: 'none', label: 'All writes succeed' },
          { value: 'after-second', label: 'Third write fails' },
        ],
        h,
      ),
      h,
    )
  }
  if (model.station === 'delegation') {
    return bendView(
      'Handoff',
      settingButtons(
        world.handoff.context,
        'context',
        [
          { value: 'full', label: 'Map sent along' },
          { value: 'none', label: 'Map left out' },
        ],
        h,
      ),
      h,
    )
  }
  if (model.station === 'iteration') {
    return bendView(
      'Criteria',
      settingButtons(
        world.loop.criteria,
        'criteria',
        [
          { value: 'satisfiable', label: 'Criteria can be met' },
          { value: 'contradictory', label: 'Criteria contradict' },
        ],
        h,
      ),
      h,
    )
  }
  return bendView(
    'Naming',
    settingButtons(
      world.net.naming,
      'naming',
      [
        { value: 'first-wins', label: 'First name wins' },
        { value: 'prefixed', label: 'Names carry the backend' },
      ],
      h,
    ),
    h,
  )
}

const box = (
  title: string,
  where: string,
  lines: ReadonlyArray<string>,
  isActive: boolean,
  h: H,
): Html =>
  h.div(
    [h.Class(`placebox ${isActive ? 'active' : ''}`)],
    [
      h.h3([], [title]),
      h.p([h.Class('where')], [where]),
      Array.match(lines, {
        onEmpty: () => h.p([h.Class('none')], ['nothing yet']),
        onNonEmpty: shown =>
          h.ul(
            [h.Class('lines text-list')],
            Array.map(shown, (line, index) =>
              h.keyed('li')(`${index}`, [], [line]),
            ),
          ),
      }),
    ],
  )

const selectedLabel = (model: Model): string =>
  Option.match(model.maybeSelected, {
    onNone: () => 'Execute',
    onSome: name => `Execute ${name}`,
  })

const lastOutput = (model: Model) =>
  Option.flatMap(finishedRecord(model.run), record =>
    record.outcome._tag === 'Succeeded'
      ? Option.some(record.outcome.output)
      : Option.none(),
  )

const APP_PLACES: ReadonlyArray<
  Readonly<{ id: string; name: string; x: number; y: number }>
> = [
  { id: 'forge', name: 'Forge', x: 110, y: 150 },
  { id: 'mill', name: 'Mill', x: 270, y: 150 },
  { id: 'kiln', name: 'Kiln', x: 430, y: 90 },
  { id: 'dock', name: 'Dock', x: 590, y: 150 },
]

const appPlaceName = (id: string): string =>
  Option.match(
    Array.findFirst(APP_PLACES, place => place.id === id),
    { onNone: () => 'nowhere yet', onSome: place => place.name },
  )

const appBenchView = (model: Model, h: H): Html => {
  const app = model.world.app
  const isOpen = app.view !== ''
  const isStale = isOpen && app.modelKnows !== app.view
  const readings: ReadonlyArray<
    Readonly<{
      id: 'person' | 'model' | 'server'
      label: string
      value: string
      note: string
    }>
  > = [
    {
      id: 'person',
      label: 'On your screen',
      value: appPlaceName(app.view),
      note: 'What the app shows right now. You moved it; no tool was called.',
    },
    {
      id: 'model',
      label: 'Model’s last view',
      value: `${appPlaceName(app.modelKnows)}${isStale ? ' · out of date' : ''}`,
      note: isStale
        ? 'The model still holds what the last tool result told it. Nothing reported your move.'
        : 'What the model was last told matches the screen.',
    },
    {
      id: 'server',
      label: 'Tool result',
      value: appPlaceName(app.shown),
      note: 'Returned once, when the app opened. It does not update itself.',
    },
  ]
  return h.div(
    [h.Class('appbench')],
    [
      h.div(
        [h.Class('appmap')],
        [
          h.svg(
            [
              h.Class(
                `map appsvg reading-${model.reading} ${isOpen ? '' : 'closed'}`,
              ),
              h.ViewBox('0 0 700 240'),
              h.Role('img'),
              h.AriaLabel(
                isOpen
                  ? `Interactive map. The screen shows ${appPlaceName(app.view)}; the model was last told ${appPlaceName(app.modelKnows)}.`
                  : 'The map app is not open yet.',
              ),
            ],
            [
              h.line([
                h.Class('path'),
                h.X1('110'),
                h.Y1('150'),
                h.X2('270'),
                h.Y2('150'),
              ]),
              h.line([
                h.Class('path'),
                h.X1('430'),
                h.Y1('90'),
                h.X2('590'),
                h.Y2('150'),
              ]),
              ...Array.flatMap(APP_PLACES, place => [
                place.id === app.shown
                  ? h.circle([
                      h.Class('mark shown'),
                      h.Cx(String(place.x)),
                      h.Cy(String(place.y)),
                      h.R('34'),
                    ])
                  : h.empty,
                place.id === app.modelKnows
                  ? h.circle([
                      h.Class('mark model'),
                      h.Cx(String(place.x)),
                      h.Cy(String(place.y)),
                      h.R('27'),
                    ])
                  : h.empty,
                place.id === app.view
                  ? h.rect([
                      h.Class('mark screen'),
                      h.X(String(place.x - 60)),
                      h.Y(String(place.y - 50)),
                      h.Width('120'),
                      h.Height('100'),
                      h.Rx('8'),
                    ])
                  : h.empty,
                h.circle([
                  h.Class('place'),
                  h.Cx(String(place.x)),
                  h.Cy(String(place.y)),
                  h.R('12'),
                  h.OnClick(Message.ClickedMapPlace({ place: place.id })),
                ]),
                h.text(
                  [
                    h.Class('place-label'),
                    h.X(String(place.x)),
                    h.Y(String(place.y + 80)),
                    h.TextAnchor('middle'),
                  ],
                  [place.name],
                ),
              ]),
            ],
          ),
          h.div(
            [
              h.Class('moverow'),
              h.Role('group'),
              h.AriaLabel(isOpen ? 'Move the map to' : 'Open the map at'),
            ],
            [
              h.span(
                [h.Class('eyebrow')],
                [isOpen ? 'Move the map to' : 'Choose where to open'],
              ),
              ...Array.map(APP_PLACES, place =>
                h.button(
                  [
                    h.Type('button'),
                    h.Class('chip'),
                    h.AriaPressed(
                      (isOpen ? app.view : model.place) === place.id
                        ? 'true'
                        : 'false',
                    ),
                    h.OnClick(Message.ClickedMapPlace({ place: place.id })),
                  ],
                  [place.name],
                ),
              ),
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('readout')],
        [
          h.span([h.Class('eyebrow')], ['Read this map as']),
          ...Array.map(readings, reading =>
            h.button(
              [
                h.Type('button'),
                h.Class(`reading ${reading.id}`),
                h.AriaPressed(model.reading === reading.id ? 'true' : 'false'),
                h.OnClick(Message.SelectedReading({ reading: reading.id })),
              ],
              [
                h.span([h.Class('reading-label')], [reading.label]),
                h.b([], [reading.value]),
              ],
            ),
          ),
          h.p(
            [h.Class('reading-note'), h.AriaLive('polite')],
            [
              pipe(
                readings,
                Array.findFirst(reading => reading.id === model.reading),
                Option.match({
                  onNone: () => '',
                  onSome: reading => reading.note,
                }),
              ),
            ],
          ),
          isOpen
            ? h.button(
                [
                  h.Type('button'),
                  h.Class('btn'),
                  h.Disabled(RunState.isAnyOf(['Running'])(model.run)),
                  h.OnClick(Message.ClickedRun({ name: 'get_current_view' })),
                ],
                ['Ask the app where it is looking'],
              )
            : h.button(
                [
                  h.Type('button'),
                  h.Class('btn'),
                  h.Disabled(RunState.isAnyOf(['Running'])(model.run)),
                  h.OnClick(Message.ClickedRun({ name: 'show_map' })),
                ],
                [`Open the map at ${appPlaceName(model.place)}`],
              ),
        ],
      ),
    ],
  )
}

const laterBench = (model: Model, h: H): ReadonlyArray<Html> => {
  const world = model.world
  const maybeOutput = lastOutput(model)
  if (model.station === 'apps') {
    return [appBenchView(model, h), resultView(model, h)]
  }
  if (model.station === 'code-mode') {
    return [
      h.div(
        [h.Class('ctl')],
        [
          h.p(
            [h.Class('goal')],
            ['You want three entries in the ledger: clay, timber, iron.'],
          ),
          executeButton(model, selectedLabel(model), h),
        ],
      ),
      resultView(model, h),
      h.div(
        [h.Class('places')],
        [
          box(
            'The ledger',
            'append only · no undo',
            world.ledger.entries,
            true,
            h,
          ),
          box(
            'The program inside the sandbox',
            'written by the caller, not by the server',
            ['for (const load of loads) await ledger.write(load)'],
            false,
            h,
          ),
        ],
      ),
    ]
  }
  if (model.station === 'delegation') {
    const reply = Option.flatMap(maybeOutput, output =>
      output._tag === 'ExpertReplied' ? Option.some(output) : Option.none(),
    )
    return [
      h.div([h.Class('ctl')], [executeButton(model, selectedLabel(model), h)]),
      resultView(model, h),
      h.div(
        [h.Class('places')],
        [
          box(
            'What was handed over',
            'the expert sees only this',
            world.handoff.context === 'full'
              ? ['the goal', 'the map of the valley']
              : ['the goal'],
            false,
            h,
          ),
          box(
            'What came back',
            Option.match(reply, {
              onNone: () => 'nothing yet',
              onSome: output =>
                `contract: ${output.contract} · ${output.grounded ? 'based on the map' : 'the expert never saw the map'}`,
            }),
            Option.match(reply, {
              onNone: () => [],
              onSome: output => [
                output.reply,
                `Next step is owned by: ${output.nextStepOwner}.`,
              ],
            }),
            true,
            h,
          ),
          box(
            'Stored artifacts',
            'only "deliver" writes here',
            Array.map(world.artifacts, artifact => artifact.summary),
            false,
            h,
          ),
        ],
      ),
    ]
  }
  if (model.station === 'iteration') {
    return [
      h.div(
        [h.Class('ctl')],
        [
          optionSelect(
            'engine',
            'Engine',
            world.loop.engine,
            ['in-memory', 'durable'],
            value => Message.SelectedSetting({ setting: `engine=${value}` }),
            h,
          ),
          executeButton(model, selectedLabel(model), h),
        ],
      ),
      resultView(model, h),
      h.div(
        [h.Class('places')],
        [
          box(
            'The rule of the loop',
            'as read in the reference code',
            [
              'Stop when a draft is rated GOOD or better.',
              'Refine at most 3 times.',
              'Return the best-rated draft, not the last one.',
            ],
            false,
            h,
          ),
          box(
            'What happened',
            'ratings come from a scripted evaluator',
            Option.match(maybeOutput, {
              onNone: () => [],
              onSome: output =>
                output._tag === 'LoopFinished'
                  ? [
                      ...Array.map(
                        output.ratings,
                        (rating, index) => `Draft ${index + 1}: ${rating}`,
                      ),
                      ...(output.draftsWritten > output.ratings.length
                        ? [`Draft ${output.draftsWritten}: never rated`]
                        : []),
                      `Returned: draft ${output.returnedDraft}`,
                    ]
                  : output._tag === 'LoopResumed'
                    ? [
                        `Engine: ${output.engine}`,
                        `Drafts written before the crash: ${output.generationsBeforeCrash}`,
                        `Drafts written again afterwards: ${output.generationsRedone}`,
                      ]
                    : [],
            }),
            true,
            h,
          ),
        ],
      ),
    ]
  }
  const inventory = inventoryOf(world)
  return [
    h.div(
      [h.Class('ctl')],
      [
        Option.contains(model.maybeSelected, 'call_tool')
          ? optionSelect(
              'tool-name',
              'Tool',
              model.toolName,
              Array.map(inventory, entry => entry.name),
              value => Message.SelectedToolName({ value }),
              h,
            )
          : h.empty,
        executeButton(model, selectedLabel(model), h),
        h.button(
          [
            h.Type('button'),
            h.Class('btn ghost'),
            h.OnClick(
              Message.SelectedSetting({
                setting: world.net.dock === 'up' ? 'dock=down' : 'dock=up',
              }),
            ),
          ],
          [
            world.net.dock === 'up'
              ? 'Dock backend goes down'
              : 'Dock backend comes back',
          ],
        ),
      ],
    ),
    resultView(model, h),
    h.div(
      [h.Class('places')],
      [
        box(
          'One entrance',
          `${inventory.length} of 4 backend tools are visible`,
          Array.map(inventory, entry => `${entry.name} → ${entry.backend}`),
          true,
          h,
        ),
        box('Forge backend', 'up', ['inspect', 'ship'], false, h),
        box(
          'Dock backend',
          world.net.dock === 'up'
            ? 'up'
            : 'down · its tools are still listed at the entrance',
          ['inspect', 'weigh'],
          false,
          h,
        ),
      ],
    ),
  ]
}

// THINKING

const thinkingBenchView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('ctl')],
    [
      placeSelect(
        'from',
        'From',
        model.from,
        model.world,
        value => Message.SelectedFrom({ value }),
        h,
      ),
      placeSelect(
        'to',
        'To',
        model.to,
        model.world,
        value => Message.SelectedTo({ value }),
        h,
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn'),
          h.Disabled(RunState.isAnyOf(['Running'])(model.run)),
          h.OnClick(Message.ClickedExecute()),
        ],
        ['Execute plan_steps'],
      ),
    ],
  )

const planView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('places')],
    [
      h.div(
        [h.Class('placebox')],
        [
          h.h3([], ['Your thoughts, sent with the call']),
          h.p([h.Class('where')], ['from the caller']),
          h.ol(
            [h.Class('lines')],
            Array.map(callerThoughts, thought =>
              h.keyed('li')(thought, [], [thought]),
            ),
          ),
        ],
      ),
      Option.match(finishedRecord(model.run), {
        onNone: () => h.empty,
        onSome: record =>
          record.outcome._tag === 'Succeeded' &&
          record.outcome.output._tag === 'PlanMade'
            ? h.div(
                [h.Class('placebox active')],
                [
                  h.h3([], ['The plan that came back']),
                  h.p(
                    [h.Class('where')],
                    [
                      `written by ${record.outcome.output.madeBy} · ${record.outcome.output.checkedAgainstMap ? 'derived from the map' : 'not checked against the map'}`,
                    ],
                  ),
                  h.ol(
                    [h.Class('lines')],
                    Array.map(record.outcome.output.steps, step =>
                      h.keyed('li')(step, [], [step]),
                    ),
                  ),
                ],
              )
            : h.empty,
      }),
    ],
  )

// ONSTAGE

const benchToolsView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('benchtools')],
    [
      bendRowView(model, h),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost small'),
          h.OnClick(Message.ClickedReset()),
        ],
        ['Reset experiment'],
      ),
    ],
  )

const workbenchView = (model: Model, h: H): Html =>
  model.station === 'valley'
    ? valleyBenchView(model, h)
    : h.main(
        [h.Class('workbench'), h.AriaLabel('Workbench')],
        [
          h.div(
            [h.Class('panehead')],
            [
              h.span([h.Class('eyebrow')], ['Onstage · what you see']),
              Option.isSome(asLater(model.station)) ||
              model.station === 'fetch' ||
              model.station === 'memory' ||
              model.station === 'filesystem' ||
              model.station === 'perception' ||
              model.station === 'cli' ||
              model.station === 'local-remote' ||
              model.station === 'thinking'
                ? runPill(model.run, h)
                : h.empty,
            ],
          ),
          Option.match(findSpecimen(model.station), {
            onNone: () => h.empty,
            onSome: specimen => specimenView(specimen, h),
          }),
          benchToolsView(model, h),
          ...(Option.isSome(asLater(model.station))
            ? laterBench(model, h)
            : model.station === 'fetch'
              ? [
                  fetchBenchView(model, h),
                  resultView(model, h),
                  fetchedPageView(model, h),
                ]
              : model.station === 'memory'
                ? [
                    memoryBenchView(model, h),
                    resultView(model, h),
                    memoryPlacesView(model, h),
                  ]
                : model.station === 'filesystem'
                  ? [
                      filesBenchView(model, h),
                      resultView(model, h),
                      boundaryView(model, h),
                    ]
                  : model.station === 'cli'
                    ? [
                        cliBenchView(model, h),
                        resultView(model, h),
                        cliPlacesView(model, h),
                      ]
                    : model.station === 'local-remote'
                      ? [
                          gatewayBenchView(model, h),
                          resultView(model, h),
                          processesView(model, h),
                        ]
                      : model.station === 'perception'
                        ? [
                            perceptionBenchView(model, h),
                            resultView(model, h),
                            pageView(model, h),
                          ]
                        : model.station === 'thinking'
                          ? [
                              thinkingBenchView(model, h),
                              resultView(model, h),
                              planView(model, h),
                            ]
                          : [
                              h.p(
                                [h.Class('empty')],
                                [
                                  'Nothing to run yet. This station is a research lead waiting for its simulation.',
                                ],
                              ),
                            ]),
        ],
      )

const valleyBenchView = (model: Model, h: H): Html => {
  const index = chapters.findIndex(chapter => chapter.id === model.chapter)
  const maybeNext = Option.fromNullishOr(chapters[index + 1])
  return h.main(
    [h.Class('workbench'), h.AriaLabel('Workbench')],
    [
      h.div(
        [h.Class('panehead')],
        [
          h.span([h.Class('eyebrow')], ['Onstage · what you see']),
          runPill(model.run, h),
        ],
      ),
      pipe(
        Option.fromNullishOr(chapters[index]),
        Option.match({
          onNone: () => h.empty,
          onSome: chapter =>
            h.div(
              [h.Class('prompt')],
              [
                h.div(
                  [],
                  [h.h2([], [chapter.name]), h.p([], [chapter.prompt])],
                ),
                Option.match(maybeNext, {
                  onNone: () => h.empty,
                  onSome: next =>
                    h.button(
                      [
                        h.Type('button'),
                        h.Class('btn ghost'),
                        h.OnClick(Message.ClickedChapter({ chapter: next.id })),
                      ],
                      [`Next: ${next.name}`],
                    ),
                }),
              ],
            ),
        }),
      ),
      benchToolsView(model, h),
      mapView(model, h),
      pathListView(model.world, h),
      controlsView(model, h),
      resultView(model, h),
      artifactsView(model.world, h),
    ],
  )
}

const runPill = (run: RunState, h: H): Html =>
  RunState.match(run, {
    Idle: () => h.span([h.Class('pill')], ['Idle']),
    Running: ({ capability }) =>
      h.span([h.Class('pill busy')], [`Running ${capability}`]),
    Succeeded: () => h.span([h.Class('pill ok')], ['Succeeded']),
    Failed: () => h.span([h.Class('pill warn')], ['Failed']),
    Cancelled: () => h.span([h.Class('pill')], ['Cancelled']),
  })

const SCALE = 100

const mapView = (model: Model, h: H): Html => {
  const route = Option.match(finishedRecord(model.run), {
    onNone: () => [],
    onSome: routeOf,
  })
  const at = (id: PlaceId) =>
    Array.findFirst(model.world.places, place => place.id === id)
  return h.svg(
    [
      h.Class('map'),
      h.ViewBox('0 0 800 420'),
      h.Role('img'),
      h.AriaLabel(
        `Map of the valley at revision ${model.world.revision}. The list below names every path.`,
      ),
    ],
    [
      ...Array.flatMap(model.world.paths, path =>
        Option.match(Option.all([at(path.from), at(path.to)]), {
          onNone: () => [],
          onSome: ([from, to]) => [
            h.line([
              h.Class(
                `path ${path.builtInRevision > 0 ? 'built' : ''} ${isOnRoute(path, route) ? 'route' : ''}`,
              ),
              h.X1(String(from.x * SCALE)),
              h.Y1(String(from.y * SCALE)),
              h.X2(String(to.x * SCALE)),
              h.Y2(String(to.y * SCALE)),
            ]),
          ],
        }),
      ),
      ...Array.flatMap(model.world.places, place => [
        h.circle([
          h.Class(
            `place ${place.id === model.from || place.id === model.to ? 'chosen' : ''}`,
          ),
          h.Cx(String(place.x * SCALE)),
          h.Cy(String(place.y * SCALE)),
          h.R('13'),
        ]),
        h.text(
          [
            h.Class('place-label'),
            h.X(String(place.x * SCALE)),
            h.Y(String(place.y * SCALE + 42)),
            h.TextAnchor('middle'),
          ],
          [place.name],
        ),
      ]),
    ],
  )
}

const pathListView = (world: World, h: H): Html =>
  h.p(
    [h.Class('pathlist')],
    [
      `Revision ${world.revision} · span limit ${world.maxSpan} · paths: `,
      Array.map(
        world.paths,
        path =>
          `${path.from}–${path.to} (${path.span}${path.builtInRevision > 0 ? ', built' : ''})`,
      ).join(', '),
    ],
  )

const placeSelect = (
  id: string,
  label: string,
  selected: PlaceId,
  world: World,
  toMessage: (value: string) => Message,
  h: H,
): Html =>
  h.label(
    [h.For(id), h.Class('field')],
    [
      h.span([], [label]),
      h.select(
        [h.Id(id), h.Value(selected), h.OnChange(toMessage)],
        Array.map(world.places, place =>
          h.option(
            [h.Value(place.id), h.Selected(place.id === selected)],
            [place.name],
          ),
        ),
      ),
    ],
  )

const controlsView = (model: Model, h: H): Html => {
  const isRunning = RunState.isAnyOf(['Running'])(model.run)
  return Option.match(Option.flatMap(model.maybeSelected, findCapability), {
    onNone: () =>
      h.p([h.Class('empty')], ['Pick an item from the kit to use it.']),
    onSome: capability =>
      h.div(
        [h.Class('ctl')],
        [
          capability.input === 'endpoints'
            ? placeSelect(
                'from',
                'From',
                model.from,
                model.world,
                value => Message.SelectedFrom({ value }),
                h,
              )
            : h.empty,
          capability.input === 'endpoints'
            ? placeSelect(
                'to',
                'To',
                model.to,
                model.world,
                value => Message.SelectedTo({ value }),
                h,
              )
            : h.empty,
          h.button(
            [
              h.Type('button'),
              h.Class('btn'),
              h.Disabled(isRunning),
              h.OnClick(Message.ClickedExecute()),
            ],
            [`Execute ${capability.name}`],
          ),
          isRunning
            ? h.button(
                [
                  h.Type('button'),
                  h.Class('btn ghost'),
                  h.OnClick(Message.ClickedCancel()),
                ],
                ['Cancel'],
              )
            : h.empty,
        ],
      ),
  })
}

const undoneText = (record: RunRecord): string =>
  record.events.some(event => event.kind === 'state-changed')
    ? 'Something changed before the failure. Check the trace.'
    : record.capability === 'build_path' ||
        record.capability === 'connect_places'
      ? `Nothing was built. The map is still at revision ${record.revisionAfter}.`
      : 'Nothing changed.'

const afterRunView = (record: RunRecord, h: H): Html =>
  h.div(
    [h.Class('afterrun')],
    [
      h.details(
        [h.Class('fold')],
        [
          h.summary([], ['What changed?']),
          pipe(
            record.events,
            Array.filter(event => event.kind === 'state-changed'),
            Array.match({
              onEmpty: () => h.p([], ['Nothing. This run changed no state.']),
              onNonEmpty: changes =>
                h.ul(
                  [],
                  Array.map(changes, change =>
                    h.keyed('li')(
                      String(change.seq),
                      [],
                      [
                        `${componentNames[change.component]}: ${change.operation}. ${change.detail}`,
                      ],
                    ),
                  ),
                ),
            }),
          ),
        ],
      ),
      h.button(
        [
          h.Type('button'),
          h.Class('btn ghost small'),
          h.OnClick(Message.ClickedInspectRun()),
        ],
        ['Inspect run'],
      ),
    ],
  )

const resultView = (model: Model, h: H): Html =>
  RunState.match(model.run, {
    Idle: () => h.empty,
    Running: () =>
      h.p(
        [h.Class('result'), h.AriaLive('polite')],
        [
          `The engine is working. Each stage is slowed by ${STAGE_PAUSE_MILLISECONDS} ms so you can cancel.`,
        ],
      ),
    Succeeded: ({ record }) =>
      h.div(
        [h.Class('result ok'), h.AriaLive('polite')],
        [h.p([], [outcomeText(record)]), afterRunView(record, h)],
      ),
    Failed: ({ record }) =>
      h.div(
        [h.Class('result warn'), h.AriaLive('polite')],
        [
          h.p([], [outcomeText(record)]),
          h.p([], [undoneText(record)]),
          afterRunView(record, h),
        ],
      ),
    Cancelled: ({ capability }) =>
      h.p(
        [h.Class('result'), h.AriaLive('polite')],
        [
          `You cancelled ${capability} before the engine reported. On this page state is only replaced when a run reports back, so nothing changed.`,
        ],
      ),
  })

const artifactsView = (world: World, h: H): Html =>
  Array.match(world.artifacts, {
    onEmpty: () => h.empty,
    onNonEmpty: artifacts =>
      h.div(
        [h.Class('card')],
        [
          h.h3([], ['Artifacts in the valley']),
          h.ul(
            [h.Class('artifacts')],
            Array.map(artifacts, artifact =>
              h.keyed('li')(
                artifact.id,
                [],
                [h.b([], [artifact.id]), ` ${artifact.summary}`],
              ),
            ),
          ),
        ],
      ),
  })

// BACKSTAGE

const tabs: ReadonlyArray<Readonly<{ id: BackstageTab; label: string }>> = [
  { id: 'frames', label: 'MCP frames' },
  { id: 'engine', label: 'Engine events' },
  { id: 'app', label: 'App messages' },
  { id: 'recording', label: 'Recorded CLI + MCP' },
  { id: 'network', label: 'Network' },
]

const backstageView = (model: Model, h: H): Html =>
  h.section(
    [h.Class('panel'), h.AriaLabel('Backstage')],
    [
      h.div(
        [h.Class('panehead')],
        [
          h.span([h.Class('eyebrow')], ['Backstage · what actually happened']),
          h.button(
            [
              h.Type('button'),
              h.Class('toggle'),
              h.AriaExpanded(model.backstage === 'open'),
              h.OnClick(Message.ClickedToggleBackstage()),
            ],
            [model.backstage === 'open' ? 'Collapse' : 'Expand'],
          ),
        ],
      ),
      h.div(
        [h.Class('tabs'), h.Role('group'), h.AriaLabel('Evidence')],
        Array.map(tabs, tab =>
          h.button(
            [
              h.Type('button'),
              h.AriaPressed(model.tab === tab.id ? 'true' : 'false'),
              h.OnClick(Message.SelectedTab({ tab: tab.id })),
            ],
            [tab.label],
          ),
        ),
      ),
      model.backstage === 'collapsed'
        ? h.empty
        : model.tab === 'frames'
          ? framesTabView(model, h)
          : model.tab === 'engine'
            ? engineTabView(model, h)
            : model.tab === 'app'
              ? appTabView(model, h)
              : model.tab === 'recording'
                ? recordingTabView(model, h)
                : networkView(model, h),
    ],
  )

const modeView = (mode: string, detail: string, h: H): Html =>
  h.p([h.Class('mode')], [h.b([], [mode]), ` · ${detail}`])

const framesTabView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('tabpane')],
    [
      model.transport === 'mcp-in-tab'
        ? modeView(
            'Actual MCP connection',
            'a real SDK client and a real server, both running in this tab, joined by the in-memory transport. Nothing crossed a network.',
            h,
          )
        : modeView(
            'No MCP connection for this run',
            'the in-tab connection failed, so the engine was called directly. There are no frames to show.',
            h,
          ),
      Array.match(model.frames, {
        onEmpty: () =>
          h.p(
            [h.Class('quiet')],
            ['No frames yet. Run something on this station to see them.'],
          ),
        onNonEmpty: frames =>
          h.ol(
            [h.Class('log')],
            Array.map(frames, (frame, index) =>
              h.keyed('li')(
                String(index),
                [
                  h.DataAttribute(
                    'kind',
                    frame.direction === 'client → server' ? 'req' : 'res',
                  ),
                ],
                [
                  h.span([h.Class('n')], [String(index + 1)]),
                  h.span([h.Class('hop')], [frame.direction]),
                  h.details(
                    [h.Class('lab')],
                    [h.summary([], [frame.label]), h.pre([], [frame.json])],
                  ),
                ],
              ),
            ),
          ),
      }),
    ],
  )

const engineTabView = (model: Model, h: H): Html => {
  const total = Option.match(finishedRecord(model.run), {
    onNone: () => 0,
    onSome: record => record.events.length,
  })
  const shown = visibleEvents(model)
  const isPlaying = Replay.isAnyOf(['Playing'])(model.replay)
  return h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'In-process domain execution',
        'emitted by the engine inside the server handler, in this tab. These are not protocol messages; see MCP frames for those.',
        h,
      ),
      total === 0
        ? h.p(
            [h.Class('quiet')],
            [
              RunState.isAnyOf(['Running'])(model.run)
                ? 'Running. Events appear when the engine reports back.'
                : 'No run yet. Execute an item to see what the engine does.',
            ],
          )
        : h.div(
            [h.Class('replay')],
            [
              h.span(
                [h.Class('count'), h.AriaLive('polite')],
                [`Showing ${shown.length} of ${total} events`],
              ),
              h.button(
                [h.Type('button'), h.OnClick(Message.ClickedReplayFromStart())],
                ['From the start'],
              ),
              h.button(
                [
                  h.Type('button'),
                  h.Disabled(shown.length >= total),
                  h.OnClick(Message.ClickedStep()),
                ],
                ['Step'],
              ),
              isPlaying
                ? h.button(
                    [h.Type('button'), h.OnClick(Message.ClickedPause())],
                    ['Pause'],
                  )
                : h.button(
                    [h.Type('button'), h.OnClick(Message.ClickedPlay())],
                    ['Play'],
                  ),
              h.button(
                [
                  h.Type('button'),
                  h.Disabled(shown.length >= total),
                  h.OnClick(Message.ClickedShowAll()),
                ],
                ['Show all'],
              ),
            ],
          ),
      h.ol(
        [h.Class('log')],
        Array.map(shown, event =>
          h.keyed('li')(
            String(event.seq),
            [h.DataAttribute('kind', event.kind)],
            [
              h.span([h.Class('n')], [String(event.seq)]),
              h.span(
                [h.Class('hop')],
                [
                  `${componentNames[event.calledBy]} → ${componentNames[event.component]}`,
                ],
              ),
              h.span([h.Class('kind')], [event.kind]),
              h.span(
                [h.Class('lab')],
                [
                  event.detail === ''
                    ? event.operation
                    : `${event.operation}: ${event.detail}`,
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  )
}

const appTabView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'Application state transitions',
        'the Foldkit messages this page handled, newest last. Your clicks and command results, not the engine and not a protocol.',
        h,
      ),
      Array.match(model.appLog, {
        onEmpty: () =>
          h.p([h.Class('quiet')], ['Nothing yet. Every click lands here.']),
        onNonEmpty: entries =>
          h.ol(
            [h.Class('log')],
            Array.map(entries, entry =>
              h.keyed('li')(
                String(entry.seq),
                [h.DataAttribute('kind', 'app')],
                [
                  h.span([h.Class('n')], [String(entry.seq)]),
                  h.span([h.Class('lab')], [entry.tag]),
                ],
              ),
            ),
          ),
      }),
    ],
  )

const frameLabel = (message: unknown): string => {
  if (typeof message !== 'object' || message === null) {
    return 'message'
  }
  if ('method' in message && typeof message.method === 'string') {
    return message.method
  }
  if ('result' in message) {
    return 'isError' in Object(message.result) &&
      Object(message.result).isError === true
      ? 'result · isError: true'
      : 'result'
  }
  return 'error'
}

const recordingTabView = (model: Model, h: H): Html => {
  if (model.station !== 'valley') {
    return h.div(
      [h.Class('tabpane')],
      [
        h.p(
          [h.Class('quiet')],
          ['No recording for this station yet. The valley has one.'],
        ),
      ],
    )
  }
  const take = model.weather === 'storm' ? recording.storm : recording.calm
  const cliEvents = JSON.stringify(take.cli.stdout.events)
  const matchesLastRun = Option.match(finishedRecord(model.run), {
    onNone: () => false,
    onSome: record => JSON.stringify(record.events) === cliEvents,
  })
  return h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'Recorded external execution',
        `captured ${recording.recordedAt.slice(0, 10)} with Node ${recording.node} and MCP SDK ${recording.mcpSdk} by running the real CLI and the real stdio server (npm run record). This page did not make these calls.`,
        h,
      ),
      h.h3([], [`CLI · ${model.weather} valley`]),
      h.pre([h.Class('cmd')], [take.cli.command]),
      h.p(
        [h.Class('quietline')],
        [
          `Exit code ${take.cli.exitCode} · ${take.cli.stdout.events.length} engine events · revision ${take.cli.stdout.revisionBefore} → ${take.cli.stdout.revisionAfter}`,
        ],
      ),
      h.p(
        [h.Class('quietline')],
        [
          matchesLastRun
            ? 'Its engine events are identical to your last run in this tab: same code, different entrance.'
            : 'Run connect_places from Forge to Dock on a fresh valley in this tab to compare event for event.',
        ],
      ),
      h.h3([], [`MCP over stdio · ${model.weather} valley`]),
      h.ol(
        [h.Class('log')],
        Array.map(take.mcp, (frame, index) =>
          h.keyed('li')(
            String(index),
            [
              h.DataAttribute(
                'kind',
                frame.direction === 'client → server' ? 'req' : 'res',
              ),
            ],
            [
              h.span([h.Class('n')], [String(index + 1)]),
              h.span([h.Class('hop')], [frame.direction]),
              h.details(
                [h.Class('lab')],
                [
                  h.summary([], [frameLabel(frame.message)]),
                  h.pre([], [JSON.stringify(frame.message, null, 2)]),
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  )
}

// FIVE QUESTIONS

const fiveView = (model: Model, h: H): Html =>
  h.dl(
    [h.Class('five')],
    Array.map(fiveAnswers(model), ({ question, answer }) =>
      h.div(
        [],
        [
          h.dt([], [question]),
          h.dd(
            [h.Class(answer === '' ? 'blank' : '')],
            [answer === '' ? 'Run something first.' : answer],
          ),
        ],
      ),
    ),
  )

// NETWORK

const inRunText = (component: ComponentId, record: RunRecord): string => {
  const events = Array.filter(
    record.events,
    event => event.component === component,
  )
  if (component === 'adapter') {
    return 'Carried the request in.'
  }
  if (Array.isArrayEmpty(events)) {
    return 'Not called in this run.'
  }
  const callers = pipe(
    events,
    Array.map(event => componentNames[event.calledBy]),
    Array.dedupe,
  ).join(', ')
  const failedHere = Option.contains(failureOrigin(record), component)
  return `${failedHere ? 'Failed here. ' : ''}Called by ${callers} · ${events.length} events.`
}

const networkView = (model: Model, h: H): Html => {
  const maybeRecord = finishedRecord(model.run)
  const lastRun = (text: (record: RunRecord) => string): string =>
    Option.match(maybeRecord, { onNone: () => 'No run yet.', onSome: text })
  return h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'Components and their responsibilities',
        'the last column is derived from the engine events of your last run, not from a diagram of what should happen.',
        h,
      ),
      h.div(
        [h.Class('tablewrap')],
        [
          h.table(
            [],
            [
              h.thead(
                [],
                [
                  h.tr(
                    [],
                    [
                      h.th([h.Scope('col')], ['Component']),
                      h.th([h.Scope('col')], ['Responsibility']),
                      h.th([h.Scope('col')], ['Where it runs']),
                      h.th([h.Scope('col')], ['In your last run']),
                    ],
                  ),
                ],
              ),
              h.tbody(
                [],
                [
                  networkRow(
                    'You',
                    'Choose an item and press Execute.',
                    'At the keyboard',
                    lastRun(() => 'Started it.'),
                    h,
                  ),
                  networkRow(
                    'Foldkit app',
                    'Holds the lab state and turns a click into a command.',
                    'This browser tab',
                    lastRun(() => 'Dispatched the command.'),
                    h,
                  ),
                  ...Array.map(componentsOf(model.station), component =>
                    networkRow(
                      componentNames[component],
                      componentRoles[component],
                      'This browser tab',
                      lastRun(record => inRunText(component, record)),
                      h,
                    ),
                  ),
                  networkRow(
                    'CLI adapter',
                    'Another entrance to the same engine.',
                    'A terminal process on your machine',
                    'Not part of runs from this page. See the recording.',
                    h,
                  ),
                  networkRow(
                    'MCP stdio server',
                    'Another entrance: lists the kit as tools and the map as a resource.',
                    'A process started by an MCP client',
                    'Not part of runs from this page. See the recording.',
                    h,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  )
}

const networkRow = (
  name: string,
  role: string,
  where: string,
  inRun: string,
  h: H,
): Html =>
  h.keyed('tr')(
    name,
    [],
    [
      h.th([h.Scope('row')], [name]),
      h.td([], [role]),
      h.td([], [where]),
      h.td([], [inRun]),
    ],
  )
