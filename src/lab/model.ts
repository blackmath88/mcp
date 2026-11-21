import { Schema } from 'effect'
import { defineTaggedUnion } from 'foldkit/schema'

import { CapabilityName, RunRecord } from '../domain/capabilities.ts'
import {
  CALM_MAX_SPAN,
  PlaceId,
  STORM_MAX_SPAN,
  World,
  seedWorld,
} from '../domain/world.ts'

export const Weather = Schema.Literals(['calm', 'storm'])
export type Weather = typeof Weather.Type

export const maxSpanIn = (weather: Weather): number =>
  weather === 'storm' ? STORM_MAX_SPAN : CALM_MAX_SPAN

export const Chapter = Schema.Literals([
  'discover',
  'inspect',
  'use',
  'trace',
  'program',
  'bend',
  'entrances',
])
export type Chapter = typeof Chapter.Type

export const BackstageTab = Schema.Literals([
  'engine',
  'app',
  'recording',
  'network',
])
export type BackstageTab = typeof BackstageTab.Type

export const RunState = defineTaggedUnion({
  Idle: {},
  Running: { runId: Schema.Number, capability: CapabilityName },
  Succeeded: { runId: Schema.Number, record: RunRecord },
  Failed: { runId: Schema.Number, record: RunRecord },
  Cancelled: { runId: Schema.Number, capability: CapabilityName },
})
export type RunState = typeof RunState.Type

export const Replay = defineTaggedUnion({
  Complete: {},
  Paused: { cursor: Schema.Number },
  Playing: { cursor: Schema.Number },
})
export type Replay = typeof Replay.Type

export const AppLogEntry = Schema.Struct({
  seq: Schema.Number,
  tag: Schema.String,
})
export type AppLogEntry = typeof AppLogEntry.Type

export const Model = Schema.Struct({
  chapter: Chapter,
  completedChapters: Schema.Array(Chapter),
  weather: Weather,
  world: World,
  maybeSelected: Schema.Option(CapabilityName),
  from: PlaceId,
  to: PlaceId,
  run: RunState,
  nextRunId: Schema.Number,
  replay: Replay,
  tab: BackstageTab,
  appLog: Schema.Array(AppLogEntry),
  nextAppLogSeq: Schema.Number,
})
export type Model = typeof Model.Type

export const worldFor = (weather: Weather): World =>
  seedWorld(maxSpanIn(weather))
