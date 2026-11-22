import { Schema } from 'effect'
import { defineMessageUnion } from 'foldkit/message'

import { Evidence, Reply } from './contract.ts'
import { Role } from './model.ts'
import { SpecimenId } from './specimens.ts'

export const Message = defineMessageUnion({
  SelectedSpecimen: { specimen: SpecimenId },
  SelectedTool: { tool: Schema.String },
  UpdatedEcho: { value: Schema.String },
  UpdatedRole: { role: Role },
  UpdatedQuery: { value: Schema.String },
  ClickedDiscover: {},
  ClickedCall: {},
  ClickedStop: {},
  SubmittedSearch: {},
  CompletedRequest: { epoch: Schema.Number, reply: Reply },
  CompletedCloseSession: {},
  WatchingSessionExit: {},
  ObservedAppEvent: {
    sessionId: Schema.String,
    run: Schema.Number,
    event: Evidence,
  },
  InitializedApp: { sessionId: Schema.String, run: Schema.Number },
  FailedApp: {
    sessionId: Schema.String,
    run: Schema.Number,
    error: Schema.String,
  },
  CompletedAppCall: {
    sessionId: Schema.String,
    run: Schema.Number,
    reply: Reply,
  },
})
export type Message = typeof Message.Type
