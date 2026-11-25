import { Array, Option, pipe } from 'effect'

import type { Frame } from '../adapters/in-tab-mcp.ts'
import {
  type Capability,
  type CapabilityName,
  catalogue,
} from '../domain/capabilities.ts'
import type { Model, Station } from './model.ts'

export const BELT_SLOTS = 9

export const findCapability = (name: string): Option.Option<Capability> =>
  Array.findFirst(catalogue, capability => capability.name === name)

// Where the belt's contents come from. 'server' is observed: the server's own
// answer to tools/list in this tab. 'catalogue' is curated: what the lab says
// that server exposes, before anyone asked it.
export type Belt = Readonly<{
  owner: Option.Option<Station>
  source: 'server' | 'catalogue'
  tools: ReadonlyArray<Capability>
}>

const fromCatalogue = (station: Station): ReadonlyArray<Capability> =>
  Array.filter(catalogue, capability => capability.specimen === station)

const advertised = (model: Model): ReadonlyArray<Capability> =>
  Array.flatMap(model.tools, tool =>
    Array.fromOption(findCapability(tool.name)),
  )

export const isAdvertisedNow = (model: Model, name: CapabilityName): boolean =>
  model.connection === 'connected' &&
  model.tools.some(tool => tool.name === name) &&
  Option.exists(
    findCapability(name),
    capability => capability.specimen === model.station,
  )

const ownerOf = (model: Model): Option.Option<Station> =>
  model.screen === 'bench'
    ? Option.some(model.station)
    : pipe(
        model.maybeSelected,
        Option.flatMap(findCapability),
        Option.map(capability => capability.specimen),
      )

export const beltOf = (model: Model): Belt =>
  Option.match(ownerOf(model), {
    onNone: () => ({ owner: Option.none(), source: 'catalogue', tools: [] }),
    onSome: station =>
      station === model.station && model.connection === 'connected'
        ? {
            owner: Option.some(station),
            source: 'server',
            tools: advertised(model),
          }
        : {
            owner: Option.some(station),
            source: 'catalogue',
            tools: fromCatalogue(station),
          },
  })

const CALL = /"method":\s*"tools\/call"[\s\S]*?"name":\s*"([a-z_]+)"/

export const calledToolOf = (frame: Frame): Option.Option<Capability> =>
  frame.direction === 'client → server'
    ? pipe(
        Option.fromNullishOr(CALL.exec(frame.json)),
        Option.flatMap(match => Option.fromNullishOr(match[1])),
        Option.flatMap(findCapability),
      )
    : Option.none()

// Observed: tools that a tools/call frame in this tab named.
export const calledTools = (
  frames: ReadonlyArray<Frame>,
): ReadonlyArray<CapabilityName> =>
  pipe(
    frames,
    Array.flatMap(frame => Array.fromOption(calledToolOf(frame))),
    Array.map(capability => capability.name),
    Array.dedupe,
  )

// Number keys select a belt slot. They must never fire while someone types.
export type KeyPress = Readonly<{
  key: string
  hasModifier: boolean
  isTyping: boolean
}>

export const slotForKey = (press: KeyPress): Option.Option<number> =>
  press.hasModifier || press.isTyping || !/^[1-9]$/.test(press.key)
    ? Option.none()
    : Option.some(Number(press.key))
