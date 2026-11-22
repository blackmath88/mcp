import { z } from 'zod'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

function createServer() {
  const server = new McpServer({
    name: 'Permission slip fixture',
    version: '1.0.0',
  })
  let revision = 1

  server.registerTool(
    'request_bridge_edit',
    {
      description:
        'Request a revision to the fictional bridge note with a synthetic role.',
      inputSchema: { role: z.enum(['viewer', 'editor']) },
    },
    async ({ role }) => {
      const before = revision
      if (role === 'editor') {
        revision += 1
      }
      const receipt = {
        authority: 'synthetic fixture policy',
        role,
        outcome: role === 'editor' ? 'granted' : 'denied',
        before,
        after: revision,
      }
      return {
        isError: role === 'viewer',
        content: [
          {
            type: 'text',
            text:
              role === 'editor'
                ? `The editor moved the bridge east. Revision ${revision}.`
                : `The fixture denied the viewer’s request. The note remains at revision ${revision}.`,
          },
        ],
        structuredContent: receipt,
      }
    },
  )
  return server
}

await createServer().connect(new StdioServerTransport())
