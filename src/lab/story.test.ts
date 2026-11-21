import { Effect, Option } from 'effect'
import { Command, given, message, model, story } from 'foldkit/story'
import { describe, expect, test } from 'vitest'

import { catalogue, families, runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import { beltOf, calledTools, slotForKey } from './belt.ts'
import { ICON_SIZE, sprites } from './icons.ts'
import { Message } from './message.ts'
import { type Model, Replay, RunState, worldFor } from './model.ts'
import {
  EnterDomain,
  RunCapability,
  RunPython,
  WaitBeforeNextEvent,
  initialModel,
  update,
} from './update.ts'

const forgeToDock = { from: 'forge', to: 'dock' }

const realRun = (weather: 'calm' | 'storm') =>
  Effect.runSync(
    runOn(worldFor(weather), 'connect_places', forgeToDock).pipe(
      Effect.provide(Pace.unpaced),
    ),
  )

const completed = (runId: number, weather: 'calm' | 'storm') => {
  const result = realRun(weather)
  return Message.CompletedRunCapability({
    runId,
    record: result.record,
    world: result.world,
  })
}

const workshopSelected: Model = {
  ...initialModel,
  maybeSelected: Option.some('connect_places'),
}

describe('running a capability', () => {
  test('Execute starts one run and the result changes the world', () => {
    story(
      update,
      given(workshopSelected),
      message(Message.ClickedExecute()),
      Command.expectHas(RunCapability),
      model(running => {
        expect(running.run).toEqual(
          RunState.Running({ runId: 1, capability: 'connect_places' }),
        )
      }),
      Command.resolve(RunCapability, completed(1, 'calm')),
      model(done => {
        expect(done.run._tag).toBe('Succeeded')
        expect(done.world.revision).toBe(1)
        expect(done.completedChapters).toContain('program')
      }),
    )
  })

  test('a second Execute while running is ignored', () => {
    story(
      update,
      given(workshopSelected),
      message(Message.ClickedExecute()),
      message(Message.ClickedExecute()),
      model(running => {
        expect(running.nextRunId).toBe(2)
        expect(running.run).toMatchObject({ _tag: 'Running', runId: 1 })
      }),
      Command.resolve(RunCapability, completed(1, 'calm')),
    )
  })

  test('Execute with nothing selected does nothing', () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedExecute()),
      Command.expectNone(),
      model(idle => {
        expect(idle.run).toEqual(RunState.Idle())
      }),
    )
  })

  test('a storm run ends Failed and leaves the world untouched', () => {
    story(
      update,
      given(workshopSelected),
      message(Message.ClickedChapter({ chapter: 'bend' })),
      message(Message.ClickedExecute()),
      Command.resolve(RunCapability, completed(1, 'storm')),
      model(failed => {
        expect(failed.run._tag).toBe('Failed')
        expect(failed.world).toEqual(worldFor('storm'))
        expect(failed.completedChapters).toContain('bend')
      }),
    )
  })
})

describe('reset, cancel and late results', () => {
  test('a result that arrives after Reset cannot change the new world', () => {
    story(
      update,
      given(workshopSelected),
      message(Message.ClickedExecute()),
      message(Message.ClickedReset()),
      message(completed(1, 'calm')),
      model(reset => {
        expect(reset.run).toEqual(RunState.Idle())
        expect(reset.world).toEqual(worldFor('calm'))
      }),
      Command.resolve(
        RunCapability.Interrupt(outcome =>
          Message.CompletedCancelRunCapability({ outcome }),
        ),
        Message.CompletedCancelRunCapability({
          outcome: { _tag: 'Interrupted' },
        }),
      ),
    )
  })

  test('a result from an earlier run cannot finish a newer run', () => {
    story(
      update,
      given(workshopSelected),
      message(Message.ClickedExecute()),
      message(Message.ClickedReset()),
      message(Message.ClickedExecute()),
      message(completed(1, 'calm')),
      model(running => {
        expect(running.run).toMatchObject({ _tag: 'Running', runId: 2 })
        expect(running.world.revision).toBe(0)
      }),
      Command.resolve(
        RunCapability.Interrupt(outcome =>
          Message.CompletedCancelRunCapability({ outcome }),
        ),
        Message.CompletedCancelRunCapability({
          outcome: { _tag: 'Interrupted' },
        }),
      ),
    )
  })

  test('Cancel ends in Cancelled and a late result is ignored', () => {
    story(
      update,
      given(workshopSelected),
      message(Message.ClickedExecute()),
      message(Message.ClickedCancel()),
      message(completed(1, 'calm')),
      model(cancelled => {
        expect(cancelled.run).toEqual(
          RunState.Cancelled({ runId: 1, capability: 'connect_places' }),
        )
        expect(cancelled.world.revision).toBe(0)
      }),
      Command.resolve(
        RunCapability.Interrupt(outcome =>
          Message.CompletedCancelRunCapability({ outcome }),
        ),
        Message.CompletedCancelRunCapability({
          outcome: { _tag: 'Interrupted' },
        }),
      ),
    )
  })
})

