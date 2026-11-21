import { Schema } from 'effect'
import { Command } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import { CapabilityName, RunRecord } from '../domain/capabilities.ts'
import {
  FetchPolicy,
  FsBuild,
  GatewayBuild,
  Perception,
  StoragePath,
  ThinkingMode,
  World,
} from '../domain/world.ts'
import { BackstageTab, Chapter, Station, Weather } from './model.ts'

export const Message = defineMessageUnion({
  SelectedStation: { station: Station },
  SelectedPolicy: { policy: FetchPolicy },
  SelectedUrl: { value: Schema.String },
  SelectedStoragePath: { storagePath: StoragePath },
  SelectedThinkingMode: { mode: ThinkingMode },
  SelectedEntity: { value: Schema.String },
  SelectedObservation: { value: Schema.String },
  SelectedFsBuild: { build: FsBuild },
  SelectedPerception: { mode: Perception },
  SelectedPath: { value: Schema.String },
  SelectedTarget: { value: Schema.String },
  SelectedRootChoice: { value: Schema.String },
  ClickedSendRoots: {},
  ClickedRevokeRoots: {},
  SelectedServerSchema: { version: Schema.Number },
  SelectedGatewayBuild: { build: GatewayBuild },
  SelectedClient: { value: Schema.String },
  SelectedGatewayPlace: { value: Schema.String },
  ClickedReconnectClient: {},
  ClickedVanishClient: {},
  ClickedPassTimeout: {},
  ClickedRestartClient: {},
  ClickedRestartServer: {},
  ClickedReinstallPackage: {},
  ClickedChapter: { chapter: Chapter },
  SelectedCapability: { name: CapabilityName },
  SelectedFrom: { value: Schema.String },
  SelectedTo: { value: Schema.String },
  SelectedWeather: { weather: Weather },
  ClickedExecute: {},
  CompletedRunCapability: {
    runId: Schema.Number,
    record: RunRecord,
    world: World,
  },
  ClickedCancel: {},
  ClickedReset: {},
  CompletedCancelRunCapability: { outcome: Command.Interruptible.Outcome },
  ClickedReplayFromStart: {},
  ClickedStep: {},
  ClickedPlay: {},
  ClickedPause: {},
  ClickedShowAll: {},
  CompletedWaitBeforeNextEvent: { runId: Schema.Number, cursor: Schema.Number },
  SelectedTab: { tab: BackstageTab },
  ClickedToggleBackstage: {},
})
export type Message = typeof Message.Type
