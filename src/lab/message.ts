import { Schema } from 'effect'
import { Command } from 'foldkit'
import { defineMessageUnion } from 'foldkit/message'

import { CapabilityName, RunRecord } from '../domain/capabilities.ts'
import { World } from '../domain/world.ts'
import { BackstageTab, Chapter, Weather } from './model.ts'

export const Message = defineMessageUnion({
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
})
export type Message = typeof Message.Type
