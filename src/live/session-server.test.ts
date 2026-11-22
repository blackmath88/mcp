// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Reply, Request } from './contract.ts'
import { createSessionHost } from './session-server.ts'

let host: ReturnType<typeof createSessionHost>
beforeEach(() => {
  host = createSessionHost(async () => 'http://127.0.0.1:4011/sandbox')
})
afterEach(() => host.close())

const open = async (specimen: 'time' | 'everything' | 'boundary') => {
  const reply = await host.execute({ _tag: 'Connect', specimen })
  expect(reply.error).toBeUndefined()
  expect(reply.session?.state).toBe('ready')
  if (!reply.session) {
    throw new Error('Expected an initialized MCP session.')
  }
  return { session: reply.session, reply }
}

const call = (
  sessionId: string,
  tool: string,
  args: Extract<Request, { _tag: 'Call' }>['arguments'],
) =>
  host.execute({
    _tag: 'Call',
    sessionId,
    tool,
    arguments: args,
    from: 'learner',
  })

const labels = (reply: Reply) =>
  reply.events
    .filter(event => event.channel === 'MCP stdio')
    .map(event => event.label)

describe('curated MCP specimens over stdio', () => {
  it('discovers the upstream Everything inventory and invokes Echo', async () => {
    const { session, reply } = await open('everything')
    expect(session.server).toBe('mcp-servers/everything')
    expect(session.protocol).toBe('2025-11-25')
    expect(session.tools.find(tool => tool.name === 'echo')).toMatchObject({
      readOnlyHint: true,
    })
    expect(session.tools.length).toBeGreaterThan(1)
    expect(labels(reply)).toEqual([
      'initialize #0',
      'Response #0',
      'notifications/initialized',
      'tools/list #1',
      'Response #1',
    ])
    const invoked = await call(session.id, 'echo', { message: 'Bridge note' })
    expect(invoked.invocation).toMatchObject({
      argumentsJson: '{"message":"Bridge note"}',
      isError: false,
    })
    expect(JSON.parse(invoked.invocation?.resultJson ?? '')).toEqual({
      content: [{ type: 'text', text: 'Echo: Bridge note' }],
    })
    expect(labels(invoked).slice(-2)).toEqual(['tools/call #2', 'Response #2'])

    const unlisted = await call(session.id, 'arbitrary_tool', {})
    expect(unlisted.error).toContain('outside')
    expect(labels(unlisted)).toEqual(labels(invoked))
  })

  it('reads the actual Apps resource and only accepts its current run grant', async () => {
    const { session } = await open('time')
    const asApp = (run: number) =>
      host.execute({
        _tag: 'Call',
        sessionId: session.id,
        tool: 'get-time',
        arguments: {},
        from: 'app',
        appRun: run,
      })
    const denied = await asApp(1)
    expect(denied.error).toContain('no active grant')
    expect(labels(denied)).not.toContain('tools/call #2')

    expect(session.tools).toEqual([
      expect.objectContaining({
        name: 'get-time',
        uiUri: 'ui://get-time/mcp-app.html',
      }),
    ])
    const invoked = await call(session.id, 'get-time', {})
    expect(invoked.error).toBeUndefined()
    expect(invoked.app?.html).toContain('get-time-btn')
    expect(labels(invoked)).toContain('resources/read #3')
    const readResponse = invoked.events.find(
      event => event.label === 'Response #3',
    )
    expect(readResponse?.detail).toContain('HTML resource')
    expect(readResponse?.detail).not.toContain('get-time-btn')

    if (!invoked.app) {
      throw new Error('Expected the upstream UI resource.')
    }
    const refreshed = await asApp(invoked.app.run)
    expect(refreshed.invocation).toMatchObject({
      tool: 'get-time',
      from: 'app',
      isError: false,
    })
    expect(refreshed.app).toBeUndefined()
    const reopened = await call(session.id, 'get-time', {})
    expect(reopened.app?.run).not.toBe(invoked.app.run)
    const expired = await asApp(invoked.app.run)
    expect(expired.error).toContain('no active grant')
    expect(labels(expired)).toEqual(labels(reopened))
  })

  it('reports a stopped dependency without adding a fictional exchange', async () => {
    const { session, reply } = await open('everything')
    const stopped = await host.execute({ _tag: 'Stop', sessionId: session.id })
    expect(stopped.session?.state).toBe('stopped')
    expect(
      stopped.events.find(event => event.label === 'MCP transport closed'),
    ).toBeDefined()

    const retry = await call(session.id, 'echo', { message: 'Still there?' })
    expect(retry.error).toMatch(/not connected/i)
    expect(retry.invocation).toBeUndefined()
    expect(labels(retry)).toEqual(labels(reply))
    expect(retry.events.at(-1)?.label).toBe('Call failed')

    await host.execute({ _tag: 'Close', sessionId: session.id })
    const closed = await call(session.id, 'echo', { message: 'Anyone?' })
    expect(closed.error).toContain('expired or is unavailable')
    expect(closed.events).toEqual([])
  })

  it('keeps the synthetic note unchanged on denial and increments on grant', async () => {
    const { session } = await open('boundary')
    const denied = await call(session.id, 'request_bridge_edit', {
      role: 'viewer',
    })
    expect(denied.invocation?.isError).toBe(true)
    expect(
      JSON.parse(denied.invocation?.resultJson ?? '').structuredContent,
    ).toMatchObject({
      role: 'viewer',
      outcome: 'denied',
      before: 1,
      after: 1,
    })
    const granted = await call(session.id, 'request_bridge_edit', {
      role: 'editor',
    })
    expect(granted.invocation?.isError).toBe(false)
    expect(
      JSON.parse(granted.invocation?.resultJson ?? '').structuredContent,
    ).toMatchObject({
      role: 'editor',
      outcome: 'granted',
      before: 1,
      after: 2,
    })
  })
})
