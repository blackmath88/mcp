import { Effect, Option } from 'effect'
import { Command, given, message, model, story } from 'foldkit/story'
import { describe, expect, test } from 'vitest'

import { runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import { Message } from './message.ts'
import { type Model, Replay, RunState, worldFor } from './model.ts'
import {
  RunCapability,
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
  test('collapses, and choosing a tab opens it again', () => {
    story(
      update,
      given(initialModel),
      message(Message.ClickedToggleBackstage()),
      model(collapsed => {
        expect(collapsed.backstage).toBe('collapsed')
      }),
      message(Message.SelectedTab({ tab: 'network' })),
      model(opened => {
        expect(opened.backstage).toBe('open')
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
      message(Message.ClickedSendRoots()),
      message(Message.SelectedFsBuild({ build: 'confine' })),
      model(rebuilt => {
        expect(rebuilt.world.files.build).toBe('confine')
        expect(rebuilt.world.files.allowed).toEqual(['/valley/forge'])
      }),
    )
  })
})
