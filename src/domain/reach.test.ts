import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { runOn } from './capabilities.ts'
import { Pace } from './services.ts'
import { applySettings } from './settings.ts'
import { CALM_MAX_SPAN, type World, seedWorld } from './world.ts'

const calm = seedWorld(CALM_MAX_SPAN)
const call = (world: World, name: string, input: unknown) =>
  Effect.runSync(runOn(world, name, input).pipe(Effect.provide(Pace.unpaced)))

describe('a tool that asks you', () => {
  test('a path with nobody to ask fails instead of guessing', () => {
    const done = call(calm, 'reserve_cart', {})
    expect(done.record.outcome).toMatchObject({
      _tag: 'Failed',
      error: 'NobodyToAsk',
    })
    expect(done.world.ask.carts.every(cart => cart.reservedBy === '')).toBe(
      true,
    )
  })

  test('the answer decides the cart, and every list shows it', () => {
    const reserved = call(calm, 'reserve_cart', { answer: 'long' })
    const listed = call(reserved.world, 'list_carts', {})
    expect(listed.record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: {
        carts: ['the small cart: free', 'the long cart: reserved by you'],
      },
    })
  })

  test('a server built to guess picks the small cart and says so', () => {
    const done = call(
      applySettings(calm, ['asking=guesses']),
      'reserve_cart',
      {},
    )
    expect(done.record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: { cart: 'the small cart', chosenBy: 'the server' },
    })
    expect(done.record.events.some(event => event.component === 'person')).toBe(
      false,
    )
  })
})

describe('a tool that moves something', () => {
  const blocked = applySettings(calm, ['obstacle=blocked'])

  test('“Moved.” can come back while the crate hangs halfway', () => {
    const moved = call(blocked, 'move_crate', { to: 'ship' })
    expect(moved.record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: { reported: 'Moved.', checked: false },
    })
    const sensed = call(moved.world, 'read_sensor', {})
    expect(sensed.record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: { crateAt: 'halfway, hanging from the arm' },
    })
  })

  test('a server that checks the sensor fails honestly, and the move still happened', () => {
    const done = call(
      applySettings(blocked, ['confirm=sensor']),
      'move_crate',
      { to: 'ship' },
    )
    expect(done.record.outcome).toMatchObject({
      _tag: 'Failed',
      error: 'NotArrived',
    })
    expect(done.world.arm).toMatchObject({ crate: 'halfway', moves: 1 })
  })

  test('with the way clear the crate arrives', () => {
    const done = call(calm, 'move_crate', { to: 'cart' })
    expect(done.world.arm.crate).toBe('cart')
  })
})
