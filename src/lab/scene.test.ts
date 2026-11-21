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
      expect(text(/World store: commit path\./)).toExist(),
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
      expect(text('Nothing.')).toExist(),
      click(role('button', { name: 'Network' })),
      expect(text('Failed here. Called by Planner · 2 events.')).toExist(),
    )
  })
})

describe('the route of specimens', () => {
  test('a reference station shows its question and says it is not built', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: /One item contains a language/ })),
      expect(
        text(
          'Is the unit of responsibility a tool call, an individual effect, or the whole program?',
        ),
      ).toExist(),
      expect(text('Reference only · not built')).toExist(),
      expect(role('button', { name: /Execute/ })).toBeAbsent(),
    )
  })

  test('the fetch station runs and its bend changes the engine world', () => {
    const fetched = Effect.runSync(
      runOn(worldFor('calm', 'first-hop'), 'fetch_page', {
        url: 'https://valley.test/notice',
      }).pipe(Effect.provide(Pace.unpaced)),
    )
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: /Fetch a page/ })),
      expect(text('Simulated here')).toExist(),
      click(role('button', { name: 'First URL only' })),
      click(role('button', { name: 'Execute fetch_page' })),
      Command.resolve(
        RunCapability,
        Message.CompletedRunCapability({
          runId: 1,
          record: fetched.record,
          world: fetched.world,
        }),
      ),
      expect(text('Succeeded')).toExist(),
      expect(text('What came back')).toExist(),
      expect(role('button', { name: 'Page fetcher, ask' })).toExist(),
      expect(text('Page fetcher · fetch_page')).toExist(),
      expect(
        text(
          'robots.txt not consulted for hop 2: policy: check the first URL only',
        ),
      ).toExist(),
    )
  })
})

describe('memory and thinking stations', () => {
  test('memory shows where each thing lives', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: /Memory/ })),
      expect(text('Simulated here')).toExist(),
      expect(text('The conversation')).toExist(),
      expect(text('holds nothing between calls')).toExist(),
      expect(role('button', { name: 'Reinstall the package' })).toExist(),
      expect(role('button', { name: 'Home folder' })).toExist(),
    )
  })

  test('thinking says who wrote the plan', () => {
    const planned = Effect.runSync(
      runOn(
        worldFor('calm', 'every-hop', 'package-cache', 'consult'),
        'plan_steps',
        {
          from: 'forge',
          to: 'dock',
          thoughts: [],
        },
      ).pipe(Effect.provide(Pace.unpaced)),
    )
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: /Thinking/ })),
      click(role('button', { name: 'Asks another model' })),
      click(role('button', { name: 'Execute plan_steps' })),
      Command.resolve(
        RunCapability,
        Message.CompletedRunCapability({
          runId: 1,
          record: planned.record,
          world: planned.world,
        }),
      ),
      expect(text('The plan that came back')).toExist(),
      expect(
        text(
          'written by another model (scripted stand-in) · not checked against the map',
        ),
      ).toExist(),
    )
  })
})

describe('filesystem and perception stations', () => {
  test('the boundary view shows launch, client and effective lists', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: /Filesystem/ })),
      expect(text('Set at launch')).toExist(),
      expect(text('What the server enforces now')).toExist(),
      expect(text('no · /valley/mill/ledger.txt')).toExist(),
      click(role('button', { name: 'Client sends this root' })),
      expect(text('yes · /valley/mill/ledger.txt')).toExist(),
      expect(text('no · /valley/forge/orders.txt')).toExist(),
    )
  })

  test('perception shows the page beside what the tool perceives', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: /Browser perception/ })),
      expect(text('The page, as a person sees it')).toExist(),
      expect(text('no snapshot taken yet')).toExist(),
      expect(text('pixels drawn on a canvas')).toExist(),
    )
  })
})

describe('cli and gateway stations', () => {
  test('the CLI station shows server, artifact and live call side by side', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: /CLI, reversed/ })),
      expect(text('The generated CLI')).toExist(),
      expect(text('not generated yet')).toExist(),
      expect(role('button', { name: 'v2 adds destination' })).toExist(),
      expect(role('button', { name: 'Execute generate_cli' })).toExist(),
    )
  })

  test('the gateway station shows processes and reacts to the build', () => {
    scene(
      { update, view },
      given(initialModel),
      click(role('button', { name: /Local and remote/ })),
      expect(text('Server process #1')).toExist(),
      expect(text('shared by every client')).toExist(),
      click(role('button', { name: 'A process per connection' })),
      expect(text('No server process yet')).toExist(),
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
