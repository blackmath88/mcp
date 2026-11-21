// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { runOn } from './capabilities.ts'
import { Pace } from './services.ts'
import {
  CALM_MAX_SPAN,
  STORM_MAX_SPAN,
  type World,
  seedWorld,
} from './world.ts'

const runSync = (world: World, name: string, input: unknown) =>
  Effect.runSync(runOn(world, name, input).pipe(Effect.provide(Pace.unpaced)))

const calm = seedWorld(CALM_MAX_SPAN)
const storm = seedWorld(STORM_MAX_SPAN)
const forgeToDock = { from: 'forge', to: 'dock' }

describe('simple capabilities', () => {
  test('read_map reports the seed world and changes nothing', () => {
    const { record, world } = runSync(calm, 'read_map', {})
    expect(record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: { _tag: 'MapRead', revision: 0, maxSpan: 3 },
    })
    expect(world).toEqual(calm)
  })

  test('find_route answers along existing paths', () => {
    const { record } = runSync(calm, 'find_route', {
      from: 'forge',
      to: 'mill',
    })
    expect(record.outcome).toMatchObject({
      output: { route: { places: ['forge', 'mill'], span: 2 } },
    })
  })

  test('find_route fails with NoRoute when the places are not connected', () => {
    const { record } = runSync(calm, 'find_route', forgeToDock)
    expect(record.outcome).toMatchObject({ _tag: 'Failed', error: 'NoRoute' })
  })

  test('build_path adds a path, bumps the revision and stores an artifact', () => {
    const { record, world } = runSync(calm, 'build_path', {
      from: 'mill',
      to: 'archive',
    })
    expect(record.outcome._tag).toBe('Succeeded')
    expect(record.revisionAfter).toBe(1)
    expect(world.paths).toHaveLength(3)
    expect(world.artifacts.map(artifact => artifact.id)).toEqual(['path-1'])
  })

  test('build_path refuses a span over the limit and leaves the world alone', () => {
    const { record, world } = runSync(calm, 'build_path', forgeToDock)
    expect(record.outcome).toMatchObject({ error: 'PathTooLong' })
    expect(world).toEqual(calm)
  })

  test('build_path refuses a duplicate and a self-link', () => {
    expect(
      runSync(calm, 'build_path', { from: 'mill', to: 'forge' }).record.outcome,
    ).toMatchObject({ error: 'PathExists' })
    expect(
      runSync(calm, 'build_path', { from: 'mill', to: 'mill' }).record.outcome,
    ).toMatchObject({ error: 'SamePlace' })
  })

  test('invalid input and unknown capabilities fail in the catalogue', () => {
    const invalid = runSync(calm, 'find_route', { from: 'forge', to: 'moon' })
    expect(invalid.record.outcome).toMatchObject({ error: 'InvalidInput' })
    expect(invalid.record.events.at(-1)).toMatchObject({
      component: 'catalogue',
      kind: 'failed',
    })
    expect(runSync(calm, 'dig', {}).record.outcome).toMatchObject({
      error: 'UnknownCapability',
    })
  })
})

describe('connect_places', () => {
  test('inspects, plans, validates, builds and reports', () => {
    const { record, world } = runSync(calm, 'connect_places', forgeToDock)
    expect(record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: {
        route: { places: ['forge', 'mill', 'kiln', 'dock'] },
        builtPaths: [{ from: 'mill', to: 'kiln', span: 2.2 }],
        revision: 1,
      },
    })
    expect(world.artifacts.map(artifact => artifact.kind)).toEqual([
      'path',
      'connection-report',
    ])
    const stages = record.events
      .filter(event => event.kind !== 'started')
      .map(event => `${event.component}:${event.kind}`)
    expect(stages.indexOf('validator:succeeded')).toBeLessThan(
      stages.indexOf('world-store:state-changed'),
    )
    expect(record.events.map(event => event.seq)).toEqual(
      record.events.map((_, index) => index + 1),
    )
  })

  test('in a storm the validator refuses the plan and nothing is built', () => {
    const { record, world } = runSync(storm, 'connect_places', forgeToDock)
    expect(record.outcome).toMatchObject({
      _tag: 'Failed',
      error: 'PathTooLong',
    })
    expect(world).toEqual(storm)
    expect(record.events.some(event => event.operation === 'plan')).toBe(true)
    expect(record.events.some(event => event.kind === 'state-changed')).toBe(
      false,
    )
    expect(record.events.find(event => event.kind === 'failed')).toMatchObject({
      component: 'validator',
      calledBy: 'planner',
    })
  })

  test('a second run finds the route and builds nothing', () => {
    const first = runSync(calm, 'connect_places', forgeToDock)
    const second = runSync(first.world, 'connect_places', forgeToDock)
    expect(second.record.outcome).toMatchObject({
      output: { builtPaths: [], revision: 1 },
    })
    expect(second.record.revisionAfter).toBe(1)
    expect(second.world.paths).toEqual(first.world.paths)
  })
})
