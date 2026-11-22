// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { runOn } from './capabilities.ts'
import { Pace } from './services.ts'
import {
  CALM_MAX_SPAN,
  type World,
  passSessionTimeout,
  reconnectClient,
  seedWorld,
  useGatewayBuild,
  useServerSchema,
  vanishClient,
} from './world.ts'

const run = (world: World, name: string, input: unknown = {}) =>
  Effect.runSync(runOn(world, name, input).pipe(Effect.provide(Pace.unpaced)))
const fresh = seedWorld(CALM_MAX_SPAN)

describe('generated CLI as a snapshot', () => {
  test('there is nothing to call before generating', () => {
    expect(run(fresh, 'call_generated').record.outcome).toMatchObject({
      error: 'NoArtifact',
    })
  })

  test('a fresh artifact works', () => {
    const generated = run(fresh, 'generate_cli').world
    expect(run(generated, 'call_generated').record.outcome).toMatchObject({
      output: { sentFields: ['count'], schemaUsed: 1 },
    })
  })

  test('after the server changes, the artifact fails and a live call adapts', () => {
    const upgraded = useServerSchema(run(fresh, 'generate_cli').world, 2)
    const stale = run(upgraded, 'call_generated').record
    expect(stale.outcome).toMatchObject({
      error: 'SchemaMismatch',
      message: expect.stringContaining('missing destination'),
    })
    expect(
      stale.events.some(event =>
        event.detail.includes('The server was not asked'),
      ),
    ).toBe(true)
    expect(run(upgraded, 'call_live').record.outcome).toMatchObject({
      output: { sentFields: ['count', 'destination'], schemaUsed: 2 },
    })
  })

  test('regenerating fixes it; a downgrade breaks it the other way', () => {
    const regenerated = run(useServerSchema(fresh, 2), 'generate_cli').world
    expect(run(regenerated, 'call_generated').record.outcome._tag).toBe(
      'Succeeded',
    )
    expect(
      run(useServerSchema(regenerated, 1), 'call_generated').record.outcome,
    ).toMatchObject({ message: expect.stringContaining('unknown destination') })
  })
})

describe('who owns the process behind the gateway', () => {
  const go = (world: World, client: string, place: string) =>
    run(world, 'go_to', { client, place }).world
  const where = (world: World, client: string) =>
    run(world, 'where_am_i', { client }).record.outcome

  test('shared process: one client’s move changes the other’s answer', () => {
    const world = go(go(fresh, 'A', 'forge'), 'B', 'dock')
    expect(where(world, 'A')).toMatchObject({
      output: { place: 'dock', childId: 1 },
    })
  })

  test('a process per connection keeps the clients apart', () => {
    const world = go(
      go(useGatewayBuild(fresh, 'per-connection'), 'A', 'forge'),
      'B',
      'dock',
    )
    expect(where(world, 'A')).toMatchObject({
      output: { place: 'forge', childId: 1 },
    })
    expect(where(world, 'B')).toMatchObject({
      output: { place: 'dock', childId: 2 },
    })
  })

  test('per connection, a reconnect gets a fresh process and loses the state', () => {
    const world = reconnectClient(
      go(useGatewayBuild(fresh, 'per-connection'), 'A', 'forge'),
      'A',
    )
    expect(where(world, 'A')).toMatchObject({
      output: { place: '', childId: 2 },
    })
  })

  test('a vanished client leaves an orphan until the timeout passes', () => {
    const vanished = vanishClient(
      go(useGatewayBuild(fresh, 'per-connection'), 'A', 'forge'),
      'A',
    )
    expect(vanished.gateway.children).toMatchObject([{ id: 1, orphaned: true }])
    expect(passSessionTimeout(vanished).gateway.children).toEqual([])
  })

  test('shared process: reconnecting changes nothing', () => {
    const world = reconnectClient(go(fresh, 'A', 'forge'), 'A')
    expect(where(world, 'A')).toMatchObject({ output: { place: 'forge' } })
  })
})
