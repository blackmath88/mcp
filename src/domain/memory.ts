import { Array, Effect, Schema } from 'effect'

import { type ComponentId, Trace, WorldStore } from './services.ts'
import { type Fact, type Memory, factsAt } from './world.ts'

// NOTE: The lab's own simulation of a knowledge-graph memory server. It keeps
// facts in one of two made-up folders; it is not upstream code.

export const entities = ['Workshop A', 'Workshop B'] as const

export const observations = [
  'belongs to Team Blue',
  'belongs to Team Red',
  'contains a renderer',
] as const

export const pathLabel: Record<Memory['storagePath'], string> = {
  'package-cache': '~/.cache/pkg/memory-server/memory.jsonl',
  home: '~/valley/memory.jsonl',
}

export const Remembered = Schema.TaggedStruct('Remembered', {
  entity: Schema.String,
  observation: Schema.String,
  storedAt: Schema.String,
  factsInFile: Schema.Number,
})
export type Remembered = typeof Remembered.Type

export const Recalled = Schema.TaggedStruct('Recalled', {
  entity: Schema.String,
  observations: Schema.Array(Schema.String),
  readFrom: Schema.String,
})
export type Recalled = typeof Recalled.Type

const readFile = Effect.fnUntraced(function* () {
  const store = yield* WorldStore
  const trace = yield* Trace
  const world = yield* store.read
  const facts = factsAt(world.memory)
  yield* trace.emit({
    component: 'disk',
    calledBy: 'memory-graph',
    kind: 'succeeded',
    operation: `read ${pathLabel[world.memory.storagePath]}`,
    detail:
      facts.length === 0 ? 'no file, or empty' : `${facts.length} line(s)`,
  })
  return { world, facts }
})

export const remember = (
  calledBy: ComponentId,
  entity: string,
  observation: string,
) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const step = {
      component: 'memory-graph',
      calledBy,
      operation: `remember "${entity} ${observation}"`,
    } as const
    yield* trace.emit({ ...step, kind: 'started', detail: '' })
    const { world, facts } = yield* readFile()
    const next: ReadonlyArray<Fact> = [...facts, { entity, observation }]
    const memory: Memory =
      world.memory.storagePath === 'home'
        ? { ...world.memory, home: next }
        : { ...world.memory, packageCache: next }
    yield* store.commit({ ...world, memory })
    yield* trace.emit({
      component: 'disk',
      calledBy: 'memory-graph',
      kind: 'state-changed',
      operation: `append to ${pathLabel[memory.storagePath]}`,
      detail: `${next.length} line(s) now. Stored as given; nothing checked whether it is true or contradicts an earlier line.`,
    })
    const remembered = Remembered.make({
      entity,
      observation,
      storedAt: pathLabel[memory.storagePath],
      factsInFile: next.length,
    })
    yield* trace.emit({ ...step, kind: 'succeeded', detail: 'stored' })
    return remembered
  })

export const recall = (calledBy: ComponentId, entity: string) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const step = {
      component: 'memory-graph',
      calledBy,
      operation: `recall "${entity}"`,
    } as const
    yield* trace.emit({ ...step, kind: 'started', detail: '' })
    const { world, facts } = yield* readFile()
    const found = Array.flatMap(facts, fact =>
      fact.entity === entity ? [fact.observation] : [],
    )
    yield* trace.emit({
      ...step,
      kind: 'succeeded',
      detail:
        found.length === 0
          ? 'nothing stored about it at this path'
          : `${found.length} observation(s), returned in the order they were stored`,
    })
    return Recalled.make({
      entity,
      observations: found,
      readFrom: pathLabel[world.memory.storagePath],
    })
  })
