import { Schema } from 'effect'

import { SpecimenId } from './specimens.ts'

export const Request = Schema.TaggedUnion({
  Connect: { specimen: SpecimenId },
  Call: {
    sessionId: Schema.String,
    tool: Schema.String,
    arguments: Schema.Record(Schema.String, Schema.Json),
    from: Schema.Literals(['learner', 'app']),
    appRun: Schema.optional(Schema.Number),
  },
  Stop: { sessionId: Schema.String },
  Close: { sessionId: Schema.String },
  Search: { query: Schema.String },
})
export type Request = typeof Request.Type

export const Tool = Schema.Struct({
  name: Schema.String,
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  inputSchemaJson: Schema.String,
  readOnlyHint: Schema.optional(Schema.Boolean),
  uiUri: Schema.optional(Schema.String),
  appVisible: Schema.Boolean,
})
export type Tool = typeof Tool.Type

export const Evidence = Schema.Struct({
  seq: Schema.Number,
  at: Schema.String,
  channel: Schema.Literals(['MCP stdio', 'MCP Apps', 'Host', 'Registry REST']),
  direction: Schema.Literals(['out', 'in', 'local']),
  label: Schema.String,
  detail: Schema.String,
})
export type Evidence = typeof Evidence.Type

export const Session = Schema.Struct({
  id: Schema.String,
  state: Schema.Literals(['ready', 'stopped', 'failed']),
  server: Schema.String,
  version: Schema.String,
  protocol: Schema.String,
  tools: Schema.Array(Tool),
  partial: Schema.Boolean,
})
export type Session = typeof Session.Type

export const Invocation = Schema.Struct({
  tool: Schema.String,
  argumentsJson: Schema.String,
  from: Schema.Literals(['learner', 'app']),
  resultJson: Schema.String,
  isError: Schema.Boolean,
})
export type Invocation = typeof Invocation.Type

export const AppResource = Schema.Struct({
  uri: Schema.String,
  html: Schema.String,
  sandboxUrl: Schema.String,
  tool: Schema.String,
  run: Schema.Number,
  argumentsJson: Schema.String,
  resultJson: Schema.String,
})
export type AppResource = typeof AppResource.Type

export const RegistryEntry = Schema.Struct({
  name: Schema.String,
  version: Schema.String,
  description: Schema.String,
  packages: Schema.Array(Schema.String),
  remotes: Schema.Array(Schema.String),
})
export type RegistryEntry = typeof RegistryEntry.Type

export const Reply = Schema.Struct({
  events: Schema.Array(Evidence),
  dropped: Schema.Number,
  error: Schema.optional(Schema.String),
  session: Schema.optional(Session),
  invocation: Schema.optional(Invocation),
  app: Schema.optional(AppResource),
  registry: Schema.optional(
    Schema.Struct({
      entries: Schema.Array(RegistryEntry),
      partial: Schema.Boolean,
    }),
  ),
})
export type Reply = typeof Reply.Type
