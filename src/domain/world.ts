import { Array, Option, Schema, pipe } from 'effect'

export const PlaceId = Schema.Literals([
  'forge',
  'mill',
  'archive',
  'kiln',
  'dock',
])
export type PlaceId = typeof PlaceId.Type

export const Place = Schema.Struct({
  id: PlaceId,
  name: Schema.String,
  x: Schema.Number,
  y: Schema.Number,
})
export type Place = typeof Place.Type

export const Path = Schema.Struct({
  from: PlaceId,
  to: PlaceId,
  span: Schema.Number,
  builtInRevision: Schema.Number,
})
export type Path = typeof Path.Type

export const Artifact = Schema.Struct({
  id: Schema.String,
  kind: Schema.Literals(['path', 'connection-report']),
  revision: Schema.Number,
  summary: Schema.String,
})
export type Artifact = typeof Artifact.Type

export const FetchPolicy = Schema.Literals(['every-hop', 'first-hop', 'none'])
export type FetchPolicy = typeof FetchPolicy.Type

export const StoragePath = Schema.Literals(['package-cache', 'home'])
export type StoragePath = typeof StoragePath.Type

export const ThinkingMode = Schema.Literals(['record', 'compute', 'consult'])
export type ThinkingMode = typeof ThinkingMode.Type

export const Fact = Schema.Struct({
  entity: Schema.String,
  observation: Schema.String,
})
export type Fact = typeof Fact.Type

export const Memory = Schema.Struct({
  storagePath: StoragePath,
  packageCache: Schema.Array(Fact),
  home: Schema.Array(Fact),
})
export type Memory = typeof Memory.Type

export const World = Schema.Struct({
  revision: Schema.Number,
  maxSpan: Schema.Number,
  fetchPolicy: FetchPolicy,
  memory: Memory,
  thinkingMode: ThinkingMode,
  places: Schema.Array(Place),
  paths: Schema.Array(Path),
  artifacts: Schema.Array(Artifact),
})
export type World = typeof World.Type

export const CALM_MAX_SPAN = 3
export const STORM_MAX_SPAN = 2

const seedPlaces: ReadonlyArray<Place> = [
  { id: 'forge', name: 'Forge', x: 1, y: 3 },
  { id: 'mill', name: 'Mill', x: 3, y: 3 },
  { id: 'archive', name: 'Archive', x: 3, y: 1 },
  { id: 'kiln', name: 'Kiln', x: 5, y: 2 },
  { id: 'dock', name: 'Dock', x: 7, y: 3 },
]

export const placeIds: ReadonlyArray<PlaceId> = seedPlaces.map(
  place => place.id,
)

const roundSpan = (value: number): number => Math.round(value * 10) / 10

export const spanBetween = (from: Place, to: Place): number =>
  roundSpan(Math.hypot(from.x - to.x, from.y - to.y))

export const findPlace = (world: World, id: PlaceId): Option.Option<Place> =>
  Array.findFirst(world.places, place => place.id === id)

const seedPath = (from: PlaceId, to: PlaceId): Path => {
  const fromPlace = seedPlaces.find(place => place.id === from)
  const toPlace = seedPlaces.find(place => place.id === to)
  return {
    from,
    to,
    span:
      fromPlace === undefined || toPlace === undefined
        ? 0
        : spanBetween(fromPlace, toPlace),
    builtInRevision: 0,
  }
}

export const seedWorld = (
  maxSpan: number,
  fetchPolicy: FetchPolicy = 'every-hop',
  storagePath: StoragePath = 'package-cache',
  thinkingMode: ThinkingMode = 'record',
): World => ({
  revision: 0,
  maxSpan,
  fetchPolicy,
  memory: { storagePath, packageCache: [], home: [] },
  thinkingMode,
  places: seedPlaces,
  paths: [seedPath('forge', 'mill'), seedPath('kiln', 'dock')],
  artifacts: [],
})

export const joins = (path: Path, a: PlaceId, b: PlaceId): boolean =>
  (path.from === a && path.to === b) || (path.from === b && path.to === a)

const neighbours = (world: World, id: PlaceId): ReadonlyArray<PlaceId> =>
  pipe(
    world.paths,
    Array.flatMap(path =>
      path.from === id ? [path.to] : path.to === id ? [path.from] : [],
    ),
  )

export const reachableFrom = (
  world: World,
  start: PlaceId,
): ReadonlyArray<PlaceId> => {
  const visit = (
    frontier: ReadonlyArray<PlaceId>,
    seen: ReadonlyArray<PlaceId>,
  ): ReadonlyArray<PlaceId> => {
    const next = pipe(
      frontier,
      Array.flatMap(id => neighbours(world, id)),
      Array.dedupe,
      Array.filter(id => !seen.includes(id)),
    )
    return Array.isArrayEmpty(next) ? seen : visit(next, [...seen, ...next])
  }
  return visit([start], [start])
}

export const shortestRoute = (
  world: World,
  from: PlaceId,
  to: PlaceId,
): Option.Option<ReadonlyArray<PlaceId>> => {
  const expand = (
    routes: ReadonlyArray<ReadonlyArray<PlaceId>>,
    seen: ReadonlyArray<PlaceId>,
  ): Option.Option<ReadonlyArray<PlaceId>> => {
    const arrived = routes.find(route => route[route.length - 1] === to)
    if (arrived !== undefined) {
      return Option.some(arrived)
    }
    const next = pipe(
      routes,
      Array.flatMap(route => {
        const last = route[route.length - 1]
        return last === undefined
          ? []
          : pipe(
              neighbours(world, last),
              Array.filter(id => !seen.includes(id)),
              Array.map(id => [...route, id]),
            )
      }),
    )
    return Array.isArrayEmpty(next)
      ? Option.none()
      : expand(next, [
          ...seen,
          ...Array.flatMap(next, route => route.slice(-1)),
        ])
  }
  return expand([[from]], [from])
}

export const routeSpan = (
  world: World,
  route: ReadonlyArray<PlaceId>,
): number =>
  roundSpan(
    pipe(
      Array.zip(route, route.slice(1)),
      Array.map(([a, b]) =>
        pipe(
          world.paths,
          Array.findFirst(path => joins(path, a, b)),
          Option.match({ onNone: () => 0, onSome: path => path.span }),
        ),
      ),
      Array.reduce(0, (total, span) => total + span),
    ),
  )

export const factsAt = (memory: Memory): ReadonlyArray<Fact> =>
  memory.storagePath === 'home' ? memory.home : memory.packageCache

export const reinstallPackage = (world: World): World => ({
  ...world,
  memory: { ...world.memory, packageCache: [] },
})

export const useStoragePath = (
  world: World,
  storagePath: StoragePath,
): World => ({
  ...world,
  memory: { ...world.memory, storagePath },
})

export const useThinkingMode = (
  world: World,
  thinkingMode: ThinkingMode,
): World => ({ ...world, thinkingMode })
