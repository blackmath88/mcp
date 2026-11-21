import { Effect, Match, Result, Schema } from 'effect'

import {
  MapRead,
  PathBuilt,
  PlacesConnected,
  RouteFound,
  buildPath,
  connectPlaces,
  findRoute,
  readMap,
} from './engine.ts'
import {
  type DomainError,
  InvalidInput,
  UnknownCapability,
  describeError,
} from './errors.ts'
import { PageFetched, fetchPage, siteUrls } from './fetch.ts'
import {
  type ComponentId,
  EngineEvent,
  Pace,
  Trace,
  WorldStore,
} from './services.ts'
import { PlaceId, type World, placeIds } from './world.ts'

// CATALOGUE

export const CapabilityName = Schema.Literals([
  'read_map',
  'find_route',
  'build_path',
  'connect_places',
  'fetch_page',
])
export type CapabilityName = typeof CapabilityName.Type

export type Affordance = 'readable' | 'queryable' | 'operable' | 'program'

export type Specimen = 'valley' | 'fetch'

export type Capability = Readonly<{
  name: CapabilityName
  specimen: Specimen
  title: string
  affordance: Affordance
  description: string
  input: 'none' | 'endpoints' | 'url'
  observe: string
  request: string
  produces: string
  changes: string
  finishes: string
  dependsOn: ReadonlyArray<ComponentId>
}>

export const catalogue: ReadonlyArray<Capability> = [
  {
    name: 'read_map',
    title: 'Map',
    affordance: 'readable',
    description:
      'Read the map of the valley: every place, every path and the span limit.',
    specimen: 'valley',
    input: 'none',
    observe: 'Places, paths, the current revision and the span limit.',
    request: 'Nothing. It takes no input.',
    produces: 'A snapshot of the map.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['map', 'world-store'],
  },
  {
    name: 'find_route',
    title: 'Route finder',
    affordance: 'queryable',
    description:
      'Find the shortest route between two places along existing paths.',
    specimen: 'valley',
    input: 'endpoints',
    observe: 'Whether two places are connected, and how far apart.',
    request: 'A start and an end place.',
    produces: 'A route, or the answer that none exists.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['map', 'world-store'],
  },
  {
    name: 'build_path',
    title: 'Path builder',
    affordance: 'operable',
    description:
      'Build one new path between two places. Refused when the span exceeds the limit or the path exists.',
    specimen: 'valley',
    input: 'endpoints',
    observe: 'Nothing beyond the result.',
    request: 'The two places to join directly.',
    produces: 'A path artifact.',
    changes: 'The map gains a path and its revision goes up by one.',
    finishes: 'Immediately, or not at all.',
    dependsOn: ['map', 'validator', 'world-store', 'artifact-store'],
  },
  {
    name: 'connect_places',
    title: 'Connection workshop',
    affordance: 'program',
    description:
      'Connect two places by any means: inspect the map, plan the shortest missing link, validate it, build it and report.',
    specimen: 'valley',
    input: 'endpoints',
    observe: 'The map, through its own inspection.',
    request: 'A goal: two places that should be connected.',
    produces: 'A connection report, and a path artifact if it built one.',
    changes: 'It may build a path. It decides which one.',
    finishes: 'After four stages, or stops at the first that fails.',
    dependsOn: ['planner', 'map', 'validator', 'world-store', 'artifact-store'],
  },
  {
    name: 'fetch_page',
    specimen: 'fetch',
    title: 'Page fetcher',
    affordance: 'queryable',
    description:
      'Fetch a page of the synthetic site valley.test and return it as Markdown. Follows redirects.',
    input: 'url',
    observe: 'A page of valley.test, as Markdown.',
    request: 'One URL.',
    produces: 'Text. Nothing is stored.',
    changes: 'Nothing in the valley. It does make requests in your name.',
    finishes: 'After at most three redirects.',
    dependsOn: ['fetcher', 'robots-policy', 'synthetic-web'],
  },
]

export const Endpoints = Schema.Struct({ from: PlaceId, to: PlaceId })
export type Endpoints = typeof Endpoints.Type

const emptyInputJsonSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

const endpointsJsonSchema = {
  type: 'object',
  properties: {
    from: { type: 'string', enum: placeIds },
    to: { type: 'string', enum: placeIds },
  },
  required: ['from', 'to'],
  additionalProperties: false,
} as const

const urlJsonSchema = {
  type: 'object',
  properties: { url: { type: 'string', enum: siteUrls } },
  required: ['url'],
  additionalProperties: false,
} as const

export const inputJsonSchema = (capability: Capability) =>
  capability.input === 'endpoints'
    ? endpointsJsonSchema
    : capability.input === 'url'
      ? urlJsonSchema
      : emptyInputJsonSchema