describe('replaying the trace', () => {
  const finished: Model = {
    ...workshopSelected,
    run: RunState.Succeeded({ runId: 1, record: realRun('calm').record }),
    world: realRun('calm').world,
    nextRunId: 2,
  }

  test('stepping reveals one event at a time', () => {
    story(
      update,
      given(finished),
      message(Message.ClickedReplayFromStart()),
      message(Message.ClickedStep()),
      message(Message.ClickedStep()),
      model(stepped => {
        expect(stepped.replay).toEqual(Replay.Paused({ cursor: 2 }))
        expect(stepped.completedChapters).toContain('trace')
      }),
    )
  })

  test('play waits, then advances; the last event completes the replay', () => {
    const last = realRun('calm').record.events.length - 1
    story(
      update,
      given({ ...finished, replay: Replay.Paused({ cursor: last - 1 }) }),
      message(Message.ClickedPlay()),
      Command.expectHas(WaitBeforeNextEvent),
      Command.resolve(
        WaitBeforeNextEvent,
        Message.CompletedWaitBeforeNextEvent({ runId: 1, cursor: last - 1 }),
      ),
      model(playing => {
        expect(playing.replay).toEqual(Replay.Playing({ cursor: last }))
      }),
      Command.resolve(
        WaitBeforeNextEvent,
        Message.CompletedWaitBeforeNextEvent({ runId: 1, cursor: last }),
      ),
      model(done => {
        expect(done.replay).toEqual(Replay.Complete())
      }),
    )
  })

  test('a wait that completes after Pause does not move the cursor', () => {
    story(
      update,
      given({ ...finished, replay: Replay.Paused({ cursor: 1 }) }),
      message(Message.CompletedWaitBeforeNextEvent({ runId: 1, cursor: 1 })),
      Command.expectNone(),
      model(paused => {
        expect(paused.replay).toEqual(Replay.Paused({ cursor: 1 }))
      }),
    )
  })

  test('a wait from another run or an older cursor is ignored', () => {
    story(
      update,
      given({ ...finished, replay: Replay.Playing({ cursor: 3 }) }),
      message(Message.CompletedWaitBeforeNextEvent({ runId: 7, cursor: 3 })),
      message(Message.CompletedWaitBeforeNextEvent({ runId: 1, cursor: 0 })),
      Command.expectNone(),
      model(playing => {
        expect(playing.replay).toEqual(Replay.Playing({ cursor: 3 }))
      }),
    )
  })

  test('every handled message lands in the app log', () => {
    story(
      update,
      given(initialModel),
      message(Message.SelectedCapability({ name: 'read_map' })),
      message(Message.SelectedTab({ tab: 'app' })),
      model(logged => {
        expect(logged.appLog.map(entry => entry.tag)).toEqual([
          'SelectedCapability',
          'SelectedTab',
        ])
      }),
    )
  })
})

