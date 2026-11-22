import { Array, pipe } from 'effect'

import type { CapabilityName, Family } from './capabilities.ts'
import type { Claim } from './lens.ts'

// THE MAP OF A TOOL LIST
//
// Nine modules, one per rung of the owner's ladder: what a tool can be, from
// a read to a physical action. Every server is drawn on the same nine slots:
// lit where it offers tools of that kind, ghosted where it offers none. The
// shape stays fixed so that one server can be compared with the next.
//
// These are teaching groups chosen by this lab. MCP itself only knows tools,
// resources and prompts; nothing in a tool list says which module a tool is.

export type ModuleId =
  | 'read'
  | 'ask'
  | 'write'
  | 'operate'
  | 'workflow'
  | 'app'
  | 'invent'
  | 'delegate'
  | 'world'

export type Module = Readonly<{
  id: ModuleId
  rung: number
  name: string
  question: string
  means: string
  behind: string
  // The three branches after the application, from the owner's ladder.
  branch: string
}>

export const modules: ReadonlyArray<Module> = [
  {
    id: 'read',
    rung: 1,
    name: 'A read',
    question: '“Where is it?”',
    means: 'looks something up and hands it back',
    behind: 'a record, a page, a file',
    branch: '',
  },
  {
    id: 'ask',
    rung: 2,
    name: 'An interaction',
    question: '“Which one do you mean?”',
    means: 'stops in the middle of the call and asks you',
    behind: 'you',
    branch: '',
  },
  {
    id: 'write',
    rung: 3,
    name: 'A read and a write',
    question: '“Reserve it for me.”',
    means: 'changes a record that someone else will see',
    behind: 'a shared record',
    branch: '',
  },
  {
    id: 'operate',
    rung: 4,
    name: 'An operation',
    question: '“Work it out.”',
    means: 'computes something new from what you give it',
    behind: 'a calculation',
    branch: '',
  },
  {
    id: 'workflow',
    rung: 5,
    name: 'A workflow',
    question: '“Prepare everything.”',
    means: 'runs several steps in order behind one call',
    behind: 'steps that depend on each other',
    branch: '',
  },
  {
    id: 'app',
    rung: 6,
    name: 'An application',
    question: '“Work on it with me.”',
    means: 'hands back a surface that you and the AI both use',
    behind: 'a live interface',
    branch: '',
  },
  {
    id: 'invent',
    rung: 7,
    name: 'A way to invent a tool',
    question: '“Do something nobody built.”',
    means: 'the AI writes the procedure and the server runs it',
    behind: 'a sandbox running new code',
    branch: 'who invents the operation',
  },
  {
    id: 'delegate',
    rung: 8,
    name: 'Another intelligence',
    question: '“Ask a specialist.”',
    means: 'another model, with its own context, answers',
    behind: 'another model',
    branch: 'who exercises judgement',
  },
  {
    id: 'world',
    rung: 9,
    name: 'A physical action',
    question: '“Move it.”',
    means: 'the effect happens outside any computer',
    behind: 'a motor and a sensor',
    branch: 'where the effect lands',
  },
]

// Authored: where each of the lab's own tools sits.
export const moduleOf: Record<CapabilityName, ModuleId> = {
  read_map: 'read',
  find_route: 'operate',
  build_path: 'write',
  connect_places: 'workflow',
  fetch_page: 'read',
  remember: 'write',
  recall: 'read',
  plan_steps: 'operate',
  read_file: 'read',
  take_snapshot: 'read',
  click: 'write',
  generate_cli: 'operate',
  call_live: 'write',
  call_generated: 'write',
  go_to: 'write',
  where_am_i: 'read',
  show_map: 'app',
  get_current_view: 'app',
  run_as_calls: 'workflow',
  run_as_program: 'invent',
  ask_expert: 'delegate',
  review_plan: 'delegate',
  deliver_plan: 'delegate',
  refine_plan: 'workflow',
  crash_and_resume: 'workflow',
  list_inventory: 'read',
  profile_server: 'operate',
  profile_self: 'operate',
  call_tool: 'operate',
  write_entry: 'write',
  list_carts: 'read',
  reserve_cart: 'ask',
  move_crate: 'world',
  read_sensor: 'read',
}

// For a server the lab did not write, the module is a guess from the listing.
// Two modules cannot be guessed at all: whether a tool will ask you is decided
// during the call (elicitation is a client capability, not a field of a
// tool), and an effect in the world shows only in wording.

const familyModule: Record<Family, ModuleId> = {
  read: 'read',
  query: 'operate',
  perceive: 'read',
  remember: 'write',
  change: 'write',
  app: 'app',
  compose: 'invent',
  delegate: 'delegate',
  workflow: 'workflow',
  gateway: 'operate',
}

const physical =
  /\b(robot\w*|motor|actuator|arm|crane|lamp|light|thermostat|door|lock|valve|printer|drone|device)\b/i

export const guessModule = (
  tool: Readonly<{ description: string; family: Family; familyBasis: string }>,
): Readonly<{ module: ModuleId; basis: string }> => {
  const match = physical.exec(tool.description)
  return match !== null
    ? {
        module: 'world',
        basis: `the description mentions “${match[0]}”, which may be physical`,
      }
    : { module: familyModule[tool.family], basis: tool.familyBasis }
}

export const cannotSeeInList: Partial<Record<ModuleId, string>> = {
  ask: 'A tool list cannot show this. Whether a tool asks you is decided during the call.',
}

// WHAT CAN INTERACT
//
// Inferred: pairs of lit modules whose combination changes what a server can
// do. Each names the rule it comes from. Only drawn when both ends are lit.

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
  Readonly<{
    rule: string
    from: ModuleId
    to: ModuleId
    label: string
    isWarning: boolean
    also?: (tools: ReadonlyArray<LitTool>) => boolean
  }>
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
    rule: 'M02',
    from: 'ask',
    to: 'write',
    label: 'you choose, then it changes something',
    isWarning: false,
  },
  {
    rule: 'M03',
    from: 'read',
    to: 'operate',
    label: 'computes from what it reads',
    isWarning: false,
  },
  {
    rule: 'M04',
    from: 'workflow',
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
    label: 'what it reads can reach another model',
    isWarning: false,
  },
  {
    rule: 'M07',
    from: 'read',
    to: 'world',
    label: 'only a read tells you whether the movement worked',
    isWarning: false,
  },
  {
    rule: 'M08',
    from: 'app',
    to: 'read',
    label: 'the person changes the app; the AI must read it again',
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
  // C01 is the sharper reading of M01; show one line per pair.
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
