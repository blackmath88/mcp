// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import { applySettings } from '../domain/settings.ts'
import { CALM_MAX_SPAN, seedWorld } from '../domain/world.ts'
import { flowOf } from './flow.ts'

const run = (name: string, settings: ReadonlyArray<string> = []) =>
  Effect.runSync(
    runOn(applySettings(seedWorld(CALM_MAX_SPAN), settings), name, {}).pipe(
      Effect.provide(Pace.unpaced),
    ),
  ).record

describe('the path a call took', () => {
  test('it is read from the engine events, in the order components were reached', () => {
    const record = run('run_as_program')
    const stops = flowOf(record, record.events)
    expect(stops.map(stop => stop.component)).toEqual(['sandbox', 'ledger'])
    expect(stops.every(stop => stop.reached)).toBe(true)
    expect(stops.find(stop => stop.component === 'ledger')?.changed).toBe(true)
  })

  test('halfway through a replay only the stops reached so far are lit', () => {
    const record = run('run_as_program')
    const stops = flowOf(record, record.events.slice(0, 3))
    expect(stops.filter(stop => stop.reached).length).toBeLessThan(stops.length)
  })

  test('a failure is marked where it happened', () => {
    const record = run('run_as_program', ['fault=after-second'])
    const stops = flowOf(record, record.events)
    expect(stops.find(stop => stop.component === 'ledger')?.failed).toBe(true)
  })
})
