import { Array, Option, pipe } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import { type CapabilityName, catalogue } from '../domain/capabilities.ts'
import type { ForeignTool } from '../domain/foreign.ts'
import { listedFromCatalogue, profile } from '../domain/lens.ts'
import {
  type Interaction,
  type ModuleId,
  cannotSeeInList,
  guessModule,
  interactionsOf,
  moduleOf,
  modules,
} from '../domain/modules.ts'
import type { ComponentId } from '../domain/services.ts'
import { beltOf, calledTools } from './belt.ts'
import { componentNames, componentsOf } from './components.ts'
import { flowOf } from './flow.ts'
import { iconView } from './icons.ts'
import { Message } from './message.ts'
import { type Model, RunState } from './model.ts'
import { serverNames } from './names.ts'
import { finishedRecord } from './update.ts'

type H = HtmlBuilder<Message>

// THE MAP
//
// One fixed canvas for every server: the nine modules of the ladder, laid out
// as a staircase that forks after the application. A server's tool list
// lights the modules it offers; the others stay as blurred outlines, so the
// shape of a server shows at a glance and the next one can be compared with
// it. Lines between lit modules say what the combination can do.

export type MapTool = Readonly<{
  key: string
  label: string
  icon: Option.Option<CapabilityName>
  module: ModuleId
  note: string
  aria: string
  message: Option.Option<Message>
  isSelected: boolean
  isCalled: boolean
  isActive: boolean
  isKin?: boolean
}>

export type MapBehind = Readonly<{
  name: string
  reached: boolean
  changed: boolean
  failed: boolean
}>

export type MapInput = Readonly<{
  mode: 'server' | 'all' | 'foreign' | 'empty'
  title: string
  source: string
  tools: ReadonlyArray<MapTool>
  interactions: ReadonlyArray<Interaction>
  behind: Option.Option<ReadonlyArray<MapBehind>>
  isWorking: boolean
}>

// LAYOUT, in canvas units. Position carries no measurement.

const WIDTH = 1180
const HEIGHT = 720
const CARD_W = 150
const CARD_H = 168

const at: Record<ModuleId, Readonly<{ x: number; y: number }>> = {
  read: { x: 10, y: 530 },
  ask: { x: 170, y: 460 },
  write: { x: 330, y: 390 },
  operate: { x: 490, y: 320 },
  workflow: { x: 650, y: 250 },
  app: { x: 810, y: 180 },
  invent: { x: 1020, y: 10 },
  delegate: { x: 1020, y: 262 },
  world: { x: 1020, y: 514 },
}

const percent = (value: number, of: number): string =>
  `${((value / of) * 100).toFixed(3)}%`

const centre = (id: ModuleId) => ({
  x: at[id].x + CARD_W / 2,
  y: at[id].y + CARD_H / 2,
})

const ladderOrder: ReadonlyArray<ModuleId> = [
  'read',
  'ask',
  'write',
  'operate',
  'workflow',
  'app',
]

const groundView = (input: MapInput, h: H): Html => {
  const steps = Array.zip(ladderOrder, ladderOrder.slice(1))
  const forks: ReadonlyArray<ModuleId> = ['invent', 'delegate', 'world']
  return h.svg(
    [
      h.Class('mm-ground'),
      h.ViewBox(`0 0 ${WIDTH} ${HEIGHT}`),
      h.PreserveAspectRatio('none'),
      h.AriaHidden(true),
    ],
    [
      ...Array.map(steps, ([from, to]) =>
        h.line([
          h.Class('mm-stair'),
          h.X1(String(at[from].x + CARD_W)),
          h.Y1(String(at[from].y + 24)),
          h.X2(String(at[to].x)),
          h.Y2(String(at[to].y + 24)),
        ]),
      ),
      ...Array.map(forks, to =>
        h.path([
          h.Class('mm-fork'),
          h.D(
            `M ${at.app.x + CARD_W} ${at.app.y + CARD_H / 2} C ${at.app.x + CARD_W + 40} ${at.app.y + CARD_H / 2}, ${at[to].x - 40} ${at[to].y + CARD_H / 2}, ${at[to].x} ${at[to].y + CARD_H / 2}`,
          ),
        ]),
      ),
      ...Array.map(input.interactions, edge =>
        h.line([
          h.Class(`mm-edge ${edge.isWarning ? 'warn' : ''}`),
          h.X1(String(centre(edge.from).x)),
          h.Y1(String(centre(edge.from).y)),
          h.X2(String(centre(edge.to).x)),
          h.Y2(String(centre(edge.to).y)),
        ]),
      ),
    ],
  )
}

