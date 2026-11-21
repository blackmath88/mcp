import { Context, Effect, Layer, Ref, Schema } from 'effect'

import type { World } from './world.ts'

export const ComponentId = Schema.Literals([
  'adapter',
  'catalogue',
  'map',
  'planner',
  'validator',
  'world-store',
  'artifact-store',
  'fetcher',
  'robots-policy',
  'synthetic-web',
  'memory-graph',
  'disk',
  'thinking-tool',
  'expert-model',
  'file-server',
  'boundary',
  'synthetic-files',
  'browser-tool',
  'accessibility-tree',
  'synthetic-page',
])
export type ComponentId = typeof ComponentId.Type

export const EngineEvent = Schema.Struct({
  seq: Schema.Number,
  component: ComponentId,
  calledBy: ComponentId,
  kind: Schema.Literals([
    'started',
    'succeeded',
    'failed',
    'state-changed',
    'artifact-produced',
  ]),
  operation: Schema.String,
  detail: Schema.String,
})
export type EngineEvent = typeof EngineEvent.Type

export type EmittedEvent = Omit<EngineEvent, 'seq'>

export class Trace extends Context.Service<
  Trace,
  {
    readonly emit: (event: EmittedEvent) => Effect.Effect<void>
    readonly events: Effect.Effect<ReadonlyArray<EngineEvent>>
  }
>()('mcp-lab/domain/Trace') {
  static readonly layer = Layer.effect(
    Trace,
    Effect.gen(function* () {
      const collected = yield* Ref.make<ReadonlyArray<EngineEvent>>([])
      return Trace.of({
        emit: event =>
          Ref.update(collected, events => [
            ...events,
            { ...event, seq: events.length + 1 },
          ]),
        events: Ref.get(collected),
      })
    }),
  )
}

export class WorldStore extends Context.Service<
  WorldStore,
  {
    readonly read: Effect.Effect<World>
    readonly commit: (world: World) => Effect.Effect<void>
  }
>()('mcp-lab/domain/WorldStore') {
  static readonly inMemory = (initial: World) =>
    Layer.effect(
      WorldStore,
      Effect.gen(function* () {
        const held = yield* Ref.make(initial)
        return WorldStore.of({
          read: Ref.get(held),
          commit: world => Ref.set(held, world),
        })
      }),
    )
}

export class Pace extends Context.Service<
  Pace,
  { readonly betweenStages: Effect.Effect<void> }
>()('mcp-lab/domain/Pace') {
  static readonly unpaced = Layer.succeed(
    Pace,
    Pace.of({ betweenStages: Effect.void }),
  )
  static readonly slowedBy = (milliseconds: number) =>
    Layer.succeed(
      Pace,
      Pace.of({ betweenStages: Effect.sleep(`${milliseconds} millis`) }),
    )
}
