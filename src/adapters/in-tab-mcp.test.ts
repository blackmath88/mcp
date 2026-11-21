// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import { CALM_MAX_SPAN, STORM_MAX_SPAN, seedWorld } from '../domain/world.ts'
import { runOverMcp } from './in-tab-mcp.ts'

const goal = { from: 'forge', to: 'dock' }

describe('a real client and server over the in-memory transport', () => {
  test('a run performs the handshake and one tools/call, in order', async () => {
    const run = await Effect.runPromise(
      runOverMcp(
        seedWorld(CALM_MAX_SPAN),
        'connect_places',
        goal,
        Pace.unpaced,
      ),
    )
    expect(
      run.frames.map(frame => `${frame.direction} ${frame.label}`),
    ).toEqual([
      'client → server initialize',
      'server → client result',
      'client → server notifications/initialized',
      'client → server tools/call',
      'server → client result',
    ])
  })

  test('it returns the same record and world as calling the engine directly', async () => {
    const world = seedWorld(CALM_MAX_SPAN)
    const overMcp = await Effect.runPromise(
      runOverMcp(world, 'connect_places', goal, Pace.unpaced),
    )
    const direct = Effect.runSync(
      runOn(world, 'connect_places', goal).pipe(Effect.provide(Pace.unpaced)),
    )
    expect(overMcp.record).toEqual(direct.record)
    expect(overMcp.world).toEqual(direct.world)
  })

  test('a domain failure arrives as a tool result with isError', async () => {
    const run = await Effect.runPromise(
      runOverMcp(
        seedWorld(STORM_MAX_SPAN),
        'connect_places',
        goal,
        Pace.unpaced,
      ),
    )
    expect(run.record.outcome).toMatchObject({ error: 'PathTooLong' })
    expect(run.frames.at(-1)?.label).toBe('result · isError: true')
  })

  test('an unknown tool is still answered by the server, not by the page', async () => {
    const run = await Effect.runPromise(
      runOverMcp(seedWorld(CALM_MAX_SPAN), 'dig', {}, Pace.unpaced),
    )
    expect(run.record.outcome).toMatchObject({ error: 'UnknownCapability' })
  })
})
