import { Array, Option } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import { type CapabilityName, catalogue } from '../domain/capabilities.ts'
import type { ForeignTool } from '../domain/foreign.ts'
import {
  type ModuleId,
  type NeighbourId,
  guessModule,
  modules,
  neighbourIds,
  neighbourNames,
  placeOf,
} from '../domain/modules.ts'
import { beltOf, calledTools } from './belt.ts'
import {
  type Place,
  iconView,
  neighbourIcons,
  placeOfSlot,
  slotIcons,
} from './icons.ts'
import { Message } from './message.ts'
import { type Model, RunState } from './model.ts'
import { serverNames } from './names.ts'
import { type Scene, allScene, darkScene, sceneOf } from './scenes.ts'

type H = HtmlBuilder<Message>

// THE WORKSHOP CANVAS
//
// You and the AI app outside on the left. MCP is the front desk, its board
// the tools/list answer. Behind it the server's workshop: nine slots where
// you would expect them. Outside the walls, the neighbours the tools reach.
// A call is drawn as desk → slot → neighbour. Amber marks a rule in a wall
// opening, or something that goes back out to you through the desk.

export type MapTool = Readonly<{
  key: string
  label: string
  title: string
  icon: Option.Option<CapabilityName>
  slot: ModuleId
  reach: ReadonlyArray<NeighbourId>
  aria: string
  message: Option.Option<Message>
  isSelected: boolean
  isCalled: boolean
  isActive: boolean
}>

export type MapInput = Readonly<{
  mode: 'server' | 'all' | 'foreign' | 'empty'
  title: string
  tools: ReadonlyArray<MapTool>
  scene: Scene
  isWorking: boolean
}>

// GEOMETRY, in canvas units. Places carry meaning, not measurement.

const VIEW = { w: 1240, h: 800 }
const ROOM = { x: 380, y: 130, w: 600, h: 530 }
const SLOT = 64
const DOOR = { x: 300, y: 360 }

const slotAt: Record<ModuleId, readonly [number, number]> = {
  read: [ROOM.x + 160, ROOM.y + 66],
  write: [ROOM.x + 420, ROOM.y + 66],
  compute: [ROOM.x + 230, ROOM.y + 260],
  sequence: [ROOM.x + 320, ROOM.y + 260],
  invent: [ROOM.x + 410, ROOM.y + 260],
  delegate: [ROOM.x + ROOM.w - 38, ROOM.y + 220],
  ask: [ROOM.x + 120, ROOM.y + 180],
  share: [ROOM.x + 120, ROOM.y + 330],
  act: [ROOM.x + 450, ROOM.y + ROOM.h - 90],
}

const neighbourAt: Record<NeighbourId, readonly [number, number]> = {
  web: [ROOM.x + 80, 50],
  files: [ROOM.x + 240, 50],
  store: [ROOM.x + 420, 50],
  llm: [1120, ROOM.y + 140],
  program: [1120, ROOM.y + 330],
  world: [ROOM.x + 450, 740],
}

const openingAt: Record<NeighbourId, readonly [number, number]> = {
  web: [ROOM.x + 80, ROOM.y],
  files: [ROOM.x + 240, ROOM.y],
  store: [ROOM.x + 420, ROOM.y],
  llm: [ROOM.x + ROOM.w, ROOM.y + 220],
  program: [ROOM.x + ROOM.w, ROOM.y + 220],
  world: [ROOM.x + 450, ROOM.y + ROOM.h],
}

const neighbourPlace: Record<NeighbourId, Place> = {
  web: 'shelf',
  files: 'shelf',
  store: 'shelf',
  llm: 'phone',
  program: 'phone',
  world: 'dock',
}

const iconAt = (
  paths: ReadonlyArray<string>,
  x: number,
  y: number,
  scale: number,
  className: string,
  h: H,
): Html =>
  h.g(
    [
      h.Class(className),
      h.Transform(
        `translate(${x - 12 * scale} ${y - 12 * scale}) scale(${scale})`,
      ),
    ],
    Array.map(paths, d => h.path([h.D(d)])),
  )

