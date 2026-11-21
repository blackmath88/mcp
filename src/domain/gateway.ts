import { Effect, Schema } from 'effect'

import { type ComponentId, Trace, WorldStore } from './services.ts'
import type { Child, World } from './world.ts'

// NOTE: The lab's own simulation of a gateway that bridges a stateful stdio
// server to network clients. Not upstream code.

export const clients = ['A', 'B'] as const
export const gatewayPlaces = ['forge', 'mill', 'kiln', 'dock'] as const

export const WentTo = Schema.TaggedStruct('WentTo', {
  client: Schema.String,
  place: Schema.String,
  childId: Schema.Number,
})
export type WentTo = typeof WentTo.Type

export const WhereAmI = Schema.TaggedStruct('WhereAmI', {
  client: Schema.String,
  place: Schema.String,
  childId: Schema.Number,
})
export type WhereAmI = typeof WhereAmI.Type

const route = Effect.fnUntraced(function* (client: string) {
  const trace = yield* Trace
  const store = yield* WorldStore
  const world = yield* store.read
  const gateway = world.gateway
  const existing = gateway.children.find(child =>
    gateway.build === 'shared'
      ? child.owner === 'shared'
      : child.owner === client && !child.orphaned,
  )
  if (existing !== undefined) {
    yield* trace.emit({
      component: 'gateway',
      calledBy: 'catalogue',
      kind: 'succeeded',
      operation: `route client ${client}`,
      detail:
        gateway.build === 'shared'
          ? `to child #${existing.id}, the one process every client shares`
          : `to child #${existing.id}, this connection’s own process`,
    })
    return { world, child: existing }
  }
  const child: Child = {
    id: gateway.nextChildId,
    owner: client,
    place: '',
    orphaned: false,
  }
  const next: World = {
    ...world,
    gateway: {
      ...gateway,
      children: [...gateway.children, child],
      nextChildId: gateway.nextChildId + 1,
    },
  }
  yield* store.commit(next)
  yield* trace.emit({
    component: 'gateway',
    calledBy: 'catalogue',
    kind: 'state-changed',
    operation: `spawn child #${child.id} for client ${client}`,
    detail: 'a new connection gets a new process, with empty state',
  })
  return { world: next, child }
})

export const goTo = (_calledBy: ComponentId, client: string, place: string) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const { world, child } = yield* route(client)
    yield* store.commit({
      ...world,
      gateway: {
        ...world.gateway,
        children: world.gateway.children.map(candidate =>
          candidate.id === child.id ? { ...candidate, place } : candidate,
        ),
      },
    })
    yield* trace.emit({
      component: 'child-process',
      calledBy: 'gateway',
      kind: 'state-changed',
      operation: `child #${child.id}: go to ${place}`,
      detail: `its one "current place" is now ${place}, whoever asked`,
    })
    return WentTo.make({ client, place, childId: child.id })
  })

export const whereAmI = (_calledBy: ComponentId, client: string) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const { child } = yield* route(client)
    yield* trace.emit({
      component: 'child-process',
      calledBy: 'gateway',
      kind: 'succeeded',
      operation: `child #${child.id}: where am I?`,
      detail: child.place === '' ? 'nowhere yet' : child.place,
    })
    return WhereAmI.make({ client, place: child.place, childId: child.id })
  })
