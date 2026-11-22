import { Array, Effect, Option, Order, Schema, pipe } from 'effect'

import {
  type DomainError,
  NoRoute,
  PathExists,
  PathTooLong,
  SamePlace,
  describeError,
} from './errors.ts'
import { type ComponentId, Pace, Trace, WorldStore } from './services.ts'
import {
  Artifact,
  Path,
  Place,
  PlaceId,
  type World,
  findPlace,
  joins,
  reachableFrom,
  routeSpan,
  shortestRoute,
  spanBetween,
} from './world.ts'

// OUTPUT

export const Route = Schema.Struct({
  places: Schema.Array(PlaceId),
  span: Schema.Number,
})
export type Route = typeof Route.Type

export const MapRead = Schema.TaggedStruct('MapRead', {
  revision: Schema.Number,
  maxSpan: Schema.Number,
  places: Schema.Array(Place),
  paths: Schema.Array(Path),
})
export type MapRead = typeof MapRead.Type

export const RouteFound = Schema.TaggedStruct('RouteFound', { route: Route })
export type RouteFound = typeof RouteFound.Type

export const PathBuilt = Schema.TaggedStruct('PathBuilt', {
  path: Path,
  revision: Schema.Number,
  artifact: Artifact,
})
export type PathBuilt = typeof PathBuilt.Type

export const PlacesConnected = Schema.TaggedStruct('PlacesConnected', {
  route: Route,
  builtPaths: Schema.Array(Path),
  revision: Schema.Number,
  artifact: Artifact,
})
export type PlacesConnected = typeof PlacesConnected.Type

// TRACING

type Step = Readonly<{
  component: ComponentId
  calledBy: ComponentId
  operation: string
}>

