// @vitest-environment node
import { Effect, Option } from 'effect'
import { beforeEach, describe, expect, test } from 'vitest'

import { runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import { CALM_MAX_SPAN, STORM_MAX_SPAN, seedWorld } from '../domain/world.ts'
import { enterDomain, resetSession, runOverMcp, sendRaw } from './in-tab-mcp.ts'

const goal = { from: 'forge', to: 'dock' }
const calm = seedWorld(CALM_MAX_SPAN)
const labels = (frames: ReadonlyArray<{ direction: string; label: string }>) =>
  frames.map(frame => `${frame.direction} ${frame.label}`)
const run = <A>(effect: Effect.Effect<A, Error>) => Effect.runPromise(effect)

beforeEach(() => {
  resetSession()
})

describe('one live session over the in-memory transport', () => {
  test('connecting performs the handshake and lists the kit of the domain', async () => {
    const entered = await run(enterDomain(calm, 'valley', Pace.unpaced))
    expect(labels(entered.frames)).toEqual([
      'client → server initialize',
      'server → client result',
      'client → server notifications/initialized',
      'client → server tools/list',
      'server → client result',
    ])
    expect(entered.tools.map(tool => tool.name)).toEqual([
      'read_map',
      'find_route',
      'build_path',
      'connect_places',
      'enter_domain',
    ])
  })

  test('entering another domain makes the server announce a new kit', async () => {
    await run(enterDomain(calm, 'valley', Pace.unpaced))
    const moved = await run(enterDomain(calm, 'memory', Pace.unpaced))
    expect(labels(moved.frames)).toEqual([
      'client → server tools/call',
      'server → client notifications/tools/list_changed',
      'client → server tools/list',
      'server → client result',
      'server → client result',
    ])
    expect(moved.tools.map(tool => tool.name)).toEqual([
      'remember',
      'recall',
      'enter_domain',
    ])
  })

  test('a run on the open session is one tools/call, no second handshake', async () => {
    await run(enterDomain(calm, 'valley', Pace.unpaced))
    const done = await run(
      runOverMcp(calm, 'valley', 'connect_places', goal, Pace.unpaced),
    )
    expect(labels(done.frames)).toEqual([
      'client → server tools/call',
      'server → client result',
    ])
    const direct = Effect.runSync(
      runOn(calm, 'connect_places', goal).pipe(Effect.provide(Pace.unpaced)),
    )
    expect(done.record).toEqual(direct.record)
    expect(done.world).toEqual(direct.world)
  })

  test('a domain failure arrives as a tool result with isError', async () => {
    const done = await run(
      runOverMcp(
        seedWorld(STORM_MAX_SPAN),
        'valley',
        'connect_places',
        goal,
        Pace.unpaced,
      ),
    )
    expect(done.record.outcome).toMatchObject({ error: 'PathTooLong' })
    expect(done.frames.at(-1)?.label).toBe('result · isError: true')
  })
})

describe('the call console: whatever you write goes onto the wire', () => {
  const raw = (text: string) => run(sendRaw(calm, 'valley', text, Pace.unpaced))

  test('a well-formed call runs the tool and changes the world', async () => {
    const sent = await raw(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'build_path',
          arguments: { from: 'mill', to: 'archive' },
        },
      }),
    )
    expect(Option.isSome(sent.record)).toBe(true)
    expect(sent.world.revision).toBe(1)
  })

  test('text that is not JSON never leaves the client', async () => {
    const sent = await raw('{ "jsonrpc": ')
    expect(sent.sent).toBe(false)
    expect(sent.frames).toEqual([])
  })

  test('an unknown method gets a protocol error from the real server', async () => {
    const sent = await raw(
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/destroy' }),
    )
    expect(sent.frames.at(-1)?.label).toBe('error -32601')
  })

  test('a call with wrong arguments reaches the tool and comes back as isError', async () => {
    const sent = await raw(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'build_path', arguments: { from: 'mill', to: 'moon' } },
      }),
    )
    expect(sent.frames.at(-1)?.label).toBe('result · isError: true')
    expect(sent.world.revision).toBe(0)
  })

  test('a call without a tool name is an internal error in this SDK version', async () => {
    const sent = await raw(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {},
      }),
    )
    expect(sent.frames.at(-1)?.label).toBe('error -32603')
  })

  test('JSON that is not a request gets no answer', async () => {
    await run(enterDomain(calm, 'valley', Pace.unpaced))
    const sent = await raw(JSON.stringify({ hello: 'server' }))
    expect(sent.sent).toBe(true)
    expect(
      sent.frames.some(frame => frame.direction === 'server → client'),
    ).toBe(false)
  })
})