const label = (
  x: number,
  y: number,
  className: string,
  value: string,
  h: H,
  anchor: 'start' | 'middle' | 'end' = 'middle',
): Html =>
  h.text(
    [h.X(String(x)), h.Y(String(y)), h.Class(className), h.TextAnchor(anchor)],
    [value],
  )

const curve = (
  a: readonly [number, number],
  b: readonly [number, number],
): string => {
  const mx = (a[0] + b[0]) / 2
  return `M ${a[0]} ${a[1]} C ${mx} ${a[1]}, ${mx} ${b[1]}, ${b[0]} ${b[1]}`
}

const short = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value

// PARTS

const outsideView = (input: MapInput, h: H): ReadonlyArray<Html> => {
  const host = (y: number, name: string, sub: string) =>
    h.g(
      [h.Class('ws-host')],
      [
        h.rect([
          h.X('20'),
          h.Y(String(y)),
          h.Width('150'),
          h.Height('120'),
          h.Rx('16'),
        ]),
        iconAt(neighbourIcons.bot, 95, y + 38, 1.6, 'ws-ico on', h),
        label(95, y + 82, 'ws-host-name', name, h),
        label(95, y + 100, 'ws-host-sub', sub, h),
      ],
    )
  const asksYou = input.tools.some(
    tool => tool.slot === 'ask' || tool.slot === 'share',
  )
  return [
    h.path([h.Class('ws-wire'), h.D('M 95 234 V 300')]),
    h.g(
      [h.Class(`ws-nb place-desk ${asksYou ? 'lit' : ''}`)],
      [
        h.circle([h.Cx('95'), h.Cy('200'), h.R('30')]),
        iconAt(neighbourIcons.you, 95, 200, 1.17, 'ws-ico', h),
        label(135, 204, 'ws-name', 'you', h, 'start'),
      ],
    ),
    host(300, 'AI app', 'the model stays here'),
    input.scene.building === 'shared'
      ? host(470, 'AI app B', 'another visitor')
      : h.empty,
  ]
}

const boardView = (
  x: number,
  y: number,
  names: ReadonlyArray<string>,
  head: string,
  className: string,
  h: H,
): Html => {
  const shown = names.slice(0, 12)
  const extra = names.length - shown.length
  return h.g(
    [h.Class(className)],
    [
      h.rect([
        h.X(String(x)),
        h.Y(String(y)),
        h.Width('162'),
        h.Height(String(34 + shown.length * 17 + (extra > 0 ? 17 : 0))),
        h.Rx('6'),
      ]),
      label(x + 10, y + 20, 'ws-board-head', head, h, 'start'),
      ...Array.map(shown, (name, index) =>
        label(
          x + 10,
          y + 40 + index * 17,
          'ws-board-item',
          short(name, 20),
          h,
          'start',
        ),
      ),
      extra > 0
        ? label(
            x + 10,
            y + 40 + shown.length * 17,
            'ws-board-item',
            `+${extra} more`,
            h,
            'start',
          )
        : h.empty,
    ],
  )
}

const deskView = (input: MapInput, h: H): ReadonlyArray<Html> => {
  const names = Array.map(input.tools, tool => tool.label)
  return [
    h.rect([
      h.Class('ws-lobby'),
      h.X('205'),
      h.Y('170'),
      h.Width('175'),
      h.Height('450'),
      h.Rx('4'),
    ]),
    label(292, 196, 'ws-zone', 'MCP', h),
    label(292, 212, 'ws-sub', 'the front desk', h),
    boardView(
      211,
      226,
      Array.isReadonlyArrayEmpty(names) ? ['(nothing yet)'] : names,
      'tools/list',
      'ws-board',
      h,
    ),
    ...Array.map(input.scene.desk, (message, index) =>
      label(292, 530 + index * 18, 'ws-desk-msg', message, h),
    ),
    label(292, 604, 'ws-sub', 'the AI sees only the board', h),
    h.path([h.Class('ws-flow'), h.D(`M 170 360 H ${DOOR.x}`)]),
    input.scene.building === 'shared'
      ? h.path([
          h.Class('ws-flow'),
          h.D(`M 170 530 C 240 530, 240 ${DOOR.y}, ${DOOR.x} ${DOOR.y}`),
        ])
      : h.empty,
    input.scene.building === 'copy'
      ? h.g(
          [],
          [
            boardView(
              28,
              470,
              [...names.slice(0, 3), '(schema at copy time)'],
              'generated CLI',
              'ws-board copy',
              h,
            ),
            label(98, 580, 'ws-sub', 'a copy, taken away', h),
          ],
        )
      : h.empty,
  ]
}

