import { Array } from 'effect'
import { type Html, type HtmlBuilder } from 'foldkit/html'

import type { CapabilityName } from '../domain/capabilities.ts'
import {
  type ModuleId,
  type NeighbourId,
  moduleOf,
  modules,
} from '../domain/modules.ts'

// ONE ICON FAMILY
//
// Line icons on a 24 grid: one stroke weight, round ends and joins, drawn to
// stay inside 2.5–21.5. Every tool, slot and neighbour of the workshop has
// one. Colour comes from CSS, by where a thing sits in the workshop (shelf,
// bench, phone, dock, desk): it says where, never success or permission.

export type Place = 'shelf' | 'bench' | 'phone' | 'dock' | 'desk'

const circle = (cx: number, cy: number, r: number): string =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`

const ellipse = (cx: number, cy: number, rx: number, ry: number): string =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0`

const rounded = (
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`

const dot = (x: number, y: number): string => `M${x} ${y}h.01`

// Shared shapes
const page = 'M14 2.8H7a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.8z'
const pageFold = 'M14 2.8v5h5'
const bookmark =
  'M7 3h10a1.5 1.5 0 0 1 1.5 1.5V21L12 17l-6.5 4V4.5A1.5 1.5 0 0 1 7 3z'
const cart = [
  'M2.8 4.5h2.4l2.3 10.5h10.3l2.2-7.5H6.2',
  circle(9.5, 19.2, 1.5),
  circle(16.5, 19.2, 1.5),
]
const screen = [rounded(3, 3.5, 18, 13.5, 2.5), 'M9 20.5h6M12 17v3.5']
const lens = [circle(10.5, 10.5, 6.5), 'M15.3 15.3l5.2 5.2']
const bot = [
  rounded(4.5, 8, 15, 11, 3.5),
  'M12 4.5V8',
  circle(12, 3.6, 0.9),
  dot(9.5, 13),
  dot(14.5, 13),
  'M2.5 12.5v2.5M21.5 12.5v2.5',
]

export const slotIcons: Record<ModuleId, ReadonlyArray<string>> = {
  read: [
    'M2.5 12c2.2-4 5.5-6.5 9.5-6.5s7.3 2.5 9.5 6.5c-2.2 4-5.5 6.5-9.5 6.5S4.7 16 2.5 12z',
    circle(12, 12, 3),
  ],
  write: ['M14.5 4.5l5 5L9 20H4v-5z', 'M12.5 6.5l5 5'],
  ask: [
    'M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4.5 3.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M9.8 8.8a2.2 2.2 0 1 1 3.1 2c-.6.3-.9.7-.9 1.3',
    dot(12, 14.4),
  ],
  share: [
    ...screen,
    'M7 6.8l3.6 1.6-1.4.6-.6 1.4z',
    'M13.4 9.6l3.6 1.6-1.4.6-.6 1.4z',
  ],
  compute: [
    rounded(5, 2.5, 14, 19, 2.5),
    rounded(8, 5.5, 8, 4, 1),
    dot(8.8, 13),
    dot(12, 13),
    dot(15.2, 13),
    dot(8.8, 16.8),
    dot(12, 16.8),
    dot(15.2, 16.8),
  ],
  sequence: [
    circle(5, 6, 1.8),
    circle(5, 12, 1.8),
    circle(5, 18, 1.8),
    'M5 7.8v2.4M5 13.8v2.4',
    'M10 6h10M10 12h10M10 18h7',
  ],
  invent: ['M8 8l-4 4 4 4M16 8l4 4-4 4', 'M13.5 5l-3 14'],
  delegate: [
    circle(7, 7.5, 2.8),
    'M2.5 19.5c0-2.8 2-4.8 4.5-4.8s4.5 2 4.5 4.8',
    circle(17, 7.5, 2.8),
    'M12.5 19.5c0-2.8 2-4.8 4.5-4.8s4.5 2 4.5 4.8',
  ],
  act: [
    'M3.5 20.5h10',
    'M8.5 20.5v-4.4',
    circle(8.5, 14.5, 1.6),
    'M9.6 13.3l3.7-4.1',
    circle(14.4, 8, 1.6),
    'M15.9 8.6l3.1 2.1',
    'M19 10.7v3M17.4 13.7h3.2',
  ],
}

export const neighbourIcons: Record<
  NeighbourId | 'you' | 'bot',
  ReadonlyArray<string>
> = {
  web: [
    circle(12, 12, 9),
    'M3 12h18',
    'M12 3c2.6 2.4 4 5.6 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.6-4-9s1.4-6.6 4-9z',
  ],
  files: [
    'M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    'M3 10.5h18',
  ],
  store: [
    ellipse(12, 6, 7.5, 2.8),
    'M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6',
    'M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8',
  ],
  llm: bot,
  program: [
    rounded(3, 4, 18, 16, 2.5),
    'M3 8.5h18',
    'M7 12.5l2.5 2-2.5 2',
    'M12 16.5h5',
  ],
  world: [
    'M12 2.8l8.2 4.6v9.2L12 21.2l-8.2-4.6V7.4z',
    'M3.8 7.4L12 12l8.2-4.6',
    'M12 12v9.2',
  ],
  you: [circle(12, 8, 3.8), 'M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5'],
  bot,
}

export const toolIcons: Record<CapabilityName, ReadonlyArray<string>> = {
  read_map: [
    'M3.5 6.2L9 4l6 2.2L20.5 4v13.6L15 19.8l-6-2.2-5.5 2.2z',
    'M9 4v13.6M15 6.2v13.6',
  ],
  find_route: [
    circle(6, 18, 2.2),
    'M8.2 18H13a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h1.5',
    'M18 11s-3.5-3.1-3.5-5.6a3.5 3.5 0 0 1 7 0c0 2.5-3.5 5.6-3.5 5.6z',
    dot(18, 5.4),
  ],
  build_path: [
    'M2.5 17h19',
    'M4.5 17v-3.5a7.5 7.5 0 0 1 15 0V17',
    'M9 17v-4.6M12 17v-5.4M15 17v-4.6',
  ],
  connect_places: [
    circle(5.5, 5.5, 2.5),
    circle(18.5, 18.5, 2.5),
    'M8 5.5h4.5a3 3 0 0 1 3 3v7a3 3 0 0 0 .6 1.8',
    'M18.5 3v4M16.5 5h4',
  ],
  fetch_page: [
    circle(10.5, 10.5, 7.5),
    'M3 10.5h15',
    'M10.5 3c1.9 2.1 3 4.7 3 7.5s-1.1 5.4-3 7.5c-1.9-2.1-3-4.7-3-7.5s1.1-5.4 3-7.5z',
    'M19.5 14.5v7M17 19l2.5 2.5L22 19',
  ],
  remember: [bookmark, 'M12 7.5v5M9.5 10h5'],
  recall: [bookmark, 'M9.5 8.5h5M9.5 11.5h3'],
  plan_steps: [
    'M10 6.5h10M10 12h10M10 17.5h6',
    'M3.8 6.5l1.4 1.4 2.6-2.6',
    'M3.8 12l1.4 1.4 2.6-2.6',
    circle(5.6, 17.5, 1.6),
  ],
  read_file: [page, pageFold, 'M8.5 13h7M8.5 16.5h5'],
  take_snapshot: [
    'M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
    circle(12, 13, 3.5),
  ],
  click: ['M6 4l12.5 6.5-5.5 1.6-1.9 5.4z', 'M13.2 12.3l5 5'],
  generate_cli: [
    rounded(3, 4, 18, 16, 2.5),
    'M7 10l3 2.5-3 2.5',
    'M12.5 15H17',
  ],
  call_live: ['M13.5 2.5L5 13.5h6.5l-1 8 8.5-11h-6.5z'],
  call_generated: [
    page,
    pageFold,
    'M12 11.2v6.6M9.1 12.9l5.8 3.2M14.9 12.9l-5.8 3.2',
  ],
  go_to: [
    'M3 12h10',
    'M9.5 8.5L13 12l-3.5 3.5',
    'M18.5 14.5s-3-2.8-3-5a3 3 0 0 1 6 0c0 2.2-3 5-3 5z',
    dot(18.5, 9.5),
  ],
  where_am_i: [
    circle(12, 12, 6.5),
    circle(12, 12, 2),
    'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3',
  ],
  show_map: [...screen, 'M6.5 13.5l3.5-4 3 3 2-2 2.5 3'],
  get_current_view: [
    ...screen,
    'M7 10.2c1.3-2 3-3 5-3s3.7 1 5 3c-1.3 2-3 3-5 3s-3.7-1-5-3z',
    circle(12, 10.2, 1.2),
  ],
  run_as_calls: [
    'M4 6h11M4 12h11M4 18h11',
    'M17.5 4l2 2-2 2M17.5 10l2 2-2 2M17.5 16l2 2-2 2',
  ],
  run_as_program: [page, pageFold, 'M10 12l-2 2 2 2M14 12l2 2-2 2'],
  ask_expert: [
    'M4 3.5h10A1.5 1.5 0 0 1 15.5 5v6a1.5 1.5 0 0 1-1.5 1.5H8.5l-3 2.5v-2.5H4A1.5 1.5 0 0 1 2.5 11V5A1.5 1.5 0 0 1 4 3.5z',
    rounded(13, 13.5, 8.5, 7, 2.2),
    'M17.25 11.5v2',
    dot(15.6, 17),
    dot(18.9, 17),
  ],
  review_plan: [
    'M14 2.8H7a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h4',
    'M14 2.8l5 5v3.4',
    pageFold,
    'M13.5 18l2.2 2.2 4.3-4.3',
  ],
  deliver_plan: [
    'M14 2.8H7a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h4',
    'M14 2.8l5 5v3.4',
    pageFold,
    'M13 17.5h8M18 14.5l3 3-3 3',
  ],
  refine_plan: [
    'M20 11a8 8 0 0 0-14.3-4.6',
    'M5 3v4h4',
    'M4 13a8 8 0 0 0 14.3 4.6',
    'M19 21v-4h-4',
  ],
  crash_and_resume: ['M10 2.5L4.5 12H9l-1 7', 'M14 8.5l6.5 4-6.5 4z'],
  list_inventory: [
    rounded(3, 4.5, 3.5, 3.5, 1),
    rounded(3, 10.5, 3.5, 3.5, 1),
    rounded(3, 16.5, 3.5, 3.5, 1),
    'M10 6.2h10.5M10 12.2h10.5M10 18.2h10.5',
  ],
  call_tool: [
    'M15 3.5a5 5 0 0 0-4.6 6.9l-7 7a1.8 1.8 0 0 0 2.6 2.6l7-7A5 5 0 0 0 20.5 9l-3 1-2.5-2.5z',
  ],
  profile_server: [...lens, 'M7.8 9h5.4M7.8 12h3.6'],
  profile_self: [...lens, circle(10.5, 10.5, 2.2)],
  write_entry: ['M3.5 20.5h17', 'M14.5 4.5l3 3-9 9h-3v-3z'],
  list_carts: cart,
  reserve_cart: [...cart, 'M10 10.8l1.8 1.8 3.4-3.4'],
  move_crate: [
    'M12 2.5v5',
    'M12 7.5a2.2 2.2 0 1 1-2.2 2.2',
    rounded(6.5, 13, 11, 8, 1.5),
    'M6.5 16.5h11',
  ],
  read_sensor: [
    circle(12, 12, 2),
    'M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6',
    'M5.4 5.4a9.3 9.3 0 0 0 0 13.2M18.6 5.4a9.3 9.3 0 0 1 0 13.2',
  ],
}

export const placeOfSlot = (slot: ModuleId): Place =>
  modules.find(module => module.id === slot)?.place ?? 'bench'

export const placeOfTool = (name: CapabilityName): Place =>
  placeOfSlot(moduleOf(name))

export const lineIcon = <Message>(
  paths: ReadonlyArray<string>,
  className: string,
  h: HtmlBuilder<Message>,
): Html =>
  h.svg(
    // The view box leaves a margin round the 24 grid, so the tint shows as a
    // tile around the drawing at any size.
    [h.Class(className), h.ViewBox('-4 -4 32 32'), h.AriaHidden(true)],
    Array.map(paths, d => h.path([h.D(d)])),
  )

// A tool's icon, in its place's colours.
export const iconView = <Message>(
  name: CapabilityName,
  h: HtmlBuilder<Message>,
): Html => lineIcon(toolIcons[name], `ic place-${placeOfTool(name)}`, h)
