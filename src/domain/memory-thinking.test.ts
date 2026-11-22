// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { runOn } from './capabilities.ts'
import { Pace } from './services.ts'
import {
  CALM_MAX_SPAN,
  type ThinkingMode,
  type World,
  reinstallPackage,
  seedWorld,
  useStoragePath,
} from './world.ts'

const run = (world: World, name: string, input: unknown) =>
  Effect.runSync(runOn(world, name, input).pipe(Effect.provide(Pace.unpaced)))

const blue = { entity: 'Workshop A', observation: 'belongs to Team Blue' }
const red = { entity: 'Workshop A', observation: 'belongs to Team Red' }
const about = { entity: 'Workshop A' }

describe('memory', () => {
  const fresh = seedWorld(CALM_MAX_SPAN)

  test('a remembered fact can be recalled from the same path', () => {
    const stored = run(fresh, 'remember', blue)
    expect(stored.record.outcome).toMatchObject({
      output: { _tag: 'Remembered', factsInFile: 1 },
    })
    expect(run(stored.world, 'recall', about).record.outcome).toMatchObject({
      output: { observations: ['belongs to Team Blue'] },
    })
  })

  test('recall of something never stored is an empty answer, not an error', () => {
    expect(run(fresh, 'recall', about).record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: { observations: [] },
    })
  })

  test('conflicting statements are both kept and both returned', () => {
    const both = run(run(fresh, 'remember', blue).world, 'remember', red)
    expect(run(both.world, 'recall', about).record.outcome).toMatchObject({
      output: { observations: ['belongs to Team Blue', 'belongs to Team Red'] },
    })
  })

  test('changing the storage path hides the facts without deleting them', () => {
    const stored = run(fresh, 'remember', blue).world
    const moved = useStoragePath(stored, 'home')
    expect(run(moved, 'recall', about).record.outcome).toMatchObject({
      output: { observations: [] },
    })
    expect(
      run(useStoragePath(moved, 'package-cache'), 'recall', about).record
        .outcome,
    ).toMatchObject({ output: { observations: ['belongs to Team Blue'] } })
  })

  test('reinstalling wipes the package cache but not the home folder', () => {
    const inCache = run(fresh, 'remember', blue).world
    const inHome = run(useStoragePath(fresh, 'home'), 'remember', blue).world
    expect(
      run(reinstallPackage(inCache), 'recall', about).record.outcome,
    ).toMatchObject({ output: { observations: [] } })
    expect(
      run(reinstallPackage(inHome), 'recall', about).record.outcome,
    ).toMatchObject({ output: { observations: ['belongs to Team Blue'] } })
  })

  test('input outside the fixed lists is invalid', () => {
    expect(
      run(fresh, 'remember', { entity: 'Workshop Z', observation: 'x' }).record
        .outcome,
    ).toMatchObject({ error: 'InvalidInput' })
  })
})

describe('plan_steps: one tool name, three things inside', () => {
  const goal = { from: 'forge', to: 'dock', thoughts: ['Guess.', 'Go.'] }
  const plan = (mode: ThinkingMode) =>
    run(
      seedWorld(CALM_MAX_SPAN, 'every-hop', 'package-cache', mode),
      'plan_steps',
      goal,
    ).record

  test('record returns the caller’s thoughts and consults nothing', () => {
    const record = plan('record')
    expect(record.outcome).toMatchObject({
      output: {
        steps: ['Guess.', 'Go.'],
        madeBy: 'the caller',
        checkedAgainstMap: false,
      },
    })
    expect(record.events.some(event => event.component === 'map')).toBe(false)
    expect(
      record.events.some(event => event.component === 'expert-model'),
    ).toBe(false)
  })

  test('compute reads the map and reports that no route exists', () => {
    const record = plan('compute')
    expect(record.outcome).toMatchObject({
      output: { madeBy: 'a deterministic algorithm', checkedAgainstMap: true },
    })
    expect(record.events.some(event => event.component === 'map')).toBe(true)
  })

  test('consult passes on a stand-in reply that never saw the map', () => {
    const record = plan('consult')
    expect(record.outcome).toMatchObject({
      output: { checkedAgainstMap: false },
    })
    expect(
      record.events.find(event => event.component === 'expert-model'),
    ).toMatchObject({ detail: expect.stringContaining('The map was not sent') })
    expect(record.events.some(event => event.component === 'map')).toBe(false)
  })
})