const roomView = (input: MapInput, h: H): ReadonlyArray<Html> => {
  const { x, y, w, h: height } = ROOM
  const furniture: ReadonlyArray<readonly [number, number, number, number]> = [
    [x + 30, y + 46, w - 60, 40],
    [x + 170, y + 200, 300, 120],
    [x + w - 60, y + 140, 44, 160],
    [x + 330, y + height - 24, 240, 14],
  ]
  return [
    h.path([
      h.Class('ws-wall'),
      h.D(
        [
          `M ${x} ${y + 200} V ${y} H ${x + 40}`,
          `M ${x + 120} ${y} H ${x + 200}`,
          `M ${x + 280} ${y} H ${x + 380}`,
          `M ${x + 460} ${y} H ${x + w} V ${y + 140}`,
          `M ${x + w} ${y + 300} V ${y + height} H ${x + 490}`,
          `M ${x + 410} ${y + height} H ${x} V ${y + 290}`,
        ].join(' '),
      ),
    ]),
    label(
      x + 16,
      y + height - 14,
      'ws-zone',
      input.scene.building === 'mall'
        ? 'Several servers behind one desk'
        : `${input.title} · its workshop`,
      h,
      'start',
    ),
    ...Array.map(furniture, ([fx, fy, fw, fh]) =>
      h.rect([
        h.Class('ws-furn'),
        h.X(String(fx)),
        h.Y(String(fy)),
        h.Width(String(fw)),
        h.Height(String(fh)),
        h.Rx('8'),
      ]),
    ),
    label(x + w / 2, y + 108, 'ws-furn-label', 'shelf · records', h),
    label(x + 320, y + 340, 'ws-furn-label', 'workbench', h),
    label(x + w - 38, y + 318, 'ws-furn-label', 'phone', h),
    label(x + 450, y + height - 32, 'ws-furn-label', 'loading dock', h),
    label(x + 120, y + 400, 'ws-furn-label', 'back out through the desk', h),
  ]
}

type Line = Readonly<{ d: string; className: string; key: string }>

const linesOf = (input: MapInput): ReadonlyArray<Line> => {
  const slots = Array.dedupe(Array.map(input.tools, tool => tool.slot))
  const hotSlots = Array.dedupe(
    Array.flatMap(input.tools, tool => (tool.isActive ? [tool.slot] : [])),
  )
  const inLines = Array.map(slots, slot => ({
    key: `in-${slot}`,
    d: curve([DOOR.x, DOOR.y], slotAt[slot]),
    className: `ws-flow ${slot === 'ask' || slot === 'share' ? 'back' : ''} ${hotSlots.includes(slot) ? 'hot' : ''}`,
  }))
  const pairs = Array.flatMap(slots, slot =>
    Array.map(
      Array.dedupe(
        Array.flatMap(input.tools, tool =>
          tool.slot === slot ? tool.reach : [],
        ),
      ),
      neighbour => ({ slot, neighbour }),
    ),
  )
  const outLines = Array.map(pairs, pair => {
    const [sx, sy] = slotAt[pair.slot]
    const [nx, ny] = neighbourAt[pair.neighbour]
    const hot = input.tools.some(
      tool =>
        tool.isActive &&
        tool.slot === pair.slot &&
        tool.reach.includes(pair.neighbour),
    )
    return {
      key: `out-${pair.slot}-${pair.neighbour}`,
      d: `M ${sx} ${sy} L ${nx} ${ny}`,
      className: `ws-flow out ${hot ? 'hot' : ''}`,
    }
  })
  return [...inLines, ...outLines]
}

