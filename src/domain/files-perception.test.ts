// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { runOn } from './capabilities.ts'
import { Pace } from './services.ts'
import {
  CALM_MAX_SPAN,
  type FsBuild,
  type World,
  applyRootsUpdate,
  seedWorld,
  usePerception,
} from './world.ts'

const run = (world: World, name: string, input: unknown) =>
  Effect.runSync(runOn(world, name, input).pipe(Effect.provide(Pace.unpaced)))

const withBuild = (build: FsBuild) =>
  seedWorld(CALM_MAX_SPAN, 'every-hop', 'package-cache', 'record', build)
const read = (world: World, path: string) =>
  run(world, 'read_file', { path }).record.outcome
const forge = '/valley/forge/orders.txt'
const mill = '/valley/mill/ledger.txt'

describe('filesystem boundary', () => {
  test('before any roots, only the launch directory is readable', () => {
    expect(read(withBuild('default'), forge)._tag).toBe('Succeeded')
    expect(read(withBuild('default'), mill)).toMatchObject({
      error: 'AccessDenied',
    })
  })

  test('default build: client roots replace the launch directories', () => {
    const world = applyRootsUpdate(withBuild('default'), ['/valley/mill'])
    expect(read(world, mill)._tag).toBe('Succeeded')
    expect(read(world, forge)).toMatchObject({ error: 'AccessDenied' })
  })

  test('confine build: roots narrow, never widen or replace', () => {
    const outside = applyRootsUpdate(withBuild('confine'), ['/valley/mill'])
    expect(read(outside, mill)).toMatchObject({ error: 'AccessDenied' })
    expect(read(outside, forge)._tag).toBe('Succeeded')
    const wider = applyRootsUpdate(withBuild('confine'), ['/valley'])
    expect(wider.files.allowed).toEqual(['/valley/forge'])
    const narrower = applyRootsUpdate(withBuild('confine'), [
      '/valley/forge/plans',
    ])
    expect(read(narrower, forge)).toMatchObject({ error: 'AccessDenied' })
    expect(read(narrower, '/valley/forge/plans/bridge.txt')._tag).toBe(
      'Succeeded',
    )
  })

  test('an empty first update keeps the launch directories', () => {
    expect(applyRootsUpdate(withBuild('default'), []).files.allowed).toEqual([
      '/valley/forge',
    ])
  })

  test('revoking roots after they were in force revokes access', () => {
    const revoked = applyRootsUpdate(
      applyRootsUpdate(withBuild('default'), ['/valley/mill']),
      [],
    )
    expect(revoked.files.allowed).toEqual([])
    expect(read(revoked, mill)).toMatchObject({
      error: 'AccessDenied',
      message: expect.stringContaining('no allowed directories'),
    })
  })

  test('the pre-fix build keeps the old list after the client revokes', () => {
    const revoked = applyRootsUpdate(
      applyRootsUpdate(withBuild('pre-fix'), ['/valley/mill']),
      [],
    )
    expect(read(revoked, mill)._tag).toBe('Succeeded')
  })
})

describe('browser perception', () => {
  const fresh = seedWorld(CALM_MAX_SPAN)
  const click = (world: World, target: string) =>
    run(world, 'click', { target })

  test('clicking needs a snapshot first', () => {
    expect(click(fresh, 'gate').record.outcome).toMatchObject({
      error: 'NoSnapshot',
    })
  })

  test('the snapshot lists only controls with a role and a name', () => {
    expect(run(fresh, 'take_snapshot', {}).record.outcome).toMatchObject({
      output: {
        entries: [{ name: 'Open gate' }, { name: 'Ring bell' }],
        notExposed: 2,
      },
    })
  })

  test('a labelled control can be clicked; references then go stale', () => {
    const seen = run(fresh, 'take_snapshot', {}).world
    const opened = click(seen, 'gate')
    expect(opened.record.outcome._tag).toBe('Succeeded')
    expect(opened.world.page.gate).toBe(true)
    expect(click(opened.world, 'bell').record.outcome).toMatchObject({
      error: 'StaleReference',
    })
    const again = run(opened.world, 'take_snapshot', {}).world
    expect(click(again, 'bell').record.outcome._tag).toBe('Succeeded')
  })

  test('unlabelled and canvas controls cannot be addressed by reference', () => {
    const seen = run(fresh, 'take_snapshot', {}).world
    expect(click(seen, 'lever').record.outcome).toMatchObject({
      error: 'NotPerceivable',
    })
    expect(click(seen, 'valve').record.outcome).toMatchObject({
      error: 'NotPerceivable',
    })
    expect(click(seen, 'lever').world.page.lever).toBe(false)
  })

  test('with coordinates on, anything can be clicked without a snapshot', () => {
    const vision = usePerception(fresh, 'vision')
    const pulled = click(vision, 'lever')
    expect(pulled.record.outcome).toMatchObject({
      output: { how: 'coordinates (180, 40)' },
    })
    expect(pulled.world.page.lever).toBe(true)
  })
})
