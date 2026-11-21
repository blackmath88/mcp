// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { runOn } from './capabilities.ts'
import { Pace } from './services.ts'
import { applySettings } from './settings.ts'
import { CALM_MAX_SPAN, type World, panMap, seedWorld } from './world.ts'

const run = (world: World, name: string, input: unknown = {}) =>
  Effect.runSync(runOn(world, name, input).pipe(Effect.provide(Pace.unpaced)))
const fresh = seedWorld(CALM_MAX_SPAN)
const bent = (...settings: ReadonlyArray<string>) =>
  applySettings(fresh, settings)

describe('08 the item becomes an application', () => {
  test('after the person moves the map, only asking the app tells the truth', () => {
    const moved = panMap(
      run(fresh, 'show_map', { place: 'forge' }).world,
      'dock',
    )
    expect(moved.app).toMatchObject({
      shown: 'forge',
      view: 'dock',
      modelKnows: 'forge',
    })
    const asked = run(moved, 'get_current_view')
    expect(asked.record.outcome).toMatchObject({
      output: { place: 'dock', differsFromToolResult: true },
    })
    expect(asked.world.app.modelKnows).toBe('dock')
  })

  test('an app that registers no view tool cannot be asked', () => {
    expect(
      run(bent('app=off'), 'get_current_view').record.outcome,
    ).toMatchObject({
      error: 'NotOffered',
    })
  })
})

describe('09 one item contains a language', () => {
  test('without a fault both ways write three entries, with 3 results or 1', () => {
    expect(run(fresh, 'run_as_calls').record.outcome).toMatchObject({
      output: { written: 3, resultsReported: 3 },
    })
    expect(run(fresh, 'run_as_program').record.outcome).toMatchObject({
      output: { written: 3, resultsReported: 1 },
    })
  })

  test('a failing third write leaves two entries either way: no rollback', () => {
    const calls = run(bent('fault=after-second'), 'run_as_calls')
    const program = run(bent('fault=after-second'), 'run_as_program')
    expect(calls.record.outcome).toMatchObject({ error: 'PartialFailure' })
    expect(program.record.outcome).toMatchObject({ error: 'PartialFailure' })
    expect(calls.world.ledger.entries).toEqual(['clay', 'timber'])
    expect(program.world.ledger.entries).toEqual(['clay', 'timber'])
  })
})

describe('10 another intelligence', () => {
  test('with the map the stand-in answers from it; without, it answers anyway', () => {
    expect(run(fresh, 'ask_expert').record.outcome).toMatchObject({
      output: { grounded: true, nextStepOwner: 'you' },
    })
    expect(
      run(bent('context=none'), 'ask_expert').record.outcome,
    ).toMatchObject({
      output: { grounded: false, reply: expect.stringContaining('river road') },
    })
  })

  test('review changes nothing; deliver stores an artifact the expert owns', () => {
    expect(run(fresh, 'review_plan').world.artifacts).toEqual([])
    const delivered = run(bent('context=none'), 'deliver_plan')
    expect(delivered.record.outcome).toMatchObject({
      output: { nextStepOwner: 'the expert', grounded: false },
    })
    expect(delivered.world.artifacts).toMatchObject([{ kind: 'delivery' }])
  })

  test('the trace says what was handed over', () => {
    const events = run(bent('context=none'), 'ask_expert').record.events
    expect(
      events.find(event => event.component === 'expert-model')?.detail,
    ).toContain('The map was left out')
  })
})

describe('11 iteration and durable execution', () => {
  test('stops as soon as a draft is rated GOOD', () => {
    expect(run(fresh, 'refine_plan').record.outcome).toMatchObject({
      output: { ratings: ['FAIR', 'GOOD'], returnedDraft: 2, draftsWritten: 2 },
    })
  })

  test('with unmeetable criteria it stops at the limit and returns the best rated, not the last', () => {
    expect(
      run(bent('criteria=contradictory'), 'refine_plan').record.outcome,
    ).toMatchObject({
      output: {
        ratings: ['FAIR', 'FAIR', 'FAIR'],
        returnedDraft: 1,
        draftsWritten: 4,
      },
    })
  })

  test('only the durable engine avoids redoing work after a crash', () => {
    expect(run(fresh, 'crash_and_resume').record.outcome).toMatchObject({
      output: { generationsRedone: 2 },
    })
    expect(
      run(bent('engine=durable'), 'crash_and_resume').record.outcome,
    ).toMatchObject({
      output: { generationsRedone: 0 },
    })
  })
})

describe('12 the network', () => {
  test('first name wins hides one backend’s tool', () => {
    expect(run(fresh, 'list_inventory').record.outcome).toMatchObject({
      output: { hidden: 1 },
    })
    expect(
      run(fresh, 'call_tool', { name: 'inspect' }).record.outcome,
    ).toMatchObject({
      output: { answeredBy: 'forge-backend' },
    })
  })

  test('prefixed names reach both', () => {
    const world = bent('naming=prefixed')
    expect(run(world, 'list_inventory').record.outcome).toMatchObject({
      output: { hidden: 0 },
    })
    expect(
      run(world, 'call_tool', { name: 'dock.inspect' }).record.outcome,
    ).toMatchObject({
      output: { answeredBy: 'dock-backend' },
    })
  })

  test('a down backend is still listed and fails when called', () => {
    const world = bent('dock=down')
    expect(run(world, 'list_inventory').record.outcome).toMatchObject({
      output: { tools: expect.arrayContaining(['weigh → dock-backend']) },
    })
    expect(
      run(world, 'call_tool', { name: 'weigh' }).record.outcome,
    ).toMatchObject({
      error: 'BackendDown',
    })
    expect(
      run(world, 'call_tool', { name: 'nope' }).record.outcome,
    ).toMatchObject({
      error: 'UnknownTool',
    })
  })
})