const traced = <A, E extends DomainError, R>(
  step: Step,
  describe: (value: A) => string,
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R | Trace> =>
  Effect.gen(function* () {
    const trace = yield* Trace
    yield* trace.emit({ ...step, kind: 'started', detail: '' })
    return yield* effect.pipe(
      Effect.tap(value =>
        trace.emit({ ...step, kind: 'succeeded', detail: describe(value) }),
      ),
      Effect.tapError(error =>
        trace.emit({ ...step, kind: 'failed', detail: describeError(error) }),
      ),
    )
  })

const readWorld = Effect.fnUntraced(function* (calledBy: ComponentId) {
  const store = yield* WorldStore
  const trace = yield* Trace
  const world = yield* store.read
  yield* trace.emit({
    component: 'world-store',
    calledBy,
    kind: 'succeeded',
    operation: 'read world',
    detail: `revision ${world.revision}`,
  })
  return world
})

const betweenStages = Effect.gen(function* () {
  const pace = yield* Pace
  yield* pace.betweenStages
})

const describeRoute = (route: Route): string =>
  `${route.places.join(' → ')} (span ${route.span})`

const describePath = (path: Path): string =>
  `${path.from}–${path.to} (span ${path.span})`

// MAP

export const readMap = (calledBy: ComponentId) =>
  traced(
    { component: 'map', calledBy, operation: 'read map' },
    map =>
      `${map.places.length} places, ${map.paths.length} paths, revision ${map.revision}`,
    Effect.gen(function* () {
      const world = yield* readWorld('map')
      return MapRead.make({
        revision: world.revision,
        maxSpan: world.maxSpan,
        places: world.places,
        paths: world.paths,
      })
    }),
  )

const routeIn = (
  world: World,
  from: PlaceId,
  to: PlaceId,
): Option.Option<Route> =>
  Option.map(shortestRoute(world, from, to), places => ({
    places,
    span: routeSpan(world, places),
  }))

export const findRoute = (calledBy: ComponentId, from: PlaceId, to: PlaceId) =>
  traced(
    { component: 'map', calledBy, operation: `find route ${from} → ${to}` },
    describeRoute,
    Effect.gen(function* () {
      if (from === to) {
        return yield* new SamePlace({ place: from })
      }
      const world = yield* readWorld('map')
      return yield* Option.match(routeIn(world, from, to), {
        onNone: () => Effect.fail(new NoRoute({ from, to })),
        onSome: route => Effect.succeed(route),
      })
    }),
  )

const lookForRoute = (calledBy: ComponentId, from: PlaceId, to: PlaceId) =>
  traced(
    { component: 'map', calledBy, operation: `look for route ${from} → ${to}` },
    Option.match({
      onNone: () => 'none yet',
      onSome: describeRoute,
    }),
    Effect.gen(function* () {
      const world = yield* readWorld('map')
      return routeIn(world, from, to)
    }),
  )

// VALIDATOR

const validatePath = (calledBy: ComponentId, from: PlaceId, to: PlaceId) =>
  traced(
    { component: 'validator', calledBy, operation: `check path ${from}–${to}` },
    span => `span ${span} is within the limit`,
    Effect.gen(function* () {
      if (from === to) {
        return yield* new SamePlace({ place: from })
      }
      const world = yield* readWorld('validator')
      if (world.paths.some(path => joins(path, from, to))) {
        return yield* new PathExists({ from, to })
      }
      const span = pipe(
        Option.all([findPlace(world, from), findPlace(world, to)]),
        Option.match({
          onNone: () => 0,
          onSome: ([fromPlace, toPlace]) => spanBetween(fromPlace, toPlace),
        }),
      )
      if (span > world.maxSpan) {
        return yield* new PathTooLong({
          from,
          to,
          span,
          maxSpan: world.maxSpan,
        })
      }
      return span
    }),
  )

// STORES

export const produceArtifact = Effect.fnUntraced(function* (
  calledBy: ComponentId,
  kind: Artifact['kind'],
  summary: string,
) {
  const store = yield* WorldStore
  const trace = yield* Trace
  const world = yield* store.read
  const artifact: Artifact = {
    id: `${kind}-${world.artifacts.length + 1}`,
    kind,
    revision: world.revision,
    summary,
  }
  yield* store.commit({ ...world, artifacts: [...world.artifacts, artifact] })
  yield* trace.emit({
    component: 'artifact-store',
    calledBy,
    kind: 'artifact-produced',
    operation: `store ${kind}`,
    detail: `${artifact.id}: ${summary}`,
  })
  return artifact
})

const commitPath = Effect.fnUntraced(function* (
  calledBy: ComponentId,
  from: PlaceId,
  to: PlaceId,
  span: number,
) {
  const store = yield* WorldStore
  const trace = yield* Trace
  const world = yield* store.read
  const revision = world.revision + 1
  const path: Path = { from, to, span, builtInRevision: revision }
  yield* store.commit({ ...world, revision, paths: [...world.paths, path] })
  yield* trace.emit({
    component: 'world-store',
    calledBy,
    kind: 'state-changed',
    operation: 'commit path',
    detail: `revision ${world.revision} → ${revision}: added ${describePath(path)}`,
  })
  const artifact = yield* produceArtifact(
    calledBy,
    'path',
    `Path ${describePath(path)}, built in revision ${revision}`,
  )
  return PathBuilt.make({ path, revision, artifact })
})

export const buildPath = (calledBy: ComponentId, from: PlaceId, to: PlaceId) =>
  traced(
    { component: 'map', calledBy, operation: `build path ${from}–${to}` },
    built => `built ${describePath(built.path)}`,
    Effect.gen(function* () {
      yield* betweenStages
      const span = yield* validatePath('map', from, to)
      yield* betweenStages
      return yield* commitPath('map', from, to, span)
    }),
  )

// PLANNER

type Link = Readonly<{ from: PlaceId; to: PlaceId; span: number }>

const shortestLink = (
  world: World,
  from: PlaceId,
  to: PlaceId,
): Option.Option<Link> =>
  pipe(
    reachableFrom(world, from),
    Array.flatMap(near =>
      Array.map(reachableFrom(world, to), far => ({ near, far })),
    ),
    Array.flatMap(({ near, far }) =>
      pipe(
        Option.all([findPlace(world, near), findPlace(world, far)]),
        Option.match({
          onNone: () => [],
          onSome: ([nearPlace, farPlace]) => [
            { from: near, to: far, span: spanBetween(nearPlace, farPlace) },
          ],
        }),
      ),
    ),
    Array.sort(Order.mapInput(Order.Number, (link: Link) => link.span)),
    Array.head,
  )

export const connectPlaces = (
  calledBy: ComponentId,
  from: PlaceId,
  to: PlaceId,
) =>
  traced(
    { component: 'planner', calledBy, operation: `connect ${from} → ${to}` },
    connected => `${connected.artifact.id}: ${connected.artifact.summary}`,
    Effect.gen(function* () {
      const trace = yield* Trace
      if (from === to) {
        return yield* new SamePlace({ place: from })
      }

      yield* betweenStages
      const map = yield* readMap('planner')
      const maybeExisting = yield* lookForRoute('planner', from, to)
      if (Option.isSome(maybeExisting)) {
        const artifact = yield* produceArtifact(
          'planner',
          'connection-report',
          `Already connected: ${describeRoute(maybeExisting.value)}. Nothing built.`,
        )
        return PlacesConnected.make({
          route: maybeExisting.value,
          builtPaths: [],
          revision: map.revision,
          artifact,
        })
      }

      yield* betweenStages
      const store = yield* WorldStore
      const world = yield* store.read
      const maybeLink = shortestLink(world, from, to)
      if (Option.isNone(maybeLink)) {
        return yield* new NoRoute({ from, to })
      }
      const link = maybeLink.value
      yield* trace.emit({
        component: 'planner',
        calledBy: 'planner',
        kind: 'succeeded',
        operation: 'plan',
        detail: `shortest missing link is ${link.from}–${link.to} (span ${link.span}). The planner proposes; it does not check the limit.`,
      })

      yield* betweenStages
      const span = yield* validatePath('planner', link.from, link.to)

      yield* betweenStages
      const built = yield* commitPath('planner', link.from, link.to, span)
      const route = yield* findRoute('planner', from, to)
      const artifact = yield* produceArtifact(
        'planner',
        'connection-report',
        `Connected ${describeRoute(route)} by building ${describePath(built.path)}`,
      )
      return PlacesConnected.make({
        route,
        builtPaths: [built.path],
        revision: built.revision,
        artifact,
      })
    }),
  )
