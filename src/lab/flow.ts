import { Array, pipe } from 'effect'

import type { RunRecord } from '../domain/capabilities.ts'
import type { ComponentId, EngineEvent } from '../domain/services.ts'

// The path one call took through the server, read from its engine events.
// Each stop is a component in the order it was first reached. Nothing here
// is authored: if the engine did not report it, it is not on the path.

export type Stop = Readonly<{
  component: ComponentId
  reached: boolean
  isCurrent: boolean
  changed: boolean
  failed: boolean
}>

const PLUMBING: ReadonlyArray<ComponentId> = ['adapter', 'catalogue']

export const flowOf = (
  record: RunRecord,
  shown: ReadonlyArray<EngineEvent>,
): ReadonlyArray<Stop> => {
  const order = pipe(
    record.events,
    Array.map(event => event.component),
    Array.filter(component => !PLUMBING.includes(component)),
    Array.dedupe,
  )
  const last = shown.at(-1)
  return Array.map(order, component => {
    const mine = shown.filter(event => event.component === component)
    return {
      component,
      reached: mine.length > 0,
      isCurrent: last !== undefined && last.component === component,
      changed: mine.some(
        event =>
          event.kind === 'state-changed' || event.kind === 'artifact-produced',
      ),
      failed: mine.some(event => event.kind === 'failed'),
    }
  })
}