const gatesView = (input: MapInput, h: H): ReadonlyArray<Html> =>
  Array.flatMap(neighbourIds, neighbour => {
    const text = input.scene.gates[neighbour]
    if (
      text === undefined ||
      !input.tools.some(tool => tool.reach.includes(neighbour))
    ) {
      return []
    }
    const [gx, gy] = openingAt[neighbour]
    const across = gy === ROOM.y || gy === ROOM.y + ROOM.h
    return [
      h.rect([
        h.Class('ws-gate'),
        h.X(String(across ? gx - 30 : gx - 5)),
        h.Y(String(across ? gy - 5 : gy - 30)),
        h.Width(across ? '60' : '10'),
        h.Height(across ? '10' : '60'),
        h.Rx('3'),
      ]),
      label(
        across ? gx + 36 : gx - 10,
        across ? gy + (gy === ROOM.y ? 24 : -12) : gy - 38,
        'ws-gate-label',
        text,
        h,
        across ? 'start' : 'end',
      ),
    ]
  })

const slotView = (input: MapInput, id: ModuleId, h: H): Html => {
  const module = modules.find(entry => entry.id === id)
  const inside = Array.filter(input.tools, tool => tool.slot === id)
  const isLit = inside.length > 0
  const isActive = inside.some(tool => tool.isActive)
  const isSelected = inside.some(tool => tool.isSelected)
  const [x, y] = slotAt[id]
  const half = SLOT / 2
  const target = inside.find(tool => Option.isSome(tool.message))
  const body = [
    h.rect([
      h.Class('ws-slot-box'),
      h.X(String(x - half)),
      h.Y(String(y - half)),
      h.Width(String(SLOT)),
      h.Height(String(SLOT)),
      h.Rx('15'),
    ]),
    iconAt(slotIcons[id], x, y - 7, 1.25, 'ws-ico', h),
    label(x, y + half - 9, 'ws-name', module?.word ?? id, h),
    isLit
      ? h.g(
          [],
          [
            h.circle([
              h.Class('ws-badge'),
              h.Cx(String(x + half - 4)),
              h.Cy(String(y - half + 4)),
              h.R('10'),
            ]),
            label(
              x + half - 4,
              y - half + 7.5,
              'ws-count',
              String(inside.length),
              h,
            ),
          ],
        )
      : h.empty,
  ]
  const className = `ws-slot place-${placeOfSlot(id)} ${isLit ? 'lit' : 'ghost'} ${isActive ? 'active' : ''} ${isActive && input.isWorking ? 'working' : ''} ${isSelected ? 'picked' : ''}`
  const name = `${module?.word ?? id}: ${isLit ? inside.map(tool => tool.label).join(', ') : 'not on this server'}`
  return target === undefined
    ? h.keyed('g')(id, [h.Class(className), h.AriaLabel(name)], body)
    : h.keyed('g')(
        id,
        [
          h.Class(className),
          h.Role('button'),
          h.Tabindex(0),
          h.AriaLabel(`${name}. Select to look behind it.`),
          ...Option.match(target.message, {
            onNone: () => [],
            onSome: message => [
              h.OnClick(message),
              h.OnKeyDownPreventDefault(key =>
                key === 'Enter' || key === ' '
                  ? Option.some(message)
                  : Option.none(),
              ),
            ],
          }),
        ],
        body,
      )
}

const neighbourView = (input: MapInput, id: NeighbourId, h: H): Html => {
  const reaching = input.tools.filter(tool => tool.reach.includes(id))
  const isLit = reaching.length > 0
  const isHot = reaching.some(tool => tool.isActive)
  const [x, y] = neighbourAt[id]
  const name = isLit
    ? (input.scene.names[id] ?? neighbourNames[id])
    : neighbourNames[id]
  return h.keyed('g')(
    id,
    [
      h.Class(
        `ws-nb place-${neighbourPlace[id]} ${isLit ? 'lit' : ''} ${isHot ? 'hot' : ''}`,
      ),
      h.AriaLabel(
        `${name}: ${isLit ? `reached by ${reaching.map(tool => tool.label).join(', ')}` : 'not reached'}`,
      ),
    ],
    [
      h.circle([h.Cx(String(x)), h.Cy(String(y)), h.R('30')]),
      iconAt(neighbourIcons[id], x, y, 1.17, 'ws-ico', h),
      label(x, y + 48, 'ws-name', short(name, 30), h),
    ],
  )
}

