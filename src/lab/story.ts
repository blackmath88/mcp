import type { Station } from './model.ts'

// The route we agreed: easy to strange, the order of specimens/route.json,
// with the valley first and the inspector last. Each step teaches one MCP
// idea through one thing to try on that station's bench.

export type StoryStep = Readonly<{
  station: Station
  idea: string
  tryThis: string
  notice: string
}>

export const route: ReadonlyArray<StoryStep> = [
  {
    station: 'valley',
    idea: 'A server offers tools. The AI is only told their names, inputs and descriptions.',
    tryThis: 'Press “Read the map”, then “Connect them, any way”.',
    notice:
      'Reading changed nothing. Connecting built a new path and the map revision went up. Two tools in the same list, very different weight.',
  },
  {
    station: 'fetch',
    idea: 'One tool call can hide a chain of decisions.',
    tryThis:
      'Click “/notice”. Then bend it to “First URL only” and click it again.',
    notice:
      'The fetch followed a redirect and checked robots.txt at every hop. With the bend, the second hop goes unchecked. The tool’s name did not change.',
  },
  {
    station: 'memory',
    idea: 'A tool can remember. The memory is not in the AI; it is somewhere on a disk.',
    tryThis:
      'Tell it Workshop A “belongs to Team Blue”, ask what it knows, then press “Reinstall the package” and ask again.',
    notice:
      'The fact survived restarting the client and the server, but not a reinstall. Where the file lives decides what is remembered.',
  },
  {
    station: 'thinking',
    idea: 'The same tool name can hide very different insides.',
    tryThis: 'Ask it to plan. Then bend “What is inside” and ask again.',
    notice:
      'The tool list looked identical each time. Who actually wrote the plan changed: your own thoughts, a calculation, or another model.',
  },
  {
    station: 'filesystem',
    idea: 'Someone decides what a tool may touch. Not always who you think.',
    tryThis:
      'Click a file. Then send the root “/valley/mill” and click the files again.',
    notice:
      'The client’s roots replaced the folders the server was started with. Bend the server build to see other answers.',
  },
  {
    station: 'perception',
    idea: 'A tool sees the world its own way, and may not see all of it.',
    tryThis: 'Press “Take a snapshot”. Then click the Lever.',
    notice:
      'Two of the four controls are missing from the snapshot. The tool cannot act on what it cannot perceive.',
  },
  {
    station: 'cli',
    idea: 'Tools can be frozen into other programs, and then go stale.',
    tryThis:
      'Press “Generate it”. Bend the server to “v2 adds destination”. Then press “Ship through it”.',
    notice:
      'The generated CLI still carries the old schema and is rejected. A live call asks the server first and keeps working.',
  },
  {
    station: 'local-remote',
    idea: 'Behind every server is a running process. Whose is it?',
    tryThis: 'Send client A to the mill. Then ask “Where am I?” for client B.',
    notice:
      'With one shared process, B is at the mill too, though it never moved. Bend it to a process per connection.',
  },
  {
    station: 'apps',
    idea: 'A tool can hand back an app that a person then uses.',
    tryThis:
      'Open the map. Move it to the Dock. Then ask the app where it is looking.',
    notice:
      'The model’s picture went stale the moment you moved the map, until it asked again.',
  },
  {
    station: 'code-mode',
    idea: 'One tool can be a whole language: the AI writes a program instead of calling tools one by one.',
    tryThis:
      'Bend it to “Third write fails”. Then run “One program on the server”.',
    notice:
      'Two entries stayed written. One call, many effects, one error back, and nothing rolled back.',
  },
  {
    station: 'delegation',
    idea: 'A tool can be another AI.',
    tryThis: 'Bend it to “Map left out”. Then press “Ask a question”.',
    notice:
      'The expert answers anyway, without the facts. And it matters who owns the next step: you, or the expert.',
  },
  {
    station: 'iteration',
    idea: 'A tool can keep working on its own, over many steps.',
    tryThis: 'Press “Run the loop”. Then “Crash it mid-loop, then resume”.',
    notice:
      'Something has to decide when it is good enough. In memory, a crash means the work is paid for twice.',
  },
  {
    station: 'network',
    idea: 'One entrance can stand in front of many servers.',
    tryThis:
      'Press “List the inventory”. Then take the dock backend down and call “weigh”.',
    notice:
      'A shared name hid one tool. A dead backend is still listed. One entrance is not one owner.',
  },
  {
    station: 'inspector',
    idea: 'What can you know about a server from its tool list alone?',
    tryThis:
      'Point it at the Memory server. Bend to “Listing changed since”, point it again, then at itself.',
    notice:
      'It can repeat what a server claims and notice when that changes. It cannot check what a tool really does.',
  },
]

export const stepOf = (station: Station): number =>
  route.findIndex(step => step.station === station)