const toolView = (input: MapInput, tool: MapTool, h: H): Html => {
  const body = [
    Option.match(tool.icon, {
      onNone: () => h.span([h.Class('mm-noicon'), h.AriaHidden(true)], ['?']),
      onSome: name => iconView(name, h),
    }),
    input.mode === 'all'
      ? h.empty
      : h.span([h.Class('mm-tname')], [tool.label.replaceAll('_', '_\u200b')]),
  ]
  const className = `mm-tool ${tool.isActive ? 'active' : ''} ${tool.isCalled ? 'called' : ''} ${tool.isKin === true ? 'kin' : ''}`
  return Option.match(tool.message, {
    onNone: () =>
      h.keyed('span')(
        tool.key,
        [h.Class(className), h.Title(`${tool.label} · ${tool.note}`)],
        body,
      ),
    onSome: message =>
      h.keyed('button')(
        tool.key,
        [
          h.Type('button'),
          h.Class(className),
          h.Title(`${tool.label} · ${tool.note}`),
          h.AriaLabel(tool.aria),
          h.AriaPressed(tool.isSelected ? 'true' : 'false'),
          h.OnClick(message),
        ],
        body,
      ),
  })
}

const moduleView = (input: MapInput, id: ModuleId, h: H): Html => {
  const module = Option.getOrThrow(
    Array.findFirst(modules, entry => entry.id === id),
  )
  const inside = Array.filter(input.tools, tool => tool.module === id)
  const isLit = inside.length > 0
  const isActive = inside.some(tool => tool.isActive)
  const unseen = input.mode === 'foreign' ? cannotSeeInList[id] : undefined
  return h.keyed('div')(
    id,
    [
      h.Class(
        `mm-mod ${isLit ? 'lit' : 'ghost'} ${isActive ? 'active' : ''} ${isActive && input.isWorking ? 'working' : ''} ${unseen === undefined ? '' : 'unseen'}`,
      ),
      h.Style({
        left: percent(at[id].x, WIDTH),
        top: percent(at[id].y, HEIGHT),
        width: percent(CARD_W, WIDTH),
        height: percent(CARD_H, HEIGHT),
      }),
      h.AriaLabel(
        `${module.rung}, ${module.name}: ${isLit ? `${inside.length} tool${inside.length === 1 ? '' : 's'}` : 'not on this server'}`,
      ),
    ],
    [
      h.div(
        [h.Class('mm-head')],
        [
          h.span([h.Class('mm-rung')], [String(module.rung)]),
          h.b([], [module.name]),
        ],
      ),
      h.p([h.Class('mm-q')], [module.question]),
      isLit
        ? h.div(
            [h.Class(`mm-tools ${input.mode === 'all' ? 'icons' : ''}`)],
            Array.map(inside, tool => toolView(input, tool, h)),
          )
        : h.p(
            [h.Class('mm-off')],
            [
              unseen ??
                (input.mode === 'empty'
                  ? module.means
                  : `not on this server · ${module.means}`),
            ],
          ),
    ],
  )
}

const branchLabels = (h: H): ReadonlyArray<Html> =>
  Array.flatMap(modules, module =>
    module.branch === ''
      ? []
      : [
          h.span(
            [
              h.Class('mm-branch'),
              h.Style({
                right: percent(WIDTH - at[module.id].x - CARD_W, WIDTH),
                top: percent(at[module.id].y + CARD_H + 4, HEIGHT),
              }),
            ],
            [module.branch],
          ),
        ],
  )

const chainView = (input: MapInput, h: H): Html =>
  h.div(
    [h.Class('mm-chain'), h.AriaLabel('Where this map sits')],
    [
      h.span([h.Class('mm-link you')], ['You']),
      h.span([h.Class('mm-arrow'), h.AriaHidden(true)], ['→']),
      h.span([h.Class('mm-link host')], ['AI app · the host']),
      h.span([h.Class('mm-arrow'), h.AriaHidden(true)], ['→ MCP →']),
      h.span([h.Class('mm-link server')], [input.title]),
      h.span(
        [h.Class('mm-arrow'), h.AriaHidden(true)],
        ['answers tools/list with'],
      ),
      h.span([h.Class('mm-link list')], ['this map']),
      h.span([h.Class('mm-arrow'), h.AriaHidden(true)], ['→']),
      h.span([h.Class('mm-link behind')], ['what is behind it']),
    ],
  )