export const canvasView = (input: MapInput, h: H): Html =>
  h.div(
    [h.Class('ws-scroll')],
    [
      h.svg(
        [
          h.Class(`ws-canvas mode-${input.mode}`),
          h.ViewBox(`0 0 ${VIEW.w} ${VIEW.h}`),
          h.Role('group'),
          h.AriaLabel(`The workshop of ${input.title}`),
        ],
        [
          h.rect([
            h.Class('ws-yard'),
            h.X('4'),
            h.Y('4'),
            h.Width(String(VIEW.w - 8)),
            h.Height(String(VIEW.h - 8)),
            h.Rx('14'),
          ]),
          ...outsideView(input, h),
          ...deskView(input, h),
          ...roomView(input, h),
          input.scene.building === 'dark'
            ? h.g(
                [],
                [
                  h.rect([
                    h.Class('ws-fog'),
                    h.X(String(ROOM.x + 4)),
                    h.Y(String(ROOM.y + 4)),
                    h.Width(String(ROOM.w - 8)),
                    h.Height(String(ROOM.h - 8)),
                    h.Rx('6'),
                  ]),
                  label(
                    ROOM.x + ROOM.w / 2,
                    ROOM.y + ROOM.h - 64,
                    'ws-fog-text',
                    'Unknown room',
                    h,
                  ),
                ],
              )
            : h.empty,
          ...Array.map(linesOf(input), line =>
            h.keyed('path')(
              line.key,
              [h.Class(line.className), h.D(line.d)],
              [],
            ),
          ),
          ...gatesView(input, h),
          ...Array.map(modules, module => slotView(input, module.id, h)),
          ...Array.map(neighbourIds, id => neighbourView(input, id, h)),
        ],
      ),
    ],
  )

const chipsView = (input: MapInput, h: H): Html =>
  Array.match(input.tools, {
    onEmpty: () => h.empty,
    onNonEmpty: tools =>
      h.div(
        [h.Class('ws-chips'), h.AriaLabel('The tools on the board')],
        Array.map(tools, tool => {
          const body = [
            Option.match(tool.icon, {
              onNone: () => h.span([h.Class('ws-noicon')], ['?']),
              onSome: name => iconView(name, h),
            }),
            h.span([h.Class('ws-chip-name')], [tool.label]),
            h.span(
              [h.Class('ws-chip-slot')],
              [modules.find(m => m.id === tool.slot)?.word ?? ''],
            ),
          ]
          const className = `ws-chip ${tool.isActive ? 'active' : ''} ${tool.isCalled ? 'called' : ''}`
          return Option.match(tool.message, {
            onNone: () =>
              h.keyed('span')(
                tool.key,
                [h.Class(className), h.Title(tool.aria)],
                body,
              ),
            onSome: message =>
              h.keyed('button')(
                tool.key,
                [
                  h.Type('button'),
                  h.Class(className),
                  h.AriaLabel(tool.aria),
                  h.AriaPressed(tool.isSelected ? 'true' : 'false'),
                  h.OnClick(message),
                ],
                body,
              ),
          })
        }),
      ),
  })

const notesView = (input: MapInput, h: H): Html =>
  Array.match(input.scene.notes, {
    onEmpty: () => h.empty,
    onNonEmpty: notes =>
      h.div(
        [h.Class('ws-notes')],
        [
          h.span([h.Class('ws-notes-head')], ['Where the picture simplifies']),
          h.ul(
            [],
            Array.map(notes, (note, index) =>
              h.keyed('li')(`${index}`, [], [note]),
            ),
          ),
        ],
      ),
  })