describe('memory lifecycle', () => {
  const remembered = (runId: number, world = worldFor('calm')) => {
    const result = Effect.runSync(
      runOn(world, 'remember', {
        entity: 'Workshop A',
        observation: 'belongs to Team Blue',
      }).pipe(Effect.provide(Pace.unpaced)),
    )
    return Message.CompletedRunCapability({
      runId,
      record: result.record,
      world: result.world,
    })
  }

  test('client restart clears the conversation but not the file', () => {
    story(
      update,
      given(initialModel),
      message(Message.SelectedStation({ station: 'memory' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      message(Message.ClickedExecute()),
      Command.resolve(RunCapability, remembered(1)),
      model(stored => {
        expect(stored.conversation).toHaveLength(1)
        expect(stored.world.memory.packageCache).toHaveLength(1)
      }),
      message(Message.ClickedRestartClient()),
      message(Message.ClickedRestartServer()),
      model(restarted => {
        expect(restarted.conversation).toEqual([])
        expect(restarted.serverStarts).toBe(2)
        expect(restarted.world.memory.packageCache).toHaveLength(1)
      }),
    )
  })

  test('reinstall wipes the package cache; a path change only hides it', () => {
    story(
      update,
      given(initialModel),
      message(Message.SelectedStation({ station: 'memory' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      message(Message.ClickedExecute()),
      Command.resolve(RunCapability, remembered(1)),
      message(Message.SelectedStoragePath({ storagePath: 'home' })),
      model(moved => {
        expect(moved.world.memory.storagePath).toBe('home')
        expect(moved.world.memory.packageCache).toHaveLength(1)
      }),
      message(Message.ClickedReinstallPackage()),
      model(reinstalled => {
        expect(reinstalled.world.memory.packageCache).toEqual([])
      }),
    )
  })
})

describe('backstage panel', () => {
  test('starts collapsed; a tab or Inspect run opens it; the toggle closes it', () => {
    story(
      update,
      given(initialModel),
      model(start => {
        expect(start.backstage).toBe('collapsed')
      }),
      message(Message.SelectedTab({ tab: 'network' })),
      model(opened => {
        expect(opened.backstage).toBe('open')
      }),
      message(Message.ClickedToggleBackstage()),
      model(closed => {
        expect(closed.backstage).toBe('collapsed')
      }),
      message(Message.ClickedInspectRun()),
      model(inspected => {
        expect(inspected.backstage).toBe('open')
        expect(inspected.tab).toBe('engine')
      }),
    )
  })
})

describe('filesystem roots', () => {
  test('sending a root replaces the list; revoking empties it', () => {
    story(
      update,
      given(initialModel),
      message(Message.SelectedStation({ station: 'filesystem' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      message(Message.ClickedSendRoots()),
      model(replaced => {
        expect(replaced.world.files.allowed).toEqual(['/valley/mill'])
      }),
      message(Message.ClickedRevokeRoots()),
      model(revoked => {
        expect(revoked.world.files.allowed).toEqual([])
      }),
    )
  })

  test('changing the build starts from the launch directories again', () => {
    story(
      update,
      given(initialModel),
      message(Message.SelectedStation({ station: 'filesystem' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      message(Message.ClickedSendRoots()),
      message(Message.SelectedFsBuild({ build: 'confine' })),
      model(rebuilt => {
        expect(rebuilt.world.files.build).toBe('confine')
        expect(rebuilt.world.files.allowed).toEqual(['/valley/forge'])
      }),
    )
  })
})

describe('later-station settings', () => {
  test('a bend survives a reset of the valley', () => {
    story(
      update,
      given(initialModel),
      message(Message.SelectedStation({ station: 'delegation' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      message(Message.SelectedSetting({ setting: 'context=none' })),
      message(Message.ClickedReset()),
      model(reset => {
        expect(reset.world.handoff.context).toBe('none')
        expect(reset.world.artifacts).toEqual([])
      }),
    )
  })

  test('dragging the map changes the screen but not what the model was told', () => {
    story(
      update,
      given({
        ...initialModel,
        place: 'dock',
        world: {
          ...initialModel.world,
          app: {
            tools: 'on',
            shown: 'forge',
            view: 'forge',
            modelKnows: 'forge',
          },
        },
      }),
      message(Message.ClickedPanMap()),
      model(panned => {
        expect(panned.world.app).toMatchObject({
          view: 'dock',
          modelKnows: 'forge',
        })
      }),
    )
  })
})

describe('bends reach the engine world', () => {
  test('the robots policy, the weather and the file-server build all change the world', () => {
    story(
      update,
      given(initialModel),
      message(Message.SelectedPolicy({ policy: 'first-hop' })),
      message(Message.SelectedWeather({ weather: 'storm' })),
      message(Message.SelectedFsBuild({ build: 'confine' })),
      model(bent => {
        expect(bent.world.fetchPolicy).toBe('first-hop')
        expect(bent.world.maxSpan).toBe(2)
        expect(bent.world.files.build).toBe('confine')
      }),
    )
  })
})

describe('browsing between stations', () => {
  test('a finished run and the world survive a visit to another station', () => {
    const fact = Effect.runSync(
      runOn(worldFor('calm'), 'remember', {
        entity: 'Workshop A',
        observation: 'belongs to Team Blue',
      }).pipe(Effect.provide(Pace.unpaced)),
    )
    story(
      update,
      given(initialModel),
      message(Message.SelectedStation({ station: 'memory' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      message(Message.ClickedExecute()),
      Command.resolve(
        RunCapability,
        Message.CompletedRunCapability({
          runId: 1,
          record: fact.record,
          world: fact.world,
        }),
      ),
      message(Message.SelectedStation({ station: 'fetch' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      model(away => {
        expect(away.run).toEqual(RunState.Idle())
        expect(away.world.memory.packageCache).toHaveLength(1)
      }),
      message(Message.SelectedStation({ station: 'memory' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      model(back => {
        expect(back.run._tag).toBe('Succeeded')
        expect(back.world.memory.packageCache).toHaveLength(1)
      }),
      message(Message.ClickedReset()),
      model(reset => {
        expect(reset.run).toEqual(RunState.Idle())
        expect(reset.world.memory.packageCache).toEqual([])
      }),
    )
  })

  test('resetting one station leaves the others alone', () => {
    story(
      update,
      given({
        ...initialModel,
        station: 'apps',
        world: {
          ...initialModel.world,
          revision: 4,
          app: {
            tools: 'on',
            shown: 'forge',
            view: 'dock',
            modelKnows: 'forge',
          },
        },
      }),
      message(Message.ClickedReset()),
      model(reset => {
        expect(reset.world.app.view).toBe('')
        expect(reset.world.revision).toBe(4)
      }),
    )
  })

  test('clicking a place on the open map moves the screen only', () => {
    story(
      update,
      given({
        ...initialModel,
        station: 'apps',
        world: {
          ...initialModel.world,
          app: {
            tools: 'on',
            shown: 'forge',
            view: 'forge',
            modelKnows: 'forge',
          },
        },
      }),
      message(Message.ClickedMapPlace({ place: 'dock' })),
      model(moved => {
        expect(moved.world.app).toMatchObject({
          shown: 'forge',
          view: 'dock',
          modelKnows: 'forge',
        })
      }),
    )
  })
})

describe('the live session', () => {
  const tools = [
    { name: 'remember', title: 'Remember', description: '', readOnly: false },
  ]

  test('entering a station asks the server and adopts its tool list', () => {
    story(
      update,
      given(initialModel),
      message(Message.SelectedStation({ station: 'memory' })),
      Command.resolve(
        EnterDomain,
        Message.CompletedEnterDomain({
          station: 'memory',
          tools,
          frames: [
            { direction: 'client → server', label: 'tools/list', json: '{}' },
          ],
        }),
      ),
      model(entered => {
        expect(entered.connection).toBe('connected')
        expect(entered.tools).toEqual(tools)
        expect(entered.frames).toHaveLength(1)
      }),
    )
  })

  test('a tool list that arrives for a station you already left is ignored', () => {
    story(
      update,
      given({ ...initialModel, station: 'fetch' }),
      message(
        Message.CompletedEnterDomain({ station: 'memory', tools, frames: [] }),
      ),
      model(kept => {
        expect(kept.tools).toEqual([])
      }),
    )
  })

  test('a console preset fills the message with a real tools/call', () => {
    story(
      update,
      given({ ...initialModel, maybeSelected: Option.some('build_path') }),
      message(Message.ClickedConsolePreset({ preset: 'valid' })),
      model(filled => {
        expect(JSON.parse(filled.consoleText)).toMatchObject({
          method: 'tools/call',
          params: {
            name: 'build_path',
            arguments: { from: 'forge', to: 'dock' },
          },
        })
      }),
    )
  })

  test('a console reply that ran a tool updates the world and the run', () => {
    const built = Effect.runSync(
      runOn(worldFor('calm'), 'build_path', {
        from: 'mill',
        to: 'archive',
      }).pipe(Effect.provide(Pace.unpaced)),
    )
    story(
      update,
      given(initialModel),
      message(
        Message.CompletedSendRaw({
          note: 'Sent.',
          frames: [],
          tools: [],
          world: built.world,
          record: built.record,
        }),
      ),
      model(after => {
        expect(after.world.revision).toBe(1)
        expect(after.run._tag).toBe('Succeeded')
        expect(after.consoleNote).toBe('Sent.')
      }),
    )
  })
})

describe('the Python program and the home screen', () => {
  test('running the program marks it running, then keeps what it printed', () => {
    const world = worldFor('calm')
    story(
      update,
      given({ ...initialModel, station: 'code-mode' }),
      message(Message.UpdatedProgram({ value: 'print(1)' })),
      message(Message.ClickedRunPython()),
      model(current => {
        expect(current.python).toBe('running')
        expect(current.program).toBe('print(1)')
      }),
      Command.resolve(
        RunPython,
        Message.CompletedRunPython({
          output: '1',
          error: '',
          world,
          frames: [],
          tools: [],
        }),
      ),
      model(current => {
        expect(current.python).toBe('done')
        expect(current.pythonOutput).toBe('1')
      }),
    )
  })

  test('a runtime that cannot load is reported, not hidden', () => {
    story(
      update,
      given({ ...initialModel, station: 'code-mode' }),
      message(Message.ClickedRunPython()),
      Command.resolve(RunPython, Message.FailedRunPython()),
      model(current => {
        expect(current.python).toBe('unavailable')
      }),
    )
  })

  test('home and a station are two screens over the same state', () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedHome()),
      model(current => {
        expect(current.screen).toBe('home')
      }),
      message(Message.SelectedStation({ station: 'memory' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      model(current => {
        expect(current.screen).toBe('bench')
        expect(current.station).toBe('memory')
      }),
    )
  })

  test('reset clears what Python printed', () => {
    story(
      update,
      given({
        ...initialModel,
        station: 'code-mode',
        python: 'done',
        pythonOutput: 'wrote clay',
        pythonError: 'boom',
      }),
      message(Message.ClickedReset()),
      model(current => {
        expect(current.python).toBe('idle')
        expect(current.pythonOutput).toBe('')
        expect(current.pythonError).toBe('')
      }),
    )
  })
})

describe('the belt selects and never executes', () => {
  test('a number key selects the slot and issues no command', () => {
    story(
      update,
      given({ ...initialModel, station: 'code-mode', screen: 'bench' }),
      message(Message.PressedSlotKey({ slot: 3 })),
      Command.expectNone(),
      model(current => {
        expect(current.maybeSelected).toEqual(Option.some('write_entry'))
        expect(current.run._tag).toBe('Idle')
        expect(current.world.ledger.entries).toEqual([])
      }),
    )
  })

  test('clicking a slot selects a writing tool without running it', () => {
    story(
      update,
      given({ ...initialModel, station: 'memory' }),
      message(Message.SelectedCapability({ name: 'remember' })),
      Command.expectNone(),
      model(current => {
        expect(current.run._tag).toBe('Idle')
        expect(current.world.memory.packageCache).toEqual([])
      }),
    )
  })

  test('a key beyond the belt changes nothing', () => {
    story(
      update,
      given({ ...initialModel, station: 'memory' }),
      message(Message.PressedSlotKey({ slot: 9 })),
      Command.expectNone(),
      model(current => {
        expect(current.maybeSelected).toEqual(initialModel.maybeSelected)
      }),
    )
  })

  test('number keys are ignored while typing or with a modifier', () => {
    expect(
      slotForKey({ key: '3', hasModifier: false, isTyping: true }),
    ).toEqual(Option.none())
    expect(
      slotForKey({ key: '3', hasModifier: true, isTyping: false }),
    ).toEqual(Option.none())
    expect(
      slotForKey({ key: 'a', hasModifier: false, isTyping: false }),
    ).toEqual(Option.none())
    expect(
      slotForKey({ key: '3', hasModifier: false, isTyping: false }),
    ).toEqual(Option.some(3))
  })

  test('the belt says where its contents come from', () => {
    const asked = beltOf({
      ...initialModel,
      station: 'memory',
      connection: 'connected',
      tools: [
        { name: 'recall', title: 'Recall', description: '', readOnly: true },
      ],
    })
    expect(asked.source).toBe('server')
    expect(asked.tools.map(tool => tool.name)).toEqual(['recall'])
    const notAsked = beltOf({ ...initialModel, station: 'memory' })
    expect(notAsked.source).toBe('catalogue')
    expect(notAsked.tools.map(tool => tool.name)).toEqual([
      'remember',
      'recall',
    ])
  })

  test('a called tool is read from the frames, not assumed', () => {
    expect(
      calledTools([
        {
          direction: 'client → server',
          label: 'tools/call',
          json: '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"recall","arguments":{}}}',
        },
        {
          direction: 'client → server',
          label: 'tools/list',
          json: '{"method":"tools/list"}',
        },
      ]),
    ).toEqual(['recall'])
  })

  test('every capability has a sprite of the right size and a family', () => {
    for (const capability of catalogue) {
      const rows = sprites[capability.name]
      expect(rows).toHaveLength(ICON_SIZE)
      expect(rows.every(row => row.length === ICON_SIZE)).toBe(true)
      expect(families.some(family => family.id === capability.family)).toBe(
        true,
      )
    }
    expect(sprites.remember).not.toEqual(sprites.recall)
  })

  test('opening a capability from the atlas enters its specimen with it selected', () => {
    story(
      update,
      given({ ...initialModel, screen: 'home' }),
      message(Message.ClickedOpenSpecimen({ name: 'recall' })),
      Command.resolve(EnterDomain, Message.FailedEnterDomain()),
      model(current => {
        expect(current.screen).toBe('bench')
        expect(current.station).toBe('memory')
        expect(current.maybeSelected).toEqual(Option.some('recall'))
      }),
    )
  })
})
