// @vitest-environment node
import { Effect, Option } from 'effect'
import { beforeEach, describe, expect, test } from 'vitest'

import { runOn } from '../domain/capabilities.ts'
import { driftOf, pinNew, profile } from '../domain/lens.ts'
import { Pace } from '../domain/services.ts'
import { applySettings } from '../domain/settings.ts'
import { CALM_MAX_SPAN, STORM_MAX_SPAN, seedWorld } from '../domain/world.ts'
import {
  answerServer,
  enterDomain,
  isAsking,
  resetSession,
  runOverMcp,
  sendRaw,
} from './in-tab-mcp.ts'

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

describe('a definition that changes after it was seen', () => {
  test('the server announces the change and the next listing differs', async () => {
    const first = await run(enterDomain(calm, 'memory', Pace.unpaced))
    const before = first.tools.find(tool => tool.name === 'remember')
    const pins = pinNew([], first.tools)
    const second = await run(enterDomain(calm, 'memory', Pace.unpaced, true))
    expect(labels(second.frames)).toEqual([
      'server → client notifications/tools/list_changed',
      'client → server tools/list',
      'server → client result',
    ])
    const after = second.tools.find(tool => tool.name === 'remember')
    expect(after?.description).not.toBe(before?.description)
    expect(after === undefined ? '' : driftOf(pins, after)).toBe('changed')
    const flagged = profile(second.tools).tools.find(
      tool => tool.name === 'remember',
    )
    expect(flagged?.claims.some(claim => claim.rule === 'L09')).toBe(true)
    const restored = await run(enterDomain(calm, 'memory', Pace.unpaced))
    const again = restored.tools.find(tool => tool.name === 'remember')
    expect(again === undefined ? '' : driftOf(pins, again)).toBe('unchanged')
  })

  test('the listing carries parameter names for Lens to read', async () => {
    const entered = await run(enterDomain(calm, 'fetch', Pace.unpaced))
    expect(
      entered.tools.find(tool => tool.name === 'fetch_page')?.parameters,
    ).toEqual(['url'])
  })
})

describe('a server that asks the person mid-call', () => {
  const waitUntilAsking = async (): Promise<void> => {
    if (isAsking()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, 5))
    return waitUntilAsking()
  }

  test('reserve_cart sends elicitation/create and finishes with the answer', async () => {
    await run(enterDomain(calm, 'ask', Pace.unpaced))
    const call = run(
      runOverMcp(
        calm,
        'ask',
        'reserve_cart',
        { answer: 'small' },
        Pace.unpaced,
      ),
    )
    await waitUntilAsking()
    answerServer('long')
    const done = await call
    expect(labels(done.frames)).toEqual([
      'client → server tools/call',
      'server → client elicitation/create',
      'client → server result',
      'server → client result',
    ])
    expect(done.record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: { cart: 'the long cart', chosenBy: 'you' },
    })
  })

  test('declining reaches the server and nothing is reserved', async () => {
    await run(enterDomain(calm, 'ask', Pace.unpaced))
    const call = run(runOverMcp(calm, 'ask', 'reserve_cart', {}, Pace.unpaced))
    await waitUntilAsking()
    answerServer('decline')
    const done = await call
    expect(done.record.outcome).toMatchObject({
      _tag: 'Failed',
      error: 'Declined',
    })
    expect(done.world.ask.carts.every(cart => cart.reservedBy === '')).toBe(
      true,
    )
  })

  test('a server built to guess asks nobody, over the same tool list', async () => {
    const guessing = applySettings(calm, ['asking=guesses'])
    const asking = await run(enterDomain(calm, 'ask', Pace.unpaced))
    resetSession()
    const guessed = await run(enterDomain(guessing, 'ask', Pace.unpaced))
    expect(guessed.tools).toEqual(asking.tools)
    const done = await run(
      runOverMcp(guessing, 'ask', 'reserve_cart', {}, Pace.unpaced),
    )
    expect(labels(done.frames)).not.toContain(
      'server → client elicitation/create',
    )
    expect(done.record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: { chosenBy: 'the server' },
    })
  })
})