const behindView = (input: MapInput, h: H): Html =>
  h.div(
    [h.Class('mm-behind')],
    [
      h.span([h.Class('eyebrow')], ['Behind the list']),
      ...Option.match(input.behind, {
        onNone: () => [
          h.span(
            [h.Class('mm-unknown')],
            [
              input.mode === 'foreign'
                ? 'Unknown. A tool list does not say what runs behind it.'
                : input.mode === 'empty'
                  ? 'Each server has its own parts. Open one to see them.'
                  : 'Pick a server to see its parts.',
            ],
          ),
        ],
        onSome: parts =>
          Array.map(parts, (part, index) =>
            h.keyed('span')(
              `${index}-${part.name}`,
              [
                h.Class(
                  `mm-part ${part.reached ? 'reached' : ''} ${part.changed ? 'changed' : ''} ${part.failed ? 'failed' : ''}`,
                ),
              ],
              [part.name],
            ),
          ),
      }),
    ],
  )

const legendView = (input: MapInput, h: H): Html =>
  h.div(
    [h.Class('mm-legend')],
    [
      h.span([h.Class('mm-key lit')], ['offered']),
      h.span([h.Class('mm-key ghost')], ['not offered']),
      h.span([h.Class('mm-key edge')], ['can combine']),
      h.span([h.Class('mm-key edge warn')], ['combination to watch']),
      h.span([h.Class('mm-source')], [input.source]),
    ],
  )

const edgeListView = (input: MapInput, h: H): Html =>
  Array.match(input.interactions, {
    onEmpty: () => h.empty,
    onNonEmpty: edges =>
      h.ul(
        [h.Class('mm-edges')],
        Array.map(edges, edge =>
          h.keyed('li')(
            `${edge.rule}-${edge.from}-${edge.to}`,
            [h.Class(edge.isWarning ? 'warn' : '')],
            [
              h.b([], [`${moduleName(edge.from)} + ${moduleName(edge.to)}: `]),
              edge.label,
              h.span([h.Class('mm-rule')], [` · ${edge.rule}, inferred`]),
            ],
          ),
        ),
      ),
  })

const moduleName = (id: ModuleId): string =>
  pipe(
    modules,
    Array.findFirst(module => module.id === id),
    Option.match({ onNone: () => id, onSome: module => module.name }),
  )

const summaryView = (input: MapInput, h: H): Html => {
  const lit = Array.dedupe(Array.map(input.tools, tool => tool.module))
  return h.div(
    [h.Class('mm-summary')],
    [
      h.p(
        [h.Class('mm-count')],
        [
          input.mode === 'empty'
            ? 'Nine slots. Nothing lit yet.'
            : input.mode === 'all'
              ? `${input.tools.length} tools from every server, in ${lit.length} of 9 slots`
              : `${input.tools.length} tool${input.tools.length === 1 ? '' : 's'} in ${lit.length} of 9 slots`,
        ],
      ),
      legendView(input, h),
      edgeListView(input, h),
      behindView(input, h),
    ],
  )
}

export const mcpMapView = (input: MapInput, h: H): Html =>
  h.section(
    [
      h.Class(`mcpmap mode-${input.mode}`),
      h.AriaLabel('The map of a tool list'),
    ],
    [
      chainView(input, h),
      h.div(
        [h.Class('mm-canvas')],
        [
          groundView(input, h),
          summaryView(input, h),
          ...branchLabels(h),
          ...Array.map(modules, module => moduleView(input, module.id, h)),
        ],
      ),
    ],
  )

// BUILDERS

const activeName = (model: Model): Option.Option<string> =>
  RunState.match(model.run, {
    Idle: () => Option.none(),
    Running: ({ capability }) => Option.some(capability),
    Succeeded: ({ record }) => Option.some(record.capability),
    Failed: ({ record }) => Option.some(record.capability),
    Cancelled: ({ capability }) => Option.some(capability),
  })

export const emptyMap = (): MapInput => ({
  mode: 'empty',
  title: 'a server',
  source: 'empty: no server yet',
  tools: [],
  interactions: [],
  behind: Option.none(),
  isWorking: false,
})

