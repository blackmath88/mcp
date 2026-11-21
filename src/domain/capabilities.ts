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
import { FileRead, filePaths, readFile } from './files.ts'
import {
  Recalled,
  Remembered,
  entities,
  observations,
  recall,
  remember,
} from './memory.ts'
import {
  Clicked,
  SnapshotTaken,
  click,
  controlIds,
  takeSnapshot,
} from './perception.ts'
import {
  type ComponentId,
  EngineEvent,
  Pace,
  Trace,
  WorldStore,
} from './services.ts'
import { PlanMade, planSteps } from './thinking.ts'
import { PlaceId, type World, placeIds } from './world.ts'

// CATALOGUE

export const CapabilityName = Schema.Literals([
  'read_map',
  'find_route',
  'build_path',
  'connect_places',
  'fetch_page',
  'remember',
  'recall',
  'plan_steps',
  'read_file',
  'take_snapshot',
  'click',
])
export type CapabilityName = typeof CapabilityName.Type

export type Affordance = 'readable' | 'queryable' | 'operable' | 'program'

export type Specimen =
  | 'valley'
  | 'fetch'
  | 'memory'
  | 'thinking'
  | 'filesystem'
  | 'perception'

export type Capability = Readonly<{
  name: CapabilityName
  specimen: Specimen
  title: string
  affordance: Affordance
  description: string
  input:
    | 'none'
    | 'endpoints'
    | 'url'
    | 'fact'
    | 'entity'
    | 'thoughts'
    | 'path'
    | 'target'
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
  {
    name: 'remember',
    specimen: 'memory',
    title: 'Remember',
    affordance: 'operable',
    description:
      'Store one observation about an entity in the knowledge graph.',
    input: 'fact',
    observe: 'Nothing beyond a confirmation.',
    request: 'An entity and one statement about it.',
    produces: 'A line in a file.',
    changes: 'The file at the configured storage path grows by one line.',
    finishes: 'Immediately.',
    dependsOn: ['memory-graph', 'disk'],
  },
  {
    name: 'recall',
    specimen: 'memory',
    title: 'Recall',
    affordance: 'queryable',
    description: 'Return everything stored about an entity.',
    input: 'entity',
    observe: 'Every stored statement about one entity, in storage order.',
    request: 'An entity name.',
    produces: 'A list. It may be empty or contradict itself.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['memory-graph', 'disk'],
  },
  {
    name: 'plan_steps',
    specimen: 'thinking',
    title: 'Step planner',
    affordance: 'program',
    description: 'Think step by step about a goal and return an ordered plan.',
    input: 'thoughts',
    observe: 'A numbered plan.',
    request: 'A goal, and optionally your own thoughts so far.',
    produces: 'Steps. Who wrote them depends on the build.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['thinking-tool', 'map', 'expert-model'],
  },
  {
    name: 'read_file',
    specimen: 'filesystem',
    title: 'File reader',
    affordance: 'readable',
    description: 'Read a text file inside the allowed directories.',
    input: 'path',
    observe: 'The content of one file, if its path is allowed right now.',
    request: 'A path.',
    produces: 'Text.',
    changes: 'Nothing.',
    finishes: 'Immediately.',
    dependsOn: ['file-server', 'boundary', 'synthetic-files'],
  },
  {
    name: 'take_snapshot',
    specimen: 'perception',
    title: 'Page snapshot',
    affordance: 'readable',
    description:
      'Capture the accessibility snapshot of the page: every control that has a role and a name.',
    input: 'none',
    observe:
      'The controls the accessibility tree exposes, each with a reference.',
    request: 'Nothing.',
    produces: 'A list of references, valid until the page changes.',
    changes: 'Nothing on the page.',
    finishes: 'Immediately.',
    dependsOn: ['browser-tool', 'accessibility-tree'],
  },
  {
    name: 'click',
    specimen: 'perception',
    title: 'Click',
    affordance: 'operable',
    description: 'Click one control on the page.',
    input: 'target',
    observe: 'Nothing beyond a confirmation.',
    request: 'Which control to click.',
    produces: 'A confirmation of how it clicked.',
    changes: 'The page. Every click re-renders it.',
    finishes: 'Immediately, or not at all.',
    dependsOn: ['browser-tool', 'accessibility-tree', 'synthetic-page'],
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

const factJsonSchema = {
  type: 'object',
  properties: {
    entity: { type: 'string', enum: entities },
    observation: { type: 'string', enum: observations },
  },
  required: ['entity', 'observation'],
  additionalProperties: false,
} as const

const entityJsonSchema = {
  type: 'object',
  properties: { entity: { type: 'string', enum: entities } },
  required: ['entity'],
  additionalProperties: false,
} as const

const thoughtsJsonSchema = {
  type: 'object',
  properties: {
    from: { type: 'string', enum: placeIds },
    to: { type: 'string', enum: placeIds },
    thoughts: { type: 'array', items: { type: 'string' } },
  },
  required: ['from', 'to'],
  additionalProperties: false,
} as const

const pathJsonSchema = {
  type: 'object',
  properties: { path: { type: 'string', enum: filePaths } },
  required: ['path'],
  additionalProperties: false,
} as const

const targetJsonSchema = {
  type: 'object',
  properties: { target: { type: 'string', enum: controlIds } },
  required: ['target'],
  additionalProperties: false,
} as const

export const inputJsonSchema = (capability: Capability) =>
  capability.input === 'path'
    ? pathJsonSchema
    : capability.input === 'target'
      ? targetJsonSchema
      : capability.input === 'fact'
        ? factJsonSchema
        : capability.input === 'entity'
          ? entityJsonSchema
          : capability.input === 'thoughts'
            ? thoughtsJsonSchema
            : capability.input === 'endpoints'
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
  Remembered,
  Recalled,
  PlanMade,
  FileRead,
  SnapshotTaken,
  Clicked,
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

const invalid = (message: string) => () => new InvalidInput({ message })

const decodeFact = (input: unknown) =>
  Schema.decodeUnknownEffect(
    Schema.Struct({
      entity: Schema.Literals(entities),
      observation: Schema.Literals(observations),
    }),
  )(input).pipe(
    Effect.mapError(
      invalid('expected { entity, observation } from the lab’s fixed lists'),
    ),
  )

const decodeEntity = (input: unknown) =>
  Schema.decodeUnknownEffect(
    Schema.Struct({ entity: Schema.Literals(entities) }),
  )(input).pipe(
    Effect.map(decoded => decoded.entity),
    Effect.mapError(invalid('expected { entity } from the lab’s fixed list')),
  )

const decodeThoughts = (input: unknown) =>
  Schema.decodeUnknownEffect(
    Schema.Struct({ thoughts: Schema.optional(Schema.Array(Schema.String)) }),
  )(input).pipe(
    Effect.map(decoded => decoded.thoughts ?? []),
    Effect.mapError(invalid('thoughts must be a list of strings')),
  )

const decodeField = (field: 'path' | 'target') => (input: unknown) =>
  Schema.decodeUnknownEffect(Schema.Record(Schema.String, Schema.Unknown))(
    input,
  ).pipe(
    Effect.flatMap(decoded =>
      Schema.decodeUnknownEffect(Schema.String)(decoded[field]),
    ),
    Effect.mapError(invalid(`expected { ${field} } with a string`)),
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
    const needsEndpoints =
      capability === 'find_route' ||
      capability === 'build_path' ||
      capability === 'connect_places' ||
      capability === 'plan_steps'
    const endpoints = needsEndpoints
      ? yield* decodeEndpoints(input)
      : { from: 'forge' as const, to: 'forge' as const }
    const url = capability === 'fetch_page' ? yield* decodeUrl(input) : ''
    const fact =
      capability === 'remember'
        ? yield* decodeFact(input)
        : { entity: '', observation: '' }
    const entity = capability === 'recall' ? yield* decodeEntity(input) : ''
    const thoughts =
      capability === 'plan_steps' ? yield* decodeThoughts(input) : []
    const path =
      capability === 'read_file' ? yield* decodeField('path')(input) : ''
    const target =
      capability === 'click' ? yield* decodeField('target')(input) : ''
    return { capability, endpoints, url, fact, entity, thoughts, path, target }
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
  const { capability, endpoints, url, fact, entity, thoughts, path, target } =
    yield* resolve(name, input)
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
    Match.when('remember', () =>
      remember('catalogue', fact.entity, fact.observation),
    ),
    Match.when('recall', () => recall('catalogue', entity)),
    Match.when('read_file', () => readFile('catalogue', path)),
    Match.when('take_snapshot', () => takeSnapshot('catalogue')),
    Match.when('click', () => click('catalogue', target)),
    Match.when('plan_steps', () => planSteps('catalogue', from, to, thoughts)),
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
