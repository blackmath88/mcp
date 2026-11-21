import { Schema } from 'effect'

import {
  AppState,
  Handoff,
  Ledger,
  Loop,
  Net,
  type World,
  withApp,
  withHandoff,
  withLedgerFault,
  withLoop,
  withNet,
} from './world.ts'

const applySetting = (world: World, setting: string): World => {
  const [key, value = ''] = setting.split('=')
  if (key === 'app') {
    return withApp(
      world,
      Schema.decodeUnknownSync(AppState.fields.tools)(value),
    )
  }
  if (key === 'fault') {
    return withLedgerFault(
      world,
      Schema.decodeUnknownSync(Ledger.fields.fault)(value),
    )
  }
  if (key === 'context') {
    return withHandoff(
      world,
      Schema.decodeUnknownSync(Handoff.fields.context)(value),
    )
  }
  if (key === 'criteria') {
    return withLoop(world, {
      criteria: Schema.decodeUnknownSync(Loop.fields.criteria)(value),
    })
  }
  if (key === 'engine') {
    return withLoop(world, {
      engine: Schema.decodeUnknownSync(Loop.fields.engine)(value),
    })
  }
  if (key === 'naming') {
    return withNet(world, {
      naming: Schema.decodeUnknownSync(Net.fields.naming)(value),
    })
  }
  if (key === 'dock') {
    return withNet(world, {
      dock: Schema.decodeUnknownSync(Net.fields.dock)(value),
    })
  }
  throw new Error(`Unknown setting: ${key}`)
}

export const applySettings = (
  world: World,
  settings: ReadonlyArray<string>,
): World => settings.reduce(applySetting, world)
