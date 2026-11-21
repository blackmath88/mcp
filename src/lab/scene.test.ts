import { Effect } from 'effect'
import { Command, click, expect, given, role, scene, text } from 'foldkit/scene'
import { describe, test } from 'vitest'

import { runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import { Message } from './message.ts'
import { worldFor } from './model.ts'
import { RunCapability, initialModel, update } from './update.ts'
import { view } from './view.ts'

const completed = (weather: 'calm' | 'storm') => {
  const result = Effect.runSync(
    runOn(worldFor(weather), 'connect_places', {
      from: 'forge',
      to: 'dock',
    }).pipe(Effect.provide(Pace.unpaced)),
  )
  return Message.CompletedRunCapability({
    runId: 1,
    record: result.record,
    world: result.world,
  })
}

describe('the learning path', () => {
  test('the kit is discoverable before anything is selected', () => {
    scene(
      { update, view },
      given(initialModel),
      expect(role('button', { name: 'Map, read' })).toExist(),
      expect(
        role('button', { name: 'Connection workshop, program' }),
      ).toExist(),
      expect(text('Pick an item from the kit to use it.')).toExist(),
      expect(text('Idle')).toExist(),
    )
  })

  test('inspect an item, execute it, see the artifact and the trace', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: 'Connection workshop, program' })),
      expect(text('What can change?')).toExist(),
      expect(text('It may build a path. It decides which one.')).toExist(),
      click(role('button', { name: 'Execute connect_places' })),
      expect(text('Running connect_places')).toExist(),
      Command.resolve(RunCapability, completed('calm')),
      expect(text('Succeeded')).toExist(),
      expect(text('Artifacts in the valley')).toExist(),
      expect(text('Showing 20 of 20 events')).toExist(),
      expect(
        text('commit path: revision 0 → 1: added mill–kiln (span 2.2)'),
      ).toExist(),
      expect(text('The map went from revision 0 to 1.')).toExist(),
    )
  })

  test('the trace can be stepped from the start', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: 'Connection workshop, program' })),
      click(role('button', { name: 'Execute connect_places' })),
      Command.resolve(RunCapability, completed('calm')),
      click(role('button', { name: 'From the start' })),
      expect(text('Showing 0 of 20 events')).toExist(),
      click(role('button', { name: 'Step' })),
      expect(text('Showing 1 of 20 events')).toExist(),
      click(role('button', { name: 'Show all' })),
      expect(text('Showing 20 of 20 events')).toExist(),
    )
  })

  test('the storm failure names where it happened and what was left undone', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: /Bend it/ })),
      click(role('button', { name: 'Execute connect_places' })),
      Command.resolve(RunCapability, completed('storm')),
      expect(text('Failed')).toExist(),
      expect(
        text('Nothing was built. The map is still at revision 0.'),
      ).toExist(),
      expect(text('Nothing. The map stayed at revision 0.')).toExist(),
      click(role('button', { name: 'Network' })),
      expect(text('Failed here. Called by Planner · 2 events.')).toExist(),
    )
  })
})

describe('truthful labelling of evidence', () => {
  test('engine events are labelled in-process, never as MCP traffic', () => {
    scene(
      { update, view },
      given(initialModel),
      expect(text('In-process domain execution')).toExist(),
      expect(text('Recorded external execution')).toBeAbsent(),
    )
  })

  test('MCP frames appear only under the recorded label', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: 'Recorded CLI + MCP' })),
      expect(text('Recorded external execution')).toExist(),
      expect(text('In-process domain execution')).toBeAbsent(),
      expect(text('initialize')).toExist(),
      expect(text('tools/call')).toExist(),
    )
  })

  test('app messages are labelled as application state transitions', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: 'App messages' })),
      expect(text('Application state transitions')).toExist(),
      expect(text('SelectedTab')).toExist(),
    )
  })
})
