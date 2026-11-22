import { Effect } from 'effect'

import { runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import type { World } from '../domain/world.ts'

export const STAGE_PAUSE_MILLISECONDS = 350

export const runInProcess = (world: World, name: string, input: unknown) =>
  runOn(world, name, input).pipe(
    Effect.provide(Pace.slowedBy(STAGE_PAUSE_MILLISECONDS)),
  )
