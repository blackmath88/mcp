import type { Station } from './model.ts'

export const stationNames: Record<Station, string> = {
  valley: 'The valley',
  fetch: 'Fetch a page',
  memory: 'Memory',
  thinking: 'Thinking as a tool',
  filesystem: 'Filesystem',
  perception: 'Browser perception',
  cli: 'A generated CLI',
  'local-remote': 'Local and remote',
  apps: 'An interactive map',
  'code-mode': 'One item, a language',
  delegation: 'Another intelligence',
  iteration: 'A loop that refines',
  network: 'The network',
  inspector: 'Inspect the inspector',
}

// The simulated server behind each specimen. A server exposes tools; it is
// not a family and not a place on the atlas.
export const serverNames: Record<Station, string> = {
  valley: 'Valley server',
  fetch: 'Fetch server',
  memory: 'Memory server',
  thinking: 'Thinking server',
  filesystem: 'Filesystem server',
  perception: 'Browser server',
  cli: 'Crate server',
  'local-remote': 'Place server',
  apps: 'Map app server',
  'code-mode': 'Ledger server',
  delegation: 'Expert server',
  iteration: 'Workflow server',
  network: 'Gateway',
  inspector: 'Inspector server',
}
