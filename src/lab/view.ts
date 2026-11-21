import { Array, Option, pipe } from 'effect'
import { type Document, type Html, type HtmlBuilder } from 'foldkit/html'

import { STAGE_PAUSE_MILLISECONDS } from '../adapters/in-process.ts'
import {
  type Capability,
  type CapabilityName,
  type RunRecord,
  catalogue,
} from '../domain/capabilities.ts'
import type { ComponentId, EngineEvent } from '../domain/services.ts'
import { type Path, type PlaceId, type World, joins } from '../domain/world.ts'
import recording from '../recordings/entrances.json'
import { Message } from './message.ts'
import {
  type BackstageTab,
  type Chapter,
  type Model,
  Replay,
  RunState,
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

const plannedChapters: ReadonlyArray<string> = [
  'Local and remote',
  'Workflows and loops',
  'A stronger model inside',
  'The network of workshops',
  'Real MCP examples',
]

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
    name: 'Open the workshop',
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
}

const engineComponents: ReadonlyArray<ComponentId> = [
  'adapter',
  'catalogue',
  'planner',
  'map',
  'validator',
  'world-store',
  'artifact-store',
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
    ask('Who authorised it?', record =>
      record.events.some(event => event.component === 'validator')
        ? 'Nobody was asked. The validator enforced the span limit in code; there is no approval step here.'
        : 'Nobody was asked, and nothing could change.',
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
      record.revisionAfter === record.revisionBefore
        ? `Nothing. The map stayed at revision ${record.revisionAfter}.`
        : `The map went from revision ${record.revisionBefore} to ${record.revisionAfter}.`,
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
    [h.Class('ide')],
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
      h.p([h.Class('tagline')], ['What were you just handed?']),
      h.div(
        [h.Class('bend')],
        [
          h.span([h.Class('bendlabel')], ['Bend it']),
          h.div(
            [h.Class('seg'), h.Role('group'), h.AriaLabel('Weather')],
            [
              weatherButton(model, 'calm', 'Calm', h),
              weatherButton(model, 'storm', 'Storm', h),
            ],
          ),
        ],
      ),
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
      h.h2([h.Class('side-title')], ['Journey · easy to complex']),
      h.ol(
        [h.Class('journey')],
        [
          ...Array.map(chapters, (chapter, index) =>
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
                    h.OnClick(Message.ClickedChapter({ chapter: chapter.id })),
                  ],
                  [
                    h.span([h.Class('n')], [`0${index + 1}`]),
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
          ...Array.map(plannedChapters, (name, index) =>
            h.keyed('li')(
              name,
              [h.Class('rung planned')],
              [
                h.span(
                  [h.Class('n')],
                  [String(chapters.length + index + 1).padStart(2, '0')],
                ),
                h.span([h.Class('t')], [name]),
                h.span([h.Class('k')], ['planned']),
              ],
            ),
          ),
        ],
      ),
    ],
  )

const kitView = (model: Model, h: H): Html =>
  h.section(
    [h.Class('side-section')],
    [
      h.h2([h.Class('side-title')], ['Your kit · 4 items']),
      h.ul(
        [h.Class('slots')],
        Array.map(catalogue, capability =>
          h.keyed('li')(capability.name, [], [slotView(model, capability, h)]),
        ),
      ),
      h.p(
        [h.Class('side-note')],
        [
          'Discovering an item is not permission to use it. On this page nothing checks who you are.',
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
    [h.Class('inspector'), h.AriaLabel('Inspector')],
    [
      h.h2([h.Class('side-title')], ['Inspector']),
      Option.match(Option.flatMap(model.maybeSelected, findCapability), {
        onNone: () =>
          h.p(
            [h.Class('side-note')],
            ['Pick an item from the kit to see what it really is.'],
          ),
        onSome: capability => cardView(capability, h),
      }),
      h.h2([h.Class('side-title')], ['Five questions about your last run']),
      fiveView(model, h),
    ],
  )

const cardView = (capability: Capability, h: H): Html =>
  h.div(
    [h.Class('card')],
    [
      h.h3([], [`${capability.title} · ${capability.name}`]),
      h.p([h.Class('desc')], [capability.description]),
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
  )

const factView = (question: string, answer: string, h: H): Html =>
  h.div([], [h.dt([], [question]), h.dd([], [answer])])

// STATUS BAR

const statusbarView = (model: Model, h: H): Html =>
  h.footer(
    [h.Class('statusbar')],
    [
      h.span([], ['Simulation: the engine runs in this tab']),
      h.span([], ['No model · no live MCP connection']),
      h.span(
        [],
        [`${model.weather} valley · map revision ${model.world.revision}`],
      ),
    ],
  )

// ONSTAGE

const workbenchView = (model: Model, h: H): Html => {
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
          capability.takesEndpoints
            ? placeSelect(
                'from',
                'From',
                model.from,
                model.world,
                value => Message.SelectedFrom({ value }),
                h,
              )
            : h.empty,
          capability.takesEndpoints
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
          h.button(
            [
              h.Type('button'),
              h.Class('btn ghost'),
              h.OnClick(Message.ClickedReset()),
            ],
            ['Reset the valley'],
          ),
        ],
      ),
  })
}

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
      h.p([h.Class('result ok'), h.AriaLive('polite')], [outcomeText(record)]),
    Failed: ({ record }) =>
      h.div(
        [h.Class('result warn'), h.AriaLive('polite')],
        [
          h.p([], [outcomeText(record)]),
          h.p(
            [],
            [
              record.revisionAfter === record.revisionBefore
                ? `Nothing was built. The map is still at revision ${record.revisionAfter}.`
                : `The map changed before the failure: revision ${record.revisionBefore} → ${record.revisionAfter}.`,
            ],
          ),
        ],
      ),
    Cancelled: ({ capability }) =>
      h.p(
        [h.Class('result'), h.AriaLive('polite')],
        [
          `You cancelled ${capability} before the engine reported. On this page the map is only replaced when a run reports back, so nothing changed.`,
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
        [h.span([h.Class('eyebrow')], ['Backstage · what actually happened'])],
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
      model.tab === 'engine'
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
        'emitted by the engine as it ran in this tab. Not MCP traffic.',
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
                  ...Array.map(engineComponents, component =>
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
