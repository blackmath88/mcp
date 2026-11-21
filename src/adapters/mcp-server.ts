import { Effect } from 'effect'

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { catalogue, inputJsonSchema, runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import { applySettings } from '../domain/settings.ts'
import {
  CALM_MAX_SPAN,
  STORM_MAX_SPAN,
  seedWorld,
  useGatewayBuild,
} from '../domain/world.ts'
import { recordText } from './text.ts'

// NOTE: This process is the MCP adapter. The world lives in this process's
// memory for the lifetime of the connection; nothing is shared with the CLI
// or the browser.
const MAP_URI = 'valley://map/current'

const seeded = seedWorld(
  process.argv.includes('--storm') ? STORM_MAX_SPAN : CALM_MAX_SPAN,
  process.argv.includes('--policy=first-hop')
    ? 'first-hop'
    : process.argv.includes('--policy=none')
      ? 'none'
      : 'every-hop',
  process.argv.includes('--memory-path=home') ? 'home' : 'package-cache',
  process.argv.includes('--thinking=compute')
    ? 'compute'
    : process.argv.includes('--thinking=consult')
      ? 'consult'
      : 'record',
  process.argv.includes('--fs-build=confine')
    ? 'confine'
    : process.argv.includes('--fs-build=pre-fix')
      ? 'pre-fix'
      : 'default',
  process.argv.includes('--perception=vision') ? 'vision' : 'snapshot',
)

const held = {
  world: applySettings(
    process.argv.includes('--gateway=per-connection')
      ? useGatewayBuild(seeded, 'per-connection')
      : seeded,
    process.argv.flatMap(argument =>
      argument.startsWith('--set=') ? [argument.slice('--set='.length)] : [],
    ),
  ),
}

const runHeld = async (name: string, input: unknown) => {
  const result = await Effect.runPromise(
    runOn(held.world, name, input).pipe(Effect.provide(Pace.unpaced)),
  )
  held.world = result.world
  return result.record
}

const server = new Server(
  { name: 'mcp-lab-valley', version: '0.1.0' },
  { capabilities: { tools: {}, resources: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: catalogue.map(capability => ({
    name: capability.name,
    title: capability.title,
    description: capability.description,
    inputSchema: inputJsonSchema(capability),
    annotations: {
      readOnlyHint:
        capability.affordance === 'readable' ||
        capability.affordance === 'queryable',
    },
  })),
}))

server.setRequestHandler(CallToolRequestSchema, async request => {
  const record = await runHeld(
    request.params.name,
    request.params.arguments ?? {},
  )
  return {
    content: [{ type: 'text', text: recordText(record) }],
    structuredContent: record,
    isError: record.outcome._tag === 'Failed',
  }
})

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: MAP_URI,
      name: 'Valley map',
      description: 'The current map as JSON. Reading it changes nothing.',
      mimeType: 'application/json',
    },
  ],
}))

server.setRequestHandler(ReadResourceRequestSchema, async request => {
  if (request.params.uri !== MAP_URI) {
    throw new Error(`Unknown resource: ${request.params.uri}`)
  }
  return {
    contents: [
      {
        uri: MAP_URI,
        mimeType: 'application/json',
        text: JSON.stringify(held.world, null, 2),
      },
    ],
  }
})

await server.connect(new StdioServerTransport())
