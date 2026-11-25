import { Array, Effect, Option, Schema } from 'effect'

import { type ComponentId, Trace, WorldStore } from './services.ts'
import { type PlaceId, type ThinkingMode, shortestRoute } from './world.ts'

// NOTE: Three proposed lab implementations behind one tool name. None of them
// is the reference Sequential Thinking server. The "expert model" is a scripted
// stand-in: no inference runs anywhere.

export const callerThoughts: ReadonlyArray<string> = [
  'Look at the map.',
  'The Archive is in the middle, so go through the Archive.',
  'Arrive.',
]

const STAND_IN_ANSWER: ReadonlyArray<string> = [
  'Take the river road from the start.',
  'Cross at the Archive bridge.',
  'Follow the quay to the destination.',
]

export const PlanMade = Schema.TaggedStruct('PlanMade', {
  goal: Schema.String,
  steps: Schema.Array(Schema.String),
  madeBy: Schema.String,
  checkedAgainstMap: Schema.Boolean,
})
export type PlanMade = typeof PlanMade.Type

export const modeLabel: Record<ThinkingMode, string> = {
  record: 'records the caller’s thoughts',
  compute: 'computes a plan from the map',
  consult: 'consults another model (scripted stand-in)',
}

export const planSteps = (
  calledBy: ComponentId,
  from: PlaceId,
  to: PlaceId,
  thoughts: ReadonlyArray<string>,
) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const world = yield* store.read
    const goal = `get from ${from} to ${to}`
    const step = {
      component: 'thinking-tool',
      calledBy,
      operation: `plan: ${goal}`,
    } as const
    yield* trace.emit({
      ...step,
      kind: 'started',
      detail: `this build ${modeLabel[world.thinkingMode]}`,
    })

    if (world.thinkingMode === 'record') {
      yield* Effect.forEach(thoughts, (thought, index) =>
        trace.emit({
          component: 'thinking-tool',
          calledBy: 'thinking-tool',
          kind: 'succeeded',
          operation: `store thought ${index + 1} of ${thoughts.length}`,
          detail: `"${thought}" came from the caller`,
        }),
      )
      yield* trace.emit({
        ...step,
        kind: 'succeeded',
        detail:
          'returned the caller’s own thoughts, numbered. The server reasoned about nothing.',
      })
      return PlanMade.make({
        goal,
        steps: thoughts,
        madeBy: 'the caller',
        checkedAgainstMap: false,
      })
    }

    if (world.thinkingMode === 'compute') {
      const maybeRoute = shortestRoute(world, from, to)
      yield* trace.emit({
        component: 'map',
        calledBy: 'thinking-tool',
        kind: 'succeeded',
        operation: `look for route ${from} → ${to}`,
        detail: Option.match(maybeRoute, {
          onNone: () => 'none exists on the current map',
          onSome: route => route.join(' → '),
        }),
      })
      const steps = Option.match(maybeRoute, {
        onNone: () => [
          `There is no route from ${from} to ${to} on the current map.`,
          'A path has to be built first.',
        ],
        onSome: route =>
          Array.map(
            Array.zip(route, route.slice(1)),
            ([a, b]) => `Walk ${a} → ${b}.`,
          ),
      })
      yield* trace.emit({
        ...step,
        kind: 'succeeded',
        detail: `${steps.length} step(s) derived from the map by a fixed algorithm`,
      })
      return PlanMade.make({
        goal,
        steps,
        madeBy: 'a deterministic algorithm',
        checkedAgainstMap: true,
      })
    }

    yield* trace.emit({
      component: 'expert-model',
      calledBy: 'thinking-tool',
      kind: 'started',
      operation: 'consult',
      detail: `sent only the goal: "${goal}". The map was not sent.`,
    })
    yield* trace.emit({
      component: 'expert-model',
      calledBy: 'thinking-tool',
      kind: 'succeeded',
      operation: 'consult',
      detail: 'scripted stand-in replied with a fixed text. No inference ran.',
    })
    yield* trace.emit({
      ...step,
      kind: 'succeeded',
      detail: 'passed the reply on unchanged. Nobody compared it with the map.',
    })
    return PlanMade.make({
      goal,
      steps: STAND_IN_ANSWER,
      madeBy: 'another model (scripted stand-in)',
      checkedAgainstMap: false,
    })
  })
