import { Option } from 'effect'

import type { ComponentId } from '../domain/services.ts'
import type { Station } from './model.ts'

// The parts behind each server, as the lab's own source builds them. A tool
// list never shows these; for a server the lab did not write they are unknown.

export const componentNames: Record<ComponentId, string> = {
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
  lens: 'Lens',
  'inspected-server': 'Inspected server',
  'cart-server': 'Cart server',
  person: 'You (asked by the server)',
  'cart-store': 'Cart list',
  'crane-server': 'Crane server',
  controller: 'Controller (simulated)',
  arm: 'Crane arm (simulated)',
  sensor: 'Sensor (simulated)',
}

export const componentRoles: Record<ComponentId, string> = {
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
  lens: 'Reads a listing and reports claims with their evidence.',
  'inspected-server': 'The server whose listing is being read.',
  'cart-server':
    'Reserves carts. One build asks you which one; the other picks itself.',
  person:
    'The person at the client. The server reaches them with elicitation/create, mid-call.',
  'cart-store': 'Two carts and who reserved them. Everyone sees the same list.',
  'crane-server': 'Turns a tool call into a command for the crane.',
  controller: 'Accepts a movement command. It does not look where things went.',
  arm: 'Moves the crate. A movement cannot be taken back by another call.',
  sensor: 'Says where the crate is. Only it knows whether the move worked.',
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
  inspector: ['adapter', 'catalogue', 'lens', 'inspected-server'],
  ask: ['adapter', 'catalogue', 'cart-server', 'person', 'cart-store'],
  arm: ['adapter', 'catalogue', 'crane-server', 'controller', 'arm', 'sensor'],
}

type LaterStation =
  | 'apps'
  | 'code-mode'
  | 'delegation'
  | 'iteration'
  | 'network'
  | 'inspector'
  | 'ask'
  | 'arm'

export const asLater = (station: Station): Option.Option<LaterStation> =>
  station === 'apps' ||
  station === 'code-mode' ||
  station === 'delegation' ||
  station === 'iteration' ||
  station === 'network' ||
  station === 'inspector' ||
  station === 'ask' ||
  station === 'arm'
    ? Option.some(station)
    : Option.none()

export const componentsOf = (station: Station): ReadonlyArray<ComponentId> =>
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