// EXECUTION

export const CapabilityOutput = Schema.Union([
  MapRead,
  RouteFound,
  PathBuilt,
  PlacesConnected,
  PageFetched,
])
export type CapabilityOutput = typeof CapabilityOutput.Type

const decodeName = (name: string) =>
  Schema.decodeUnknownEffect(CapabilityName)(name).pipe(
    Effect.mapError(() => new UnknownCapability({ name })),
  )

const decodeEndpoints = (input: unknown) =>
  Schema.decodeUnknownEffect(Endpoints)(input).pipe(
    Effect.mapError(
      () =>
        new InvalidInput({
          message: `expected { from, to } naming two of: ${placeIds.join(', ')}`,
        }),
    ),
  )

const decodeUrl = (input: unknown) =>
  Schema.decodeUnknownEffect(Schema.Struct({ url: Schema.String }))(input).pipe(
    Effect.map(decoded => decoded.url),
    Effect.mapError(
      () => new InvalidInput({ message: 'expected { url } with a string' }),
    ),
  )

const resolve = Effect.fnUntraced(function* (name: string, input: unknown) {
  const trace = yield* Trace
  const step = {
    component: 'catalogue',
    calledBy: 'adapter',
    operation: `resolve ${name}`,
  } as const
  yield* trace.emit({ ...step, kind: 'started', detail: '' })
  const resolved = yield* Effect.gen(function* () {
    const capability = yield* decodeName(name)
    const endpoints =
      capability === 'read_map' || capability === 'fetch_page'
        ? { from: 'forge' as const, to: 'forge' as const }
        : yield* decodeEndpoints(input)
    const url = capability === 'fetch_page' ? yield* decodeUrl(input) : ''
    return { capability, endpoints, url }
  }).pipe(
    Effect.tapError(error =>
      trace.emit({ ...step, kind: 'failed', detail: describeError(error) }),
    ),
  )
  yield* trace.emit({
    ...step,
    kind: 'succeeded',
    detail: 'input accepted',
  })
  return resolved
})

export const execute = Effect.fnUntraced(function* (
  name: string,
  input: unknown,
): Effect.fn.Return<CapabilityOutput, DomainError, Trace | WorldStore | Pace> {
  const { capability, endpoints, url } = yield* resolve(name, input)
  const { from, to } = endpoints
  return yield* Match.value(capability).pipe(
    Match.when('read_map', () => readMap('catalogue')),
    Match.when('find_route', () =>
      Effect.map(findRoute('catalogue', from, to), route =>
        RouteFound.make({ route }),
      ),
    ),
    Match.when('build_path', () => buildPath('catalogue', from, to)),
    Match.when('connect_places', () => connectPlaces('catalogue', from, to)),
    Match.when('fetch_page', () => fetchPage('catalogue', url)),
    Match.exhaustive,
  )
})

// RUN RECORD

export const RunOutcome = Schema.Union([
  Schema.TaggedStruct('Succeeded', { output: CapabilityOutput }),
  Schema.TaggedStruct('Failed', {
    error: Schema.String,
    message: Schema.String,
  }),
])
export type RunOutcome = typeof RunOutcome.Type

export const RunRecord = Schema.Struct({
  capability: Schema.String,
  inputJson: Schema.String,
  outcome: RunOutcome,
  events: Schema.Array(EngineEvent),
  revisionBefore: Schema.Number,
  revisionAfter: Schema.Number,
})
export type RunRecord = typeof RunRecord.Type

const record = Effect.fnUntraced(function* (name: string, input: unknown) {
  const store = yield* WorldStore
  const trace = yield* Trace
  const before = yield* store.read
  const result = yield* Effect.result(execute(name, input))
  const after = yield* store.read
  const events = yield* trace.events
  const outcome: RunOutcome = Result.match(result, {
    onSuccess: output => ({ _tag: 'Succeeded' as const, output }),
    onFailure: error => ({
      _tag: 'Failed' as const,
      error: error._tag,
      message: describeError(error),
    }),
  })
  return RunRecord.make({
    capability: name,
    inputJson: JSON.stringify(input ?? {}),
    outcome,
    events,
    revisionBefore: before.revision,
    revisionAfter: after.revision,
  })
})

export const run = (name: string, input: unknown) =>
  record(name, input).pipe(Effect.provide(Trace.layer))

export const runOn = (world: World, name: string, input: unknown) =>
  Effect.gen(function* () {
    const runRecord = yield* run(name, input)
    const store = yield* WorldStore
    const nextWorld = yield* store.read
    return { record: runRecord, world: nextWorld }
  }).pipe(Effect.provide(WorldStore.inMemory(world)))
