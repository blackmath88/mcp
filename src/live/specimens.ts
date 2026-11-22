import { Schema } from 'effect'

export const SpecimenId = Schema.Literals([
  'time',
  'everything',
  'boundary',
  'registry',
])
export type SpecimenId = typeof SpecimenId.Type

export const specimens = {
  time: {
    title: 'Get Time',
    mode: 'Live MCP',
    description:
      'Open the official Quickstart app and refresh the server clock from inside its view.',
    version: 'MCP Apps v1.7.5',
    source:
      'https://github.com/modelcontextprotocol/ext-apps/tree/92f46a574568a3ddac7600343b7d3c4c4ed7b588/examples/quickstart',
  },
  everything: {
    title: 'Everything',
    mode: 'Live MCP',
    description:
      'Discover the reference server’s inventory, then send a message to its Echo tool.',
    version: 'Everything v2.3.1',
    source:
      'https://www.npmjs.com/package/@modelcontextprotocol/server-everything/v/2.3.1',
  },
  boundary: {
    title: 'Permission slip',
    mode: 'Live MCP · synthetic data',
    description:
      'Ask for an edit to a fictional bridge note. Follow the reason the specimen grants or denies it.',
    version: 'Lab fixture v1',
    source: '',
  },
  registry: {
    title: 'Registry',
    mode: 'Live REST',
    description:
      'Search published server records. A record can point to an installable package or a remote endpoint.',
    version: 'Official Registry v0.1',
    source: 'https://registry.modelcontextprotocol.io/',
  },
} satisfies Record<
  SpecimenId,
  {
    title: string
    mode: string
    description: string
    version: string
    source: string
  }
>

export const allowedTools: Readonly<Record<SpecimenId, ReadonlyArray<string>>> =
  {
    time: ['get-time'],
    everything: ['echo'],
    boundary: ['request_bridge_edit'],
    registry: [],
  }

export const apiPath = '/api/lab/specimen'

export const hostName = 'MCP Exploration Lab'
export const hostVersion = '0.1.0'
