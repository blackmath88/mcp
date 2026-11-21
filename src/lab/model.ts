import { Schema } from 'effect'
import { defineTaggedUnion } from 'foldkit/schema'

import { CapabilityName, RunRecord } from '../domain/capabilities.ts'
import {
  CALM_MAX_SPAN,
  FetchPolicy,
  type FsBuild,
  type Perception,
  PlaceId,
  STORM_MAX_SPAN,
  type StoragePath,
  type ThinkingMode,
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

export const Station = Schema.Literals([
  'valley',
  'fetch',
  'memory',
  'thinking',
  'filesystem',
  'perception',
  'cli',
  'local-remote',
  'apps',
  'code-mode',
  'delegation',
  'iteration',
  'network',
])
export type Station = typeof Station.Type

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
  station: Station,
  chapter: Chapter,
  completedChapters: Schema.Array(Chapter),
  weather: Weather,
  fetchPolicy: FetchPolicy,
  url: Schema.String,
  entity: Schema.String,
  observation: Schema.String,
  path: Schema.String,
  target: Schema.String,
  rootChoice: Schema.String,
  conversation: Schema.Array(Schema.String),
  serverStarts: Schema.Number,
  world: World,
  maybeSelected: Schema.Option(CapabilityName),
  from: PlaceId,
  to: PlaceId,
  run: RunState,
  nextRunId: Schema.Number,
  replay: Replay,
  tab: BackstageTab,
  backstage: Schema.Literals(['open', 'collapsed']),
  appLog: Schema.Array(AppLogEntry),
  nextAppLogSeq: Schema.Number,
})
export type Model = typeof Model.Type

export const worldFor = (
  weather: Weather,
  fetchPolicy: FetchPolicy = 'every-hop',
  storagePath: StoragePath = 'package-cache',
  thinkingMode: ThinkingMode = 'record',
  fsBuild: FsBuild = 'default',
  perception: Perception = 'snapshot',
): World =>
  seedWorld(
    maxSpanIn(weather),
    fetchPolicy,
    storagePath,
    thinkingMode,
    fsBuild,
    perception,
  )
