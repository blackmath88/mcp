// @vitest-environment node
import { expect, it, vi } from 'vitest'

import { searchRegistry } from './registry-server.ts'

it('reports a registry page with package and remote targets as advertised fields', async () => {
  const fetchPage = vi.fn(async (_url: URL) => ({
    status: 200,
    body: JSON.stringify({
      servers: [
        {
          server: {
            name: 'example/note',
            version: '1.0.0',
            packages: [{ identifier: '@example/note' }],
            remotes: [{ url: 'https://example.invalid/mcp' }],
          },
        },
      ],
      metadata: { nextCursor: 'example/note:1.0.0' },
    }),
  }))
  const reply = await searchRegistry('note & preview', fetchPage)
  expect(fetchPage.mock.calls[0]?.[0].origin).toBe(
    'https://registry.modelcontextprotocol.io',
  )
  expect(fetchPage.mock.calls[0]?.[0].searchParams.get('search')).toBe(
    'note & preview',
  )
  expect(reply.registry).toEqual({
    entries: [
      {
        name: 'example/note',
        version: '1.0.0',
        description: '',
        packages: ['@example/note'],
        remotes: ['https://example.invalid/mcp'],
      },
    ],
    partial: true,
  })
  expect(reply.events.map(event => event.label)).toEqual([
    'GET /v0.1/servers',
    'HTTP 200',
    'Registry records decoded',
  ])
})

it('distinguishes empty results, upstream HTTP failure, malformed payload, and invalid input', async () => {
  const empty = await searchRegistry('note', async () => ({
    status: 200,
    body: '{"servers":[]}',
  }))
  expect(empty.registry).toEqual({ entries: [], partial: false })

  const unavailable = await searchRegistry('note', async () => ({
    status: 503,
    body: '',
  }))
  expect(unavailable.registry).toBeUndefined()
  expect(unavailable.error).toContain('503')
  expect(unavailable.events.some(event => event.label === 'HTTP 503')).toBe(
    true,
  )

  const malformed = await searchRegistry('note', async () => ({
    status: 200,
    body: '{"wrong":true}',
  }))
  expect(malformed.registry).toBeUndefined()
  expect(malformed.error).toBeDefined()

  const request = vi.fn()
  const invalid = await searchRegistry('a', request)
  expect(request).not.toHaveBeenCalled()
  expect(invalid.error).toBeDefined()
  expect(invalid.events).toEqual([])
})
