import { Schema } from 'effect'
import { defineTaggedUnion } from 'foldkit/schema'

import {
  AppResource,
  Evidence,
  Invocation,
  RegistryResults,
  Session,
} from './contract.ts'
import { SpecimenId } from './specimens.ts'

export const Role = Schema.Literals(['viewer', 'editor'])

export const Operation = defineTaggedUnion({
  Idle: {},
  Discovering: {},
  Calling: {},
  Stopping: {},
  Searching: {},
})
export const AppState = defineTaggedUnion({
  Starting: {},
  Ready: {},
  Failed: { error: Schema.String },
})

export const Model = Schema.Struct({
  specimen: SpecimenId,
  epoch: Schema.Number,
  operation: Operation,
  session: Schema.Option(Session),
  tool: Schema.String,
  echoMessage: Schema.String,
  role: Role,
  query: Schema.String,
  invocation: Schema.Option(Invocation),
  app: Schema.Option(AppResource),
  appState: AppState,
  events: Schema.Array(Evidence),
  dropped: Schema.Number,
  appEvents: Schema.Array(Evidence),
  error: Schema.Option(Schema.String),
  registry: Schema.Option(RegistryResults),
  registryEvents: Schema.Array(Evidence),
})
export type Model = typeof Model.Type
