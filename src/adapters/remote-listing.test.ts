import { Effect, Exit } from 'effect'
// @vitest-environment node
import { createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { Pace } from '../domain/services.ts'
import { CALM_MAX_SPAN, seedWorld } from '../domain/world.ts'
import { createLabServer } from './lab-server.ts'
import { listRemoteTools } from './remote-listing.ts'

// A real MCP server over Streamable HTTP on localhost: the lab's own server,
// one stateless transport per request.
const calls: Array<string> = []
const http = createServer(async (request, response) => {
  const chunks: Array<Buffer> = []
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk))
  }
  const body =
    chunks.length === 0
      ? undefined
      : JSON.parse(Buffer.concat(chunks).toString())
  if (body !== undefined && typeof body.method === 'string') {
    calls.push(body.method)
  }
  const server = createLabServer(
    { world: seedWorld(CALM_MAX_SPAN), domain: 'memory' },
    Pace.unpaced,
  )
  // Stateless: no session id generator.
  const transport = new StreamableHTTPServerTransport({})
  await server.connect(transport)
  await transport.handleRequest(request, response, body)
})

let address = ''

beforeAll(async () => {
  await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve))
  const bound = http.address()
  const port = typeof bound === 'object' && bound !== null ? bound.port : 0
  address = `http://localhost:${port}/mcp`
})

afterAll(() => {
  http.close()
})

describe('asking a real server for its tools by address', () => {
  test('lists the tools and calls none of them', async () => {
    const listing = await Effect.runPromise(listRemoteTools(address))
    expect(listing.tools).toBe(3)
    expect(
      JSON.parse(listing.json).tools.map((tool: { name: string }) => tool.name),
    ).toEqual(['remember', 'recall', 'enter_domain'])
    expect(calls).toContain('tools/list')
    expect(calls).not.toContain('tools/call')
  })

  test('refuses plain http to another host', async () => {
    const exit = await Effect.runPromiseExit(
      listRemoteTools('http://example.com/mcp'),
    )
    expect(Exit.isFailure(exit)).toBe(true)
  })
})
