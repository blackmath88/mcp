import type { CapabilityName } from './capabilities.ts'

// The thirteen distinctions of the lab's learning ladder
// (docs/concept/MCP-LENS-ONTOLOGY.md), each with the capabilities that let a
// person meet it. It is an index for authors and an optional way in for
// learners. It is not an order anyone has to follow, and a capability can
// serve several steps.

export type Rung = Readonly<{
  step: number
  name: string
  distinction: string
  capabilities: ReadonlyArray<CapabilityName>
}>

export const ladder: ReadonlyArray<Rung> = [
  {
    step: 1,
    name: 'Read',
    distinction: 'A reference versus the content behind it',
    capabilities: ['read_map', 'read_file', 'fetch_page', 'list_carts'],
  },
  {
    step: 2,
    name: 'Query',
    distinction: 'Stored content versus a computed answer',
    capabilities: ['find_route', 'recall'],
  },
  {
    step: 3,
    name: 'Act',
    distinction: 'An answer versus an effect',
    capabilities: ['build_path', 'click', 'write_entry', 'move_crate'],
  },
  {
    step: 4,
    name: 'Remember',
    distinction: 'A change now versus state later',
    capabilities: ['remember', 'recall', 'plan_steps'],
  },
  {
    step: 5,
    name: 'Discover and perceive',
    distinction: 'The world versus the caller’s view of it',
    capabilities: ['take_snapshot', 'click', 'read_file', 'read_sensor'],
  },
  {
    step: 6,
    name: 'Trace interfaces and placement',
    distinction: 'The entrance versus the engine',
    capabilities: [
      'generate_cli',
      'call_generated',
      'call_live',
      'go_to',
      'where_am_i',
    ],
  },
  {
    step: 7,
    name: 'Interact',
    distinction: 'One response versus a shared working surface',
    capabilities: ['show_map', 'get_current_view', 'reserve_cart'],
  },
  {
    step: 8,
    name: 'Compose',
    distinction: 'A named action versus a program',
    capabilities: ['connect_places', 'run_as_calls', 'run_as_program'],
  },
  {
    step: 9,
    name: 'Consult and delegate',
    distinction: 'Who contributes judgement versus who controls the subtask',
    capabilities: ['ask_expert', 'review_plan', 'deliver_plan'],
  },
  {
    step: 10,
    name: 'Iterate',
    distinction: 'A single pass versus evidence-driven repetition',
    capabilities: ['refine_plan'],
  },
  {
    step: 11,
    name: 'Resume',
    distinction: 'The client’s lifetime versus the work’s lifetime',
    capabilities: ['crash_and_resume'],
  },
  {
    step: 12,
    name: 'Connect workshops',
    distinction: 'One outward inventory versus a network of owners',
    capabilities: ['list_inventory', 'call_tool'],
  },
  {
    step: 13,
    name: 'Inspect the inspector',
    distinction: 'Claims versus the grounds for believing them',
    capabilities: ['profile_server', 'profile_self'],
  },
]