export const mcpMapView = (
  input: MapInput,
  h: H,
  isFull = false,
  aside: Html | undefined = undefined,
): Html =>
  h.section(
    [
      h.Class(`mcpmap mode-${input.mode} ${isFull ? 'full' : ''}`),
      h.AriaLabel('The workshop map'),
      ...(isFull ? [h.Role('dialog'), h.AriaModal(true)] : []),
    ],
    [
      h.button(
        [
          h.Type('button'),
          h.Class('pop-btn ws-full-btn'),
          h.AriaLabel(
            isFull
              ? 'Close the full-window map'
              : 'Show the map in the full window',
          ),
          h.OnClick(Message.ClickedCanvasFull({ on: !isFull })),
        ],
        [isFull ? 'Close · Esc' : 'Full window'],
      ),
      isFull && aside !== undefined
        ? h.div([h.Class('ws-full-body')], [canvasView(input, h), aside])
        : canvasView(input, h),
      h.div(
        [h.Class('ws-under')],
        [
          chipsView(input, h),
          h.details(
            [h.Class('pop right')],
            [
              h.summary([h.Class('pop-btn')], ['How to read the map']),
              h.div(
                [h.Class('pop-panel')],
                [
                  h.p(
                    [h.Class('ws-legend')],
                    [
                      h.span(
                        [h.Class('ws-key lit')],
                        ['offered by this server'],
                      ),
                      h.span([h.Class('ws-key ghost')], ['not offered']),
                      h.span(
                        [h.Class('ws-key flow')],
                        ['a call: desk → slot → what it reaches'],
                      ),
                      h.span(
                        [h.Class('ws-key back')],
                        [
                          'something going back out to you, or a rule in the wall',
                        ],
                      ),
                    ],
                  ),
                  h.p(
                    [],
                    [
                      'You and the AI app stay outside. MCP is the front desk: the board is the tools/list answer, all the AI is shown. Behind it is the server’s workshop; outside its walls, what the tools reach.',
                    ],
                  ),
                  h.p(
                    [h.Class('ws-source')],
                    [
                      input.mode === 'foreign'
                        ? 'Slots guessed from the pasted list.'
                        : input.mode === 'empty'
                          ? 'No server yet.'
                          : 'Slots and neighbours placed by the lab from its own source. The protocol itself has no such groups.',
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
      notesView(input, h),
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
  tools: [],
  scene: { names: {}, gates: {}, desk: [], building: 'room', notes: [] },
  isWorking: false,
})

export const serverMap = (model: Model): MapInput => {
  const belt = beltOf(model)
  const called = calledTools(model.frames)
  const active = activeName(model)
  return {
    mode: 'server',
    title: `the ${serverNames[model.station]}`,
    tools: Array.map(belt.tools, capability => {
      const place = placeOf(capability.name, model.world)
      return {
        key: capability.name,
        label: capability.name,
        title: capability.title,
        icon: Option.some(capability.name),
        slot: place.slot,
        reach: place.reach,
        aria: `${capability.title}, ${capability.name}`,
        message: Option.some(
          Message.SelectedCapability({ name: capability.name }),
        ),
        isSelected: Option.contains(model.maybeSelected, capability.name),
        isCalled: called.includes(capability.name),
        isActive: Option.contains(active, capability.name),
      }
    }),
    scene: sceneOf(model.station, model.world),
    isWorking: RunState.isAnyOf(['Running'])(model.run),
  }
}

export const allMap = (model: Model): MapInput => {
  const called = calledTools(model.frames)
  return {
    mode: 'all',
    title: 'every server',
    tools: Array.map(catalogue, capability => {
      const place = placeOf(capability.name, model.world)
      return {
        key: capability.name,
        label: capability.name,
        title: capability.title,
        icon: Option.some(capability.name),
        slot: place.slot,
        reach: place.reach,
        aria: `${capability.title}, ${capability.name}, ${serverNames[capability.specimen]}`,
        message: Option.some(
          Message.SelectedCapability({ name: capability.name }),
        ),
        isSelected: Option.contains(model.maybeSelected, capability.name),
        isCalled: called.includes(capability.name),
        isActive: false,
      }
    }),
    scene: allScene,
    isWorking: false,
  }
}

export const foreignMap = (tools: ReadonlyArray<ForeignTool>): MapInput => ({
  mode: 'foreign',
  title: 'your server',
  tools: Array.map(tools, tool => {
    const guess = guessModule(tool)
    return {
      key: tool.name,
      label: tool.name,
      title: tool.title,
      icon: Option.none(),
      slot: guess.module,
      reach: [],
      aria: `${tool.name}, guessed: ${guess.basis}`,
      message: Option.none(),
      isSelected: false,
      isCalled: false,
      isActive: false,
    }
  }),
  scene: darkScene,
  isWorking: false,
})