const claimsOf = (name: CapabilityName) =>
  pipe(
    catalogue,
    Array.findFirst(capability => capability.name === name),
    Option.match({
      onNone: () => [],
      onSome: capability =>
        profile([listedFromCatalogue(capability)]).tools[0]?.claims ?? [],
    }),
  )

export const serverMap = (model: Model): MapInput => {
  const belt = beltOf(model)
  const called = calledTools(model.frames)
  const active = activeName(model)
  const tools: ReadonlyArray<MapTool> = Array.map(belt.tools, capability => ({
    key: capability.name,
    label: capability.name,
    icon: Option.some(capability.name),
    module: moduleOf[capability.name],
    note: capability.title,
    aria: `${capability.title}, ${capability.name}`,
    message: Option.some(Message.SelectedCapability({ name: capability.name })),
    isSelected: Option.contains(model.maybeSelected, capability.name),
    isCalled: called.includes(capability.name),
    isActive: Option.contains(active, capability.name),
  }))
  const lit = Array.map(belt.tools, capability => ({
    name: capability.name,
    module: moduleOf[capability.name],
    claims: claimsOf(capability.name),
  }))
  const maybeRecord = finishedRecord(model.run)
  const reached: ReadonlyArray<
    Readonly<{ component: ComponentId; changed: boolean; failed: boolean }>
  > = Option.match(maybeRecord, {
    onNone: () => [],
    onSome: record => flowOf(record, record.events),
  })
  const parts = Array.filter(
    componentsOf(model.station),
    component => component !== 'adapter' && component !== 'catalogue',
  )
  return {
    mode: 'server',
    title: `the ${serverNames[model.station]}`,
    source:
      belt.source === 'server'
        ? 'lit from its tools/list answer in this tab · modules placed by the lab'
        : 'lit from the lab’s catalogue · modules placed by the lab',
    tools,
    interactions: interactionsOf(lit),
    behind: Option.some(
      Array.map(parts, component => {
        const stop = reached.find(entry => entry.component === component)
        return {
          name: componentNames[component],
          reached: stop !== undefined,
          changed: stop?.changed ?? false,
          failed: stop?.failed ?? false,
        }
      }),
    ),
    isWorking: RunState.isAnyOf(['Running'])(model.run),
  }
}

export const allMap = (model: Model): MapInput => {
  const called = calledTools(model.frames)
  const selectedServer = pipe(
    model.maybeSelected,
    Option.flatMap(name =>
      Array.findFirst(catalogue, capability => capability.name === name),
    ),
    Option.map(capability => capability.specimen),
  )
  return {
    mode: 'all',
    title: 'every server in the lab',
    source:
      'all servers at once · modules placed by the lab · select a tool to outline the rest of its server',
    tools: Array.map(catalogue, capability => ({
      key: capability.name,
      label: capability.name,
      icon: Option.some(capability.name),
      module: moduleOf[capability.name],
      note: `${capability.title}, ${serverNames[capability.specimen]}`,
      aria: `${capability.title}, ${capability.name}, ${serverNames[capability.specimen]}`,
      message: Option.some(
        Message.SelectedCapability({ name: capability.name }),
      ),
      isSelected: Option.contains(model.maybeSelected, capability.name),
      isCalled: called.includes(capability.name),
      isActive: false,
      isKin:
        !Option.contains(model.maybeSelected, capability.name) &&
        Option.contains(selectedServer, capability.specimen),
    })),
    interactions: [],
    behind: Option.none(),
    isWorking: false,
  }
}

export const foreignMap = (tools: ReadonlyArray<ForeignTool>): MapInput => {
  const placed = Array.map(tools, tool => ({
    tool,
    guess: guessModule(tool),
  }))
  return {
    mode: 'foreign',
    title: 'your server',
    source:
      'lit from the pasted listing · modules are guesses, each names its basis',
    tools: Array.map(placed, ({ tool, guess }) => ({
      key: tool.name,
      label: tool.name,
      icon: Option.none(),
      module: guess.module,
      note: `guessed: ${guess.basis}`,
      aria: `${tool.name}, guessed: ${guess.basis}`,
      message: Option.none(),
      isSelected: false,
      isCalled: false,
      isActive: false,
    })),
    interactions: interactionsOf(
      Array.map(placed, ({ tool, guess }) => ({
        name: tool.name,
        module: guess.module,
        claims: tool.claims,
      })),
    ),
    behind: Option.none(),
    isWorking: false,
  }
}
