import { Effect, Schema } from 'effect'

import { Declined, NobodyToAsk, NotArrived } from './errors.ts'
import { type ComponentId, Trace, WorldStore } from './services.ts'
import { type Cart, type CraneSpot, type World } from './world.ts'

// NOTE: Two rungs of the ladder that the earlier specimens do not show.
// Both are the lab's own simulations on made-up data, not upstream code.
//
// Ask: a tool that, halfway through a call, asks the person a question. Over
// MCP this is elicitation: the server sends elicitation/create to the client
// and waits. Here the domain only receives the answer; the MCP server in
// src/adapters/lab-server.ts does the asking.
//
// Act in the world: a tool whose effect is a movement. The controller, the
// arm and the sensor are three made-up parts. Nothing physical moves.

const emit = (
  component: ComponentId,
  calledBy: ComponentId,
  kind: 'started' | 'succeeded' | 'failed' | 'state-changed',
  operation: string,
  detail: string,
) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    yield* trace.emit({ component, calledBy, kind, operation, detail })
  })

const readWorld = Effect.gen(function* () {
  const store = yield* WorldStore
  return yield* store.read
})

const commit = (world: World) =>
  Effect.gen(function* () {
    const store = yield* WorldStore
    yield* store.commit(world)
  })

// ASK

export const cartChoices = ['small', 'long'] as const
export const askAnswers = [
  'small',
  'long',
  'declined',
  'cancelled',
  'nobody',
] as const
export type AskAnswer = (typeof askAnswers)[number]

export const CartsListed = Schema.TaggedStruct('CartsListed', {
  carts: Schema.Array(Schema.String),
})

export const CartReserved = Schema.TaggedStruct('CartReserved', {
  cart: Schema.String,
  chosenBy: Schema.Literals(['you', 'the server']),
})

const cartLine = (cart: Cart): string =>
  cart.reservedBy === ''
    ? `${cart.name}: free`
    : `${cart.name}: reserved by ${cart.reservedBy}`

export const listCarts = (calledBy: ComponentId) =>
  Effect.gen(function* () {
    yield* emit('cart-server', calledBy, 'started', 'list carts', '')
    const world = yield* readWorld
    const carts = world.ask.carts.map(cartLine)
    yield* emit(
      'cart-store',
      'cart-server',
      'succeeded',
      'read',
      carts.join(' · '),
    )
    yield* emit(
      'cart-server',
      calledBy,
      'succeeded',
      'list carts',
      `${carts.length} carts`,
    )
    return CartsListed.make({ carts })
  })

export const askQuestion =
  'Two carts are free at the Forge. Which one do you mean?'

// NOTE: The answer arrives from outside the domain: "small" or "long" when the
// person chose, "declined" or "cancelled" when they did not, "nobody" when the
// path that called has no way to ask (the CLI, a program, a client without
// the elicitation capability).
export const reserveCart = (calledBy: ComponentId, answer: AskAnswer) =>
  Effect.gen(function* () {
    const step = {
      component: 'cart-server',
      calledBy,
      operation: 'reserve a cart',
    } as const
    yield* emit(step.component, step.calledBy, 'started', step.operation, '')
    const world = yield* readWorld
    const guessing = world.ask.build === 'guesses'
    if (!guessing) {
      if (answer === 'nobody') {
        const error = new NobodyToAsk({
          reason: 'this path has no client that can show a question',
        })
        yield* emit(
          step.component,
          step.calledBy,
          'failed',
          step.operation,
          'needed an answer, had nobody to ask',
        )
        return yield* error
      }
      if (answer === 'declined' || answer === 'cancelled') {
        yield* emit(
          'person',
          'cart-server',
          'failed',
          'answer the question',
          answer === 'declined' ? 'declined' : 'closed it without answering',
        )
        yield* emit(
          step.component,
          step.calledBy,
          'failed',
          step.operation,
          'nothing reserved',
        )
        return yield* new Declined({
          action: answer === 'declined' ? 'decline' : 'cancel',
        })
      }
      yield* emit(
        'person',
        'cart-server',
        'succeeded',
        'answer the question',
        `chose ${answer === 'small' ? 'the small cart' : 'the long cart'}`,
      )
    }
    const id: Cart['id'] = guessing
      ? 'small'
      : answer === 'long'
        ? 'long'
        : 'small'
    const chosenBy = guessing ? ('the server' as const) : ('you' as const)
    if (guessing) {
      yield* emit(
        'cart-server',
        'cart-server',
        'succeeded',
        'pick a cart',
        'picked the small cart itself. Nobody was asked.',
      )
    }
    const carts = world.ask.carts.map(cart =>
      cart.id === id ? { ...cart, reservedBy: 'you' } : cart,
    )
    yield* commit({ ...world, ask: { ...world.ask, carts } })
    const name = id === 'small' ? 'the small cart' : 'the long cart'
    yield* emit(
      'cart-store',
      'cart-server',
      'state-changed',
      `reserve ${name}`,
      'Anyone who lists the carts now sees it reserved.',
    )
    yield* emit(
      step.component,
      step.calledBy,
      'succeeded',
      step.operation,
      `${name}, chosen by ${chosenBy}`,
    )
    return CartReserved.make({ cart: name, chosenBy })
  })

