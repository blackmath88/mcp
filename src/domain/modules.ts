import { Array, pipe } from 'effect'

import type { CapabilityName, Family } from './capabilities.ts'
import type { Claim } from './lens.ts'
import type { World } from './world.ts'

// THE WORKSHOP
//
// A server drawn as a place. You and the AI app stand outside. MCP is the
// front desk: its board is the tools/list answer, all the AI is shown.
// Behind the desk is the server's workshop with nine slots in fixed places,
// one for each kind of thing a tool can be. Outside the walls are the
// neighbours the tools reach. A call is one line: desk → slot → neighbour.
//
// These are teaching groups chosen by this lab. MCP itself only knows tools,
// resources and prompts; nothing in a tool list says which slot a tool is in
// or what it reaches.

export type ModuleId =
  | 'read'
  | 'ask'
  | 'write'
  | 'compute'
  | 'sequence'
  | 'share'
  | 'invent'
  | 'delegate'
  | 'act'

export type Module = Readonly<{
  id: ModuleId
  rung: number
  word: string
  name: string
  means: string
  // Where it stands in the workshop.
  place: 'shelf' | 'bench' | 'phone' | 'dock' | 'desk'
}>

export const modules: ReadonlyArray<Module> = [
  {
    id: 'read',
    rung: 1,
    word: 'Read',
    name: 'A read',
    means: 'takes something in from a record, a page, a file',
    place: 'shelf',
  },
  {
    id: 'ask',
    rung: 2,
    word: 'Ask',
    name: 'An interaction',
    means: 'stops the call and asks you, through the AI app',
    place: 'desk',
  },
  {
    id: 'write',
    rung: 3,
    word: 'Write',
    name: 'A read and a write',
    means: 'changes something someone else will see',
    place: 'shelf',
  },
  {
    id: 'compute',
    rung: 4,
    word: 'Compute',
    name: 'An operation',
    means: 'works out something new from what it got',
    place: 'bench',
  },
  {
    id: 'sequence',
    rung: 5,
    word: 'Sequence',
    name: 'A workflow',
    means: 'runs several steps in order behind one call',
    place: 'bench',
  },
  {
    id: 'share',
    rung: 6,
    word: 'Share',
    name: 'An application',
    means: 'hands back a surface that you and the AI both use',
    place: 'desk',
  },
  {
    id: 'invent',
    rung: 7,
    word: 'Invent',
    name: 'A way to invent a tool',
    means: 'runs a procedure the AI wrote just now',
    place: 'bench',
  },
  {
    id: 'delegate',
    rung: 8,
    word: 'Delegate',
    name: 'Another intelligence',
    means: 'hands the job to someone else: another model or program',
    place: 'phone',
  },
  {
    id: 'act',
    rung: 9,
    word: 'Act',
    name: 'A physical action',
    means: 'moves something outside the computer',
    place: 'dock',
  },
]

export const moduleWord = (id: ModuleId): string =>
  modules.find(module => module.id === id)?.word ?? id

// NEIGHBOURS: what the tools reach, outside the walls.

export type NeighbourId =
  | 'web'
  | 'files'
  | 'store'
  | 'llm'
  | 'program'
  | 'world'

export const neighbourNames: Record<NeighbourId, string> = {
  web: 'web pages',
  files: 'files',
  store: 'stored data',
  llm: 'another model',
  program: 'another program',
  world: 'the world',
}

// Authored: where each of the lab's own tools sits and what it reaches.
type Place = Readonly<{ slot: ModuleId; reach: ReadonlyArray<NeighbourId> }>

const placed: Record<CapabilityName, Place> = {
  read_map: { slot: 'read', reach: ['store'] },
  find_route: { slot: 'compute', reach: [] },
  build_path: { slot: 'write', reach: ['store'] },
  connect_places: { slot: 'sequence', reach: ['store'] },
  fetch_page: { slot: 'read', reach: ['web'] },
  remember: { slot: 'write', reach: ['store'] },
  recall: { slot: 'read', reach: ['store'] },
  plan_steps: { slot: 'sequence', reach: [] },
  read_file: { slot: 'read', reach: ['files'] },
  take_snapshot: { slot: 'read', reach: ['web'] },
  click: { slot: 'write', reach: ['web'] },
  generate_cli: { slot: 'compute', reach: [] },
  call_live: { slot: 'write', reach: ['program'] },
  call_generated: { slot: 'write', reach: ['program'] },
  go_to: { slot: 'write', reach: ['store'] },
  where_am_i: { slot: 'read', reach: ['store'] },
  show_map: { slot: 'share', reach: [] },
  get_current_view: { slot: 'share', reach: [] },
  run_as_calls: { slot: 'sequence', reach: ['store'] },
  run_as_program: { slot: 'invent', reach: ['store'] },
  ask_expert: { slot: 'delegate', reach: ['llm'] },
  review_plan: { slot: 'delegate', reach: ['llm'] },
  deliver_plan: { slot: 'delegate', reach: ['llm', 'store'] },
  refine_plan: { slot: 'sequence', reach: ['llm'] },
  crash_and_resume: { slot: 'sequence', reach: ['llm', 'store'] },
  list_inventory: { slot: 'read', reach: ['program'] },
  call_tool: { slot: 'delegate', reach: ['program'] },
  profile_server: { slot: 'compute', reach: ['program'] },
  profile_self: { slot: 'compute', reach: [] },
  write_entry: { slot: 'write', reach: ['store'] },
  list_carts: { slot: 'read', reach: ['store'] },
  reserve_cart: { slot: 'ask', reach: ['store'] },
  move_crate: { slot: 'act', reach: ['world'] },
  read_sensor: { slot: 'read', reach: ['world'] },
}

