import { Array, Option, pipe } from 'effect'
import { type Document, type Html, type HtmlBuilder } from 'foldkit/html'

import route from '../../specimens/route.json'
import { STAGE_PAUSE_MILLISECONDS } from '../adapters/in-process.ts'
import {
  type Capability,
  type CapabilityName,
  type RunRecord,
  catalogue,
} from '../domain/capabilities.ts'
import { pathLabel } from '../domain/memory.ts'
import type { ComponentId, EngineEvent } from '../domain/services.ts'
import { NO_ARTIFACT } from '../domain/world.ts'
import recording from '../recordings/entrances.json'
import { benchView, bendLabel, bendView } from './benches.ts'
import { Message } from './message.ts'
import {
  type BackstageTab,
  type Chapter,
  type Model,
  Replay,
  RunState,
  type Station,
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
      'The path builder changes the map. Use it and watch the revision and the artifact.',
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

type JourneyPhase = 'inventory' | 'workshop' | 'follow'

const phaseNames: Record<JourneyPhase, string> = {
  inventory: 'Explore the inventory',
  workshop: 'Open the workshop',
  follow: 'Follow the work',
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

const stationNames: Record<Station, string> = {
  valley: 'The valley',
  fetch: 'Fetch a page',
  memory: 'Memory',
  thinking: 'Thinking as a tool',
  filesystem: 'Filesystem',
  perception: 'Browser perception',
  cli: 'A generated CLI',
  'local-remote': 'Local and remote',
  apps: 'An interactive map',
  'code-mode': 'One item, a language',
  delegation: 'Another intelligence',
  iteration: 'A loop that refines',
  network: 'The network',
}

const stationTitle = (station: Station): string => stationNames[station]

const stationNumber = (station: Station): string =>
  String(stations.indexOf(station)).padStart(2, '0')

const phaseHints: Record<JourneyPhase, string> = {
  inventory: 'what is on offer',
  workshop: 'what is inside an item',
  follow: 'where it goes afterwards',
}

const findSpecimen = (station: Station): Option.Option<Specimen> =>
  Array.findFirst(route.specimens, specimen => specimen.id === station)

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
  if (output._tag === 'EntryWritten') {
    return `Wrote “${output.load}”. The ledger now has ${output.entriesNow} entr${output.entriesNow === 1 ? 'y' : 'ies'}.`
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
        : 'You, by pressing a button on the bench. No model is involved on this page.'
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
  body:
    model.screen === 'home'
      ? h.div(
          [h.Class('ide home')],
          [titlebarView(model, h), homeView(model, h), statusbarView(model, h)],
        )
      : h.div(
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

const brandView = (h: H): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class('brand'),
      h.AriaLabel('MCP Lab, the whole route'),
      h.OnClick(Message.ClickedHome()),
    ],
    [
      h.span([h.Class('brandmark'), h.AriaHidden(true)], []),
      h.span([h.Class('brandname')], ['MCP Lab']),
    ],
  )

const titlebarView = (model: Model, h: H): Html =>
  h.header(
    [h.Class('titlebar')],
    [
      model.screen === 'home' ? brandView(h) : h.empty,
      h.p(
        [h.Class('location'), h.AriaLabel('Current location')],
        model.screen === 'home'
          ? [h.b([], ['The route'])]
          : [
              `${phaseNames[phaseOf[model.station]]} / `,
              h.b([], [stationTitle(model.station)]),
            ],
      ),
      h.span(
        [h.Class('simtag')],
        [
          model.connection === 'connected'
            ? 'Real MCP · made-up data'
            : model.connection === 'connecting'
              ? 'Connecting…'
              : 'Offline · made-up data',
        ],
      ),
    ],
  )

// SIDEBAR

const stationButton = (model: Model, station: Station, h: H): Html =>
  h.button(
    [
      h.Type('button'),
      h.Class('rung'),
      h.AriaCurrent(station === model.station ? 'page' : 'false'),
      h.OnClick(Message.SelectedStation({ station })),
    ],
    [
      h.span(
        [
          h.Class(
            model.savedRuns.some(
              entry =>
                entry.station === station &&
                !RunState.isAnyOf(['Idle'])(entry.run),
            ) || station === model.station
              ? 'dot seen'
              : 'dot',
          ),
        ],
        [],
      ),
      h.span([h.Class('t')], [stationTitle(station)]),
      h.span([h.Class('n')], [stationNumber(station)]),
    ],
  )

const journeyView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('journey-groups')],
    [
      brandView(h),
      ...Array.map(phaseOrder, phase =>
        h.keyed('section')(
          phase,
          [h.Class('side-section')],
          [
            h.h2([h.Class('side-title')], [phaseNames[phase]]),
            h.ol(
              [h.Class('journey')],
              Array.map(phaseStations(phase), station =>
                h.keyed('li')(
                  station,
                  [],
                  [
                    stationButton(model, station, h),
                    station === 'valley' && model.station === 'valley'
                      ? h.ol(
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
                                      model.chapter === chapter.id
                                        ? 'step'
                                        : 'false',
                                    ),
                                    h.OnClick(
                                      Message.ClickedChapter({
                                        chapter: chapter.id,
                                      }),
                                    ),
                                  ],
                                  [
                                    h.span([h.Class('n')], [`${index + 1}`]),
                                    h.span([h.Class('t')], [chapter.name]),
                                    h.span(
                                      [h.Class('k')],
                                      [
                                        model.completedChapters.includes(
                                          chapter.id,
                                        )
                                          ? 'done'
                                          : '',
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        )
                      : h.empty,
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    ],
  )

const offeredCapabilities = (model: Model): ReadonlyArray<Capability> =>
  model.connection === 'connected'
    ? Array.flatMap(model.tools, tool =>
        Array.filter(catalogue, capability => capability.name === tool.name),
      )
    : Array.filter(
        catalogue,
        capability => capability.specimen === model.station,
      )

const kitView = (model: Model, h: H): Html =>
  h.section(
    [h.Class('side-section kit')],
    [
      h.h2([h.Class('side-title')], ['Handed to you here']),
      h.ul(
        [h.Class('slots')],
        Array.map(offeredCapabilities(model), capability =>
          h.keyed('li')(capability.name, [], [slotView(model, capability, h)]),
        ),
      ),
      h.p(
        [h.Class('side-note')],
        [
          model.connection === 'connected'
            ? 'This list is the server’s answer to tools/list. Enter another station and the server sends a new one.'
            : model.connection === 'connecting'
              ? 'Connecting to the server in this tab…'
              : 'The in-tab server is not available. Showing the lab’s own list.',
        ],
      ),
    ],
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
    [h.Class('inspector'), h.AriaLabel('Evidence')],
    [
      h.div(
        [h.Class('card ran')],
        [
          h.div(
            [h.Class('cardhead')],
            [
              h.h3([], ['On the wire']),
              h.span(
                [h.Class('meta')],
                [`${model.frames.length} frames in this tab`],
              ),
            ],
          ),
          Array.match(Array.takeRight(model.frames, 6), {
            onEmpty: () =>
              h.p([h.Class('side-note')], ['Nothing has crossed yet.']),
            onNonEmpty: frames =>
              h.ol(
                [h.Class('wire')],
                Array.map(frames, (frame, index) =>
                  h.keyed('li')(
                    `${model.frames.length}-${index}`,
                    [
                      h.DataAttribute(
                        'kind',
                        frame.direction === 'client → server' ? 'req' : 'res',
                      ),
                    ],
                    [
                      h.span(
                        [h.Class('arrow'), h.AriaHidden(true)],
                        [frame.direction === 'client → server' ? '→' : '←'],
                      ),
                      h.span([h.Class('lab')], [frame.label]),
                    ],
                  ),
                ),
              ),
          }),
          h.button(
            [
              h.Type('button'),
              h.Class('btn ghost small'),
              h.OnClick(Message.SelectedTab({ tab: 'frames' })),
            ],
            ['Open the frames'],
          ),
        ],
      ),
      Option.match(Option.flatMap(model.maybeSelected, findCapability), {
        onNone: () => h.empty,
        onSome: capability => cardView(capability, h),
      }),
      Option.match(finishedRecord(model.run), {
        onNone: () => h.empty,
        onSome: () =>
          h.div(
            [h.Class('card')],
            [h.h3([], ['About your last run']), fiveView(model, h)],
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

const specimenView = (specimen: Specimen, title: string, h: H): Html =>
  h.div(
    [h.Class('specimen')],
    [
      h.div(
        [h.Class('prompt')],
        [
          h.div(
            [],
            [
              h.p(
                [h.Class('kicker')],
                [
                  `Station ${String(specimen.number).padStart(2, '0')} · ${title} · after ${specimen.anchor.repo}`,
                ],
              ),
              h.h2([h.Class('question')], [specimen.question]),
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

// ONSTAGE

const benchToolsView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('benchtools')],
    [
      bendView(model, h),
      RunState.isAnyOf(['Running'])(model.run)
        ? h.button(
            [
              h.Type('button'),
              h.Class('btn ghost small'),
              h.OnClick(Message.ClickedCancel()),
            ],
            ['Cancel'],
          )
        : h.empty,
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

const valleyHeadView = (model: Model, h: H): Html => {
  const index = chapters.findIndex(chapter => chapter.id === model.chapter)
  const maybeNext = Option.fromNullishOr(chapters[index + 1])
  return pipe(
    Option.fromNullishOr(chapters[index]),
    Option.match({
      onNone: () => h.empty,
      onSome: chapter =>
        h.div(
          [h.Class('prompt')],
          [
            h.div(
              [],
              [
                h.p(
                  [h.Class('kicker')],
                  [`Station 00 · The valley · ${chapter.name}`],
                ),
                h.h2([h.Class('question')], [chapter.prompt]),
              ],
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
  )
}

const workbenchView = (model: Model, h: H): Html =>
  h.main(
    [h.Class('workbench'), h.AriaLabel('Workbench')],
    [
      h.div(
        [h.Class('panehead')],
        [
          h.span([h.Class('eyebrow')], ['Onstage · what you see']),
          model.station === 'code-mode' &&
          model.python !== 'idle' &&
          RunState.isAnyOf(['Idle'])(model.run)
            ? pythonPill(model, h)
            : runPill(model.run, h),
        ],
      ),
      Option.match(findSpecimen(model.station), {
        onNone: () => valleyHeadView(model, h),
        onSome: specimen =>
          specimenView(specimen, stationTitle(model.station), h),
      }),
      benchToolsView(model, h),
      model.station === 'code-mode' &&
      model.python !== 'idle' &&
      RunState.isAnyOf(['Idle'])(model.run)
        ? h.empty
        : resultView(model, h),
      ...benchView(model, h),
    ],
  )

// HOME

const valleyQuestion = 'A map you can read, ask, change and hand a goal to.'

const hasVisited = (model: Model, station: Station): boolean =>
  model.savedRuns.some(
    entry =>
      entry.station === station && !RunState.isAnyOf(['Idle'])(entry.run),
  )

const statView = (
  label: string,
  value: string,
  note: string,
  h: H,
  tone: 'plain' | 'warn' = 'plain',
): Html =>
  h.div(
    [h.Class(`stat ${tone}`)],
    [
      h.span([h.Class('stat-label')], [label]),
      h.b([h.Class('stat-value')], [value]),
      h.span([h.Class('stat-note')], [note]),
    ],
  )

const stationCardView = (model: Model, station: Station, h: H): Html => {
  const maybeSpecimen = findSpecimen(station)
  const isHere = station === model.station
  return h.button(
    [
      h.Type('button'),
      h.Class(`stationcard ${isHere ? 'here' : ''}`),
      h.OnClick(Message.SelectedStation({ station })),
    ],
    [
      h.span(
        [h.Class('stationcard-head')],
        [
          h.span([h.Class('n')], [stationNumber(station)]),
          h.b([], [stationTitle(station)]),
          h.span(
            [
              h.Class(
                `tag ${isHere ? 'here' : hasVisited(model, station) ? 'ok' : 'quiet'}`,
              ),
            ],
            [
              isHere
                ? 'you are here'
                : hasVisited(model, station)
                  ? 'visited'
                  : 'not yet',
            ],
          ),
        ],
      ),
      h.span(
        [h.Class('stationcard-q')],
        [
          Option.match(maybeSpecimen, {
            onNone: () => valleyQuestion,
            onSome: specimen => specimen.question,
          }),
        ],
      ),
      h.span(
        [h.Class('stationcard-foot')],
        [
          h.span(
            [h.Class('src')],
            [
              Option.match(maybeSpecimen, {
                onNone: () => 'this lab',
                onSome: specimen => specimen.anchor.repo,
              }),
            ],
          ),
          h.span([], [`bend: ${bendLabel(station).toLowerCase()}`]),
        ],
      ),
    ],
  )
}

const homeView = (model: Model, h: H): Html =>
  h.main(
    [h.Class('home-main'), h.AriaLabel('The route')],
    [
      h.div(
        [h.Class('home-head')],
        [
          h.div(
            [],
            [
              h.p([h.Class('kicker')], ['The route, easy to strange']),
              h.h1([h.Class('home-title')], ['What were you just handed?']),
              h.p(
                [h.Class('home-lede')],
                [
                  'Thirteen small machines. Each hands you a tool, lets you use it, then lets you bend it until it shows what it really is.',
                ],
              ),
            ],
          ),
          h.button(
            [
              h.Type('button'),
              h.Class('btn'),
              h.OnClick(Message.SelectedStation({ station: model.station })),
            ],
            [
              model.station === 'valley' && !hasVisited(model, 'valley')
                ? 'Start in the valley'
                : `Continue at ${stationTitle(model.station)}`,
            ],
          ),
        ],
      ),
      h.div(
        [h.Class('stats')],
        [
          statView(
            'Stations you can run',
            String(stations.length),
            'the valley plus twelve specimens',
            h,
          ),
          statView(
            'Tools in the kits',
            String(catalogue.length),
            'one engine behind browser, CLI and MCP',
            h,
          ),
          statView(
            'Live connections',
            '0',
            'every model is a scripted stand-in',
            h,
          ),
          statView(
            'Upstream revisions pinned',
            `0 of ${route.specimens.length}`,
            'sources read, none pinned to a commit',
            h,
            'warn',
          ),
        ],
      ),
      h.div(
        [h.Class('phases')],
        Array.map(phaseOrder, phase =>
          h.keyed('section')(
            phase,
            [h.Class('phase')],
            [
              h.div(
                [h.Class('phase-head')],
                [
                  h.h2([], [phaseNames[phase]]),
                  h.span([], [phaseHints[phase]]),
                  h.span(
                    [h.Class('count')],
                    [String(phaseStations(phase).length)],
                  ),
                ],
              ),
              ...Array.map(phaseStations(phase), station =>
                stationCardView(model, station, h),
              ),
            ],
          ),
        ),
      ),
    ],
  )

const pythonPill = (model: Model, h: H): Html =>
  model.python === 'running'
    ? h.span([h.Class('pill busy')], ['Running Python'])
    : model.python === 'unavailable'
      ? h.span([h.Class('pill warn')], ['Python unavailable'])
      : model.pythonError === ''
        ? h.span([h.Class('pill ok')], ['Python finished'])
        : h.span([h.Class('pill warn')], ['Python stopped'])

const runPill = (run: RunState, h: H): Html =>
  RunState.match(run, {
    Idle: () => h.span([h.Class('pill')], ['Idle']),
    Running: ({ capability }) =>
      h.span([h.Class('pill busy')], [`Running ${capability}`]),
    Succeeded: () => h.span([h.Class('pill ok')], ['Succeeded']),
    Failed: () => h.span([h.Class('pill warn')], ['Failed']),
    Cancelled: () => h.span([h.Class('pill')], ['Cancelled']),
  })

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
    Idle: () =>
      h.p(
        [h.Class('result idle')],
        [
          'Nothing run yet. Use something on the bench; what happens shows here.',
        ],
      ),
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

// BACKSTAGE

const tabs: ReadonlyArray<Readonly<{ id: BackstageTab; label: string }>> = [
  { id: 'frames', label: 'MCP frames' },
  { id: 'console', label: 'Call console' },
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
        : model.tab === 'console'
          ? consoleTabView(model, h)
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

const consolePresets: ReadonlyArray<Readonly<{ id: string; label: string }>> = [
  { id: 'valid', label: 'A valid call' },
  { id: 'wrong-arguments', label: 'Wrong arguments' },
  { id: 'no-name', label: 'No tool name' },
  { id: 'unknown-method', label: 'Unknown method' },
  { id: 'not-a-request', label: 'Not a request' },
  { id: 'not-json', label: 'Not JSON' },
]

const consoleTabView = (model: Model, h: H): Html =>
  h.div(
    [h.Class('tabpane')],
    [
      modeView(
        'Your own message',
        'sent exactly as written to the real server in this tab, past the client’s checks. Break it and see what comes back.',
        h,
      ),
      h.div(
        [h.Class('presets'), h.Role('group'), h.AriaLabel('Start from')],
        Array.map(consolePresets, preset =>
          h.button(
            [
              h.Type('button'),
              h.OnClick(Message.ClickedConsolePreset({ preset: preset.id })),
            ],
            [preset.label],
          ),
        ),
      ),
      h.label(
        [h.For('console-text'), h.Class('console-label')],
        ['Message to send'],
      ),
      h.textarea([
        h.Id('console-text'),
        h.Class('console-text'),
        h.Rows(9),
        h.Spellcheck(false),
        h.Value(model.consoleText),
        h.OnInput(value => Message.UpdatedConsoleText({ value })),
      ]),
      h.div(
        [h.Class('replay')],
        [
          h.button(
            [
              h.Type('button'),
              h.Class('send'),
              h.Disabled(model.consoleText.trim() === ''),
              h.OnClick(Message.ClickedSendRaw()),
            ],
            ['Send to the server'],
          ),
          h.span([h.Class('count'), h.AriaLive('polite')], [model.consoleNote]),
        ],
      ),
      h.ol(
        [h.Class('log')],
        Array.map(Array.takeRight(model.frames, 4), (frame, index) =>
          h.keyed('li')(
            `${model.frames.length}-${index}`,
            [
              h.DataAttribute(
                'kind',
                frame.direction === 'client → server' ? 'req' : 'res',
              ),
            ],
            [
              h.span([h.Class('n')], ['·']),
              h.span([h.Class('hop')], [frame.direction]),
              h.details(
                [h.Class('lab'), h.Open(true)],
                [h.summary([], [frame.label]), h.pre([], [frame.json])],
              ),
            ],
          ),
        ),
      ),
    ],
  )

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
                : 'No run yet. Use something on the bench to see what the engine does.',
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
                    'Use something on the bench first.',
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