// ACT IN THE WORLD

export const craneTargets = ['cart', 'ship', 'quay'] as const
export type CraneTarget = (typeof craneTargets)[number]

export const spotName: Record<CraneSpot, string> = {
  quay: 'the quay',
  cart: 'the cart',
  ship: 'the ship',
  halfway: 'halfway, hanging from the arm',
}

export const CrateMoved = Schema.TaggedStruct('CrateMoved', {
  to: Schema.String,
  reported: Schema.String,
  checked: Schema.Boolean,
})

export const SensorRead = Schema.TaggedStruct('SensorRead', {
  crateAt: Schema.String,
})

export const moveCrate = (calledBy: ComponentId, to: CraneTarget) =>
  Effect.gen(function* () {
    const step = {
      component: 'crane-server',
      calledBy,
      operation: `move the crate to ${spotName[to]}`,
    } as const
    yield* emit(step.component, step.calledBy, 'started', step.operation, '')
    const world = yield* readWorld
    yield* emit(
      'controller',
      'crane-server',
      'succeeded',
      `command: move to ${to}`,
      'accepted',
    )
    const blocked = world.arm.obstacle === 'blocked' && to !== world.arm.crate
    const landed: CraneSpot = blocked ? 'halfway' : to
    yield* commit({
      ...world,
      arm: { ...world.arm, crate: landed, moves: world.arm.moves + 1 },
    })
    yield* emit(
      'arm',
      'controller',
      'state-changed',
      blocked ? 'swing, stop' : 'swing, lower, release',
      blocked
        ? 'Something was in the way. The arm stopped with the crate hanging. There is no undo for a movement.'
        : `The crate is at ${spotName[to]}. There is no undo for a movement.`,
    )
    if (world.arm.confirm === 'sensor') {
      yield* emit(
        'sensor',
        'crane-server',
        'succeeded',
        'where is the crate?',
        spotName[landed],
      )
      if (blocked) {
        yield* emit(
          step.component,
          step.calledBy,
          'failed',
          step.operation,
          'the sensor disagrees',
        )
        return yield* new NotArrived({ to: spotName[to], at: spotName[landed] })
      }
    }
    yield* emit(
      step.component,
      step.calledBy,
      'succeeded',
      step.operation,
      world.arm.confirm === 'sensor'
        ? 'confirmed by the sensor'
        : 'command accepted; nothing checked where the crate ended up',
    )
    return CrateMoved.make({
      to: spotName[to],
      reported:
        world.arm.confirm === 'sensor'
          ? 'Arrived. The sensor confirms it.'
          : 'Moved.',
      checked: world.arm.confirm === 'sensor',
    })
  })

export const readSensor = (calledBy: ComponentId) =>
  Effect.gen(function* () {
    yield* emit('crane-server', calledBy, 'started', 'read the sensor', '')
    const world = yield* readWorld
    yield* emit(
      'sensor',
      'crane-server',
      'succeeded',
      'where is the crate?',
      spotName[world.arm.crate],
    )
    yield* emit(
      'crane-server',
      calledBy,
      'succeeded',
      'read the sensor',
      spotName[world.arm.crate],
    )
    return SensorRead.make({ crateAt: spotName[world.arm.crate] })
  })
