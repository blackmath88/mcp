import { z } from 'zod'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

import { type Reply } from './contract.ts'
import { registrySearchTool } from './specimens.ts'

export function createRegistryMcpServer(
  search: (query: string) => Promise<Reply>,
): McpServer {
  const server = new McpServer({
    name: 'Lab Registry adapter',
    version: '1.0.0',
  })
  server.registerTool(
    registrySearchTool,
    {
      title: 'Search Registry',
      description:
        'Look up published records through the official Registry REST API.',
      inputSchema: { query: z.string().trim().min(3).max(120) },
      annotations: { readOnlyHint: true },
    },
    async ({ query }) => {
      const reply = await search(query)
      const receipt = {
        upstream: reply.events,
        ...(reply.registry === undefined ? {} : { page: reply.registry }),
      }
      return {
        isError: reply.error !== undefined,
        content: [
          {
            type: 'text',
            text:
              reply.error ??
              `The Registry returned ${reply.registry?.entries.length ?? 0} published records.`,
          },
        ],
        structuredContent: receipt,
      }
    },
  )
  return server
}
