import critterData from '../../../specimens/critters.json'
import library from '../../../specimens/library.json'
import { type SpriteId, isSpriteId } from './sprites.ts'

// THE MENAGERIE CATALOGUE
//
// Pure: joins each critter to the library entry it stands for. A critter
// either points at an existing entry (station + kind) or carries its own,
// for servers the library's four-per-station structure has no room for.
// The fact a critter opens is always that entry's own `what`.

type Evidence = Readonly<{ kind: string; note: string }>

export type Critter = Readonly<{
  id: string
  name: string
  sprite: SpriteId
  says: string
  ambient: ReadonlyArray<string>
  weird: number
  breaks: number
  station: string
  kind: string
  server: string
  by: string
  url: string
  what: string
  evidence: Evidence
}>

type RawEntry = Readonly<{
  station: string
  kind: string
  name: string
  by: string
  url: string
  what: string
  evidence: Evidence
}>

type RawCritter = Readonly<{
  id: string
  name: string
  sprite: string
  says: string
  ambient: ReadonlyArray<string>
  weird: number
  breaks: number
  library?: Readonly<{ station: string; kind: string }>
  entry?: RawEntry
}>

const libraryEntries: ReadonlyArray<RawEntry> = library.entries

export const resolveEntry = (
  raw: RawCritter,
  entries: ReadonlyArray<RawEntry>,
): RawEntry | undefined =>
  raw.entry ??
  (raw.library === undefined
    ? undefined
    : entries.find(
        entry =>
          entry.station === raw.library?.station &&
          entry.kind === raw.library.kind,
      ))

const toCritter = (raw: RawCritter): Critter | undefined => {
  const entry = resolveEntry(raw, libraryEntries)
  if (entry === undefined || !isSpriteId(raw.sprite)) return undefined
  return {
    id: raw.id,
    name: raw.name,
    sprite: raw.sprite,
    says: raw.says,
    ambient: raw.ambient,
    weird: raw.weird,
    breaks: raw.breaks,
    station: entry.station,
    kind: entry.kind,
    server: entry.name,
    by: entry.by,
    url: entry.url,
    what: entry.what,
    evidence: entry.evidence,
  }
}

export const rawCritters: ReadonlyArray<RawCritter> = critterData.critters

export const critters: ReadonlyArray<Critter> = rawCritters.flatMap(raw => {
  const critter = toCritter(raw)
  return critter === undefined ? [] : [critter]
})

// The DOM id of one example card, shared by the cards, the tiles at the top
// of a step and the strip in a critter's card.
export const exampleId = (
  station: string,
  kind: string,
  name: string,
): string =>
  `ex-${station}-${kind}-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`

// The critter standing for one library card, if any.
export const critterForEntry = (
  station: string,
  kind: string,
  name: string,
): Critter | undefined =>
  critters.find(
    critter =>
      critter.station === station &&
      critter.kind === kind &&
      critter.server === name,
  )

export const crittersForStation = (station: string): ReadonlyArray<Critter> =>
  critters.filter(critter => critter.station === station)

// Critters with their own entry are not in library.json; the library page
// shows them under their station as extra cards.
export const ownEntryCritters: ReadonlyArray<Critter> = critters.filter(
  critter =>
    rawCritters.some(raw => raw.id === critter.id && raw.entry !== undefined),
)

// Colour per critter for the mosaic and the giant duotone art. Pale tints
// only; the walking sprites keep their own palettes.
export type Hue = Readonly<{
  tint: string
  step: string
  dark: string
  mid: string
  light: string
  pop: string
}>

export const hues: Readonly<Record<SpriteId, Hue>> = {
  trippy: {
    tint: '#ffe0ef',
    step: '#ffc2df',
    dark: '#6e0f3f',
    mid: '#e2408f',
    light: '#ffd6ea',
    pop: 'y',
  },
  soul: {
    tint: '#dde8ff',
    step: '#c1d5ff',
    dark: '#12306e',
    mid: '#3d6fe0',
    light: '#e6eeff',
    pop: 'y',
  },
  frank: {
    tint: '#d6f5e3',
    step: '#b3ebcb',
    dark: '#0b4f2c',
    mid: '#26a862',
    light: '#e2f8ec',
    pop: 'w',
  },
  moody: {
    tint: '#ffe1ea',
    step: '#ffc5d6',
    dark: '#741b3d',
    mid: '#e4577f',
    light: '#ffe7ef',
    pop: 'w',
  },
  gopher: {
    tint: '#e9e3f7',
    step: '#d8cdf2',
    dark: '#4e2a0d',
    mid: '#b8742f',
    light: '#fff1dc',
    pop: 'w',
  },
  scope: {
    tint: '#dff1f7',
    step: '#c3e5f0',
    dark: '#1d2438',
    mid: '#5b6a8a',
    light: '#eef2f8',
    pop: 'y',
  },
  nobody: {
    tint: '#eef0f4',
    step: '#e1e4ec',
    dark: '#7d8396',
    mid: '#9aa0b4',
    light: '#ffffff',
    pop: 'k',
  },
  coat: {
    tint: '#ece6f6',
    step: '#ddd2ef',
    dark: '#2c1a0b',
    mid: '#8e5f31',
    light: '#f8ecda',
    pop: 'e',
  },
}

// Weighted pick among perches: weird things pull three times as hard and
// perches in view six times. `roll` is in [0, 1).
export const pickWeighted = <T>(
  items: ReadonlyArray<T>,
  weight: (item: T) => number,
  roll: number,
): T | undefined => {
  const weights = items.map(weight)
  const total = weights.reduce((sum, value) => sum + value, 0)
  if (items.length === 0 || total <= 0) return undefined
  let left = roll * total
  for (let index = 0; index < items.length; index++) {
    left -= weights[index] ?? 0
    if (left < 0) return items[index]
  }
  return items[items.length - 1]
}

// Keep a box of `width` inside the page: never wider than the viewport
// minus a gutter, never pushing the page sideways.
export const clampX = (
  x: number,
  width: number,
  viewportLeft: number,
  viewportWidth: number,
  gutter: number,
): number =>
  Math.max(
    viewportLeft + gutter,
    Math.min(x, viewportLeft + viewportWidth - width - gutter),
  )