// Some tools land in a different slot depending on how the server was built.
// The board stays the same; the room changes.
export const placeOf = (name: CapabilityName, world: World): Place => {
  if (name === 'plan_steps') {
    return world.thinkingMode === 'compute'
      ? { slot: 'compute', reach: ['store'] }
      : world.thinkingMode === 'consult'
        ? { slot: 'delegate', reach: ['llm'] }
        : { slot: 'sequence', reach: [] }
  }
  if (name === 'reserve_cart' && world.ask.build === 'guesses') {
    return { slot: 'write', reach: ['store'] }
  }
  return placed[name]
}

export const moduleOf = (name: CapabilityName): ModuleId => placed[name].slot

export const neighbourIds: ReadonlyArray<NeighbourId> = [
  'web',
  'files',
  'store',
  'llm',
  'program',
  'world',
]

// A card in the library names its slots and neighbours as plain strings,
// because it was written by hand. These say whether a string is one of ours.

export const isModuleId = (value: string): value is ModuleId =>
  modules.some(module => module.id === value)

export const isNeighbourId = (value: string): value is NeighbourId =>
  neighbourIds.some(id => id === value)

// For a server the lab did not write, the slot is a guess from the listing.
// What it reaches is unknown. Whether a tool asks you cannot be guessed at
// all: elicitation is decided during the call, not declared on a tool.

const familyModule: Record<Family, ModuleId> = {
  read: 'read',
  query: 'compute',
  perceive: 'read',
  remember: 'write',
  change: 'write',
  app: 'share',
  compose: 'invent',
  delegate: 'delegate',
  workflow: 'sequence',
  gateway: 'delegate',
}

const physical =
  /\b(robot\w*|motor|actuator|arm|crane|lamp|light|thermostat|door|lock|valve|printer|drone|device)\b/i

export const guessModule = (
  tool: Readonly<{ description: string; family: Family; familyBasis: string }>,
): Readonly<{ module: ModuleId; basis: string }> => {
  const match = physical.exec(tool.description)
  return match !== null
    ? {
        module: 'act',
        basis: `the description mentions “${match[0]}”, which may be physical`,
      }
    : { module: familyModule[tool.family], basis: tool.familyBasis }
}

// WHAT CAN INTERACT (inferred; kept for the drawer and for pasted listings)

export type Interaction = Readonly<{
  rule: string
  from: ModuleId
  to: ModuleId
  label: string
  isWarning: boolean
}>

export type LitTool = Readonly<{
  name: string
  module: ModuleId
  claims: ReadonlyArray<Claim>
}>

const hasRule = (tools: ReadonlyArray<LitTool>, rule: string): boolean =>
  tools.some(tool => tool.claims.some(claim => claim.rule === rule))

const litIn = (tools: ReadonlyArray<LitTool>, module: ModuleId): boolean =>
  tools.some(tool => tool.module === module)

const candidates: ReadonlyArray<
  Interaction & Readonly<{ also?: (tools: ReadonlyArray<LitTool>) => boolean }>
> = [
  {
    rule: 'C01',
    from: 'read',
    to: 'write',
    label: 'reads stored data and can send it somewhere: a way out',
    isWarning: true,
    also: tools => hasRule(tools, 'L06') && hasRule(tools, 'L03'),
  },
  {
    rule: 'M01',
    from: 'read',
    to: 'write',
    label: 'what it reads, it can also change',
    isWarning: false,
  },
  {
    rule: 'M04',
    from: 'sequence',
    to: 'write',
    label: 'one call, many changes',
    isWarning: true,
  },
  {
    rule: 'M05',
    from: 'invent',
    to: 'write',
    label: 'a program the AI wrote makes the changes',
    isWarning: true,
  },
  {
    rule: 'M06',
    from: 'read',
    to: 'delegate',
    label: 'what it reads can reach someone else',
    isWarning: false,
  },
  {
    rule: 'M07',
    from: 'read',
    to: 'act',
    label: 'only a read tells you whether the movement worked',
    isWarning: false,
  },
]

export const interactionsOf = (
  tools: ReadonlyArray<LitTool>,
): ReadonlyArray<Interaction> => {
  const fired = pipe(
    candidates,
    Array.filter(
      candidate =>
        litIn(tools, candidate.from) &&
        litIn(tools, candidate.to) &&
        (candidate.also?.(tools) ?? true),
    ),
  )
  return Array.filter(
    fired,
    (entry, index) =>
      fired.findIndex(
        other => other.from === entry.from && other.to === entry.to,
      ) === index,
  ).map(({ rule, from, to, label, isWarning }) => ({
    rule,
    from,
    to,
    label,
    isWarning,
  }))
}
