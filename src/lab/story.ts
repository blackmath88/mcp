import type { ModuleId } from '../domain/modules.ts'
import type { Model, Station } from './model.ts'

// The route, in the order of the owner's ladder: what a tool can be, from a
// read to a physical action. Each step lights one module of the map, with
// the real specimen that shows it. After the ladder come four side trips
// about where tools run and what they see, and last your own server.

export type StoryStep = Readonly<{
  station: Station
  module: ModuleId | 'around' | 'yours'
  idea: string
  tryThis: string
  notice: string
}>

export const stageNames: Record<StoryStep['module'], string> = {
  read: '1 · A read',
  ask: '2 · An interaction',
  write: '3 · A read and a write',
  compute: '4 · An operation',
  sequence: '5 · A workflow',
  share: '6 · An application',
  invent: '7 · A way to invent a tool',
  delegate: '8 · Another intelligence',
  act: '9 · A physical action',
  around: 'Around the ladder: where tools run, what they see',
  yours: 'Finally: your own server',
}

export const route: ReadonlyArray<StoryStep> = [
  {
    station: 'fetch',
    module: 'read',
    idea: 'The simplest kind of tool: a read. You give it a URL and it hands back a page. Even that one call hides a chain of decisions.',
    tryThis:
      'Click “/notice”. Then bend it to “First URL only” and click it again.',
    notice:
      'The fetch followed a redirect and checked robots.txt at every hop. With the bend, the second hop goes unchecked. The tool’s name did not change.',
  },
  {
    station: 'filesystem',
    module: 'read',
    idea: 'Someone decides what a tool may touch. Not always who you think.',
    tryThis:
      'Click a file. Then send the root “/valley/mill” and click the files again.',
    notice:
      'The client’s roots replaced the folders the server was started with. Bend the server build to see other answers.',
  },
  {
    station: 'ask',
    module: 'ask',
    idea: 'A tool can stop halfway and ask you. The AI does not see the question or choose the answer.',
    tryThis:
      'Press “Reserve a cart” and answer the question. Then bend it to “Picks one itself” and reserve again.',
    notice:
      'Over MCP the server sent elicitation/create to the client mid-call. The other build gives the same tool list and quietly picks for you. The list cannot tell you which one you have.',
  },
  {
    station: 'memory',
    module: 'write',
    idea: 'A tool can remember. The memory is not in the AI; it is somewhere on a disk.',
    tryThis:
      'Tell it Workshop A “belongs to Team Blue”, ask what it knows, then press “Reinstall the package” and ask again.',
    notice:
      'The fact survived restarting the client and the server, but not a reinstall. Where the file lives decides what is remembered.',
  },
  {
    station: 'valley',
    module: 'compute',
    idea: 'Two tools on one server: one only works out an answer, the other changes the map.',
    tryThis: 'Press “Read the map”, then find a route, then build a path.',
    notice:
      'Finding a route changed nothing; building a path raised the map revision. In the list they look alike: a name and two places.',
  },
  {
    station: 'thinking',
    module: 'compute',
    idea: 'The same tool name can hide very different insides.',
    tryThis: 'Ask it to plan. Then bend “What is inside” and ask again.',
    notice:
      'The tool list looked identical each time. Who actually wrote the plan changed: your own thoughts, a calculation, or another model.',
  },
  {
    station: 'iteration',
    module: 'sequence',
    idea: 'A tool can keep working on its own, over many steps.',
    tryThis: 'Press “Run the loop”. Then “Crash it mid-loop, then resume”.',
    notice:
      'Something has to decide when it is good enough. In memory, a crash means the work is paid for twice.',
  },
  {
    station: 'apps',
    module: 'share',
    idea: 'A tool can hand back an app that a person then uses.',
    tryThis:
      'Open the map. Move it to the Dock. Then ask the app where it is looking.',
    notice:
      'The model’s picture went stale the moment you moved the map, until it asked again.',
  },
  {
    station: 'code-mode',
    module: 'invent',
    idea: 'One tool can be a whole language: the AI writes a program instead of calling tools one by one.',
    tryThis:
      'Bend it to “Third write fails”. Then run “One program on the server”.',
    notice:
      'Two entries stayed written. One call, many effects, one error back, and nothing rolled back.',
  },
  {
    station: 'delegation',
    module: 'delegate',
    idea: 'A tool can be another AI.',
    tryThis: 'Bend it to “Map left out”. Then press “Ask a question”.',
    notice:
      'The expert answers anyway, without the facts. And it matters who owns the next step: you, or the expert.',
  },
  {
    station: 'arm',
    module: 'act',
    idea: 'A tool call can move something. Nothing physical moves here; the crane is simulated.',
    tryThis:
      'Bend it to “Something in the way”, then move the crate to the ship. Then read the sensor.',
    notice:
      'The result said “Moved.” The crate is hanging halfway. Only a read of the sensor tells you. Bend to “Server checks the sensor” and the same call fails honestly. A movement has no undo.',
  },
  {
    station: 'perception',
    module: 'around',
    idea: 'A tool sees the world its own way, and may not see all of it.',
    tryThis: 'Press “Take a snapshot”. Then click the Lever.',
    notice:
      'Two of the four controls are missing from the snapshot. The tool cannot act on what it cannot perceive.',
  },
  {
    station: 'cli',
    module: 'around',
    idea: 'Tools can be frozen into other programs, and then go stale.',
    tryThis:
      'Press “Generate it”. Bend the server to “v2 adds destination”. Then press “Ship through it”.',
    notice:
      'The generated CLI still carries the old schema and is rejected. A live call asks the server first and keeps working.',
  },
  {
    station: 'local-remote',
    module: 'around',
    idea: 'Behind every server is a running process. Whose is it?',
    tryThis: 'Send client A to the mill. Then ask “Where am I?” for client B.',
    notice:
      'With one shared process, B is at the mill too, though it never moved. Bend it to a process per connection.',
  },
  {
    station: 'network',
    module: 'around',
    idea: 'One entrance can stand in front of many servers.',
    tryThis:
      'Press “List the inventory”. Then take the dock backend down and call “weigh”.',
    notice:
      'A shared name hid one tool. A dead backend is still listed. One entrance is not one owner.',
  },
  {
    station: 'inspector',
    module: 'yours',
    idea: 'What can you know about a server from its tool list alone?',
    tryThis:
      'Point it at the Memory server. Bend to “Listing changed since”, point it again, then at itself.',
    notice:
      'It can repeat what a server claims and notice when that changes. It cannot check what a tool really does.',
  },
]

export const stepOf = (station: Station): number =>
  route.findIndex(step => step.station === station)

export const stepNumber = (station: Station): string =>
  String(stepOf(station) + 1).padStart(2, '0')

export const isOnRoute = (model: Model): boolean => stepOf(model.station) >= 0
