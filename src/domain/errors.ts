import { Match, Schema } from 'effect'

import { PlaceId } from './world.ts'

export class InvalidInput extends Schema.TaggedError<InvalidInput>()(
  'InvalidInput',
  { message: Schema.String },
) {}

export class UnknownCapability extends Schema.TaggedError<UnknownCapability>()(
  'UnknownCapability',
  { name: Schema.String },
) {}

export class SamePlace extends Schema.TaggedError<SamePlace>()('SamePlace', {
  place: PlaceId,
}) {}

export class NoRoute extends Schema.TaggedError<NoRoute>()('NoRoute', {
  from: PlaceId,
  to: PlaceId,
}) {}

export class PathExists extends Schema.TaggedError<PathExists>()('PathExists', {
  from: PlaceId,
  to: PlaceId,
}) {}

export class PathTooLong extends Schema.TaggedError<PathTooLong>()(
  'PathTooLong',
  {
    from: PlaceId,
    to: PlaceId,
    span: Schema.Number,
    maxSpan: Schema.Number,
  },
) {}

export class RobotsDisallowed extends Schema.TaggedError<RobotsDisallowed>()(
  'RobotsDisallowed',
  { url: Schema.String, hop: Schema.Number },
) {}

export class TooManyRedirects extends Schema.TaggedError<TooManyRedirects>()(
  'TooManyRedirects',
  { url: Schema.String },
) {}

export class UnknownPage extends Schema.TaggedError<UnknownPage>()(
  'UnknownPage',
  { url: Schema.String },
) {}

export class AccessDenied extends Schema.TaggedError<AccessDenied>()(
  'AccessDenied',
  { path: Schema.String, reason: Schema.String },
) {}

export class UnknownFile extends Schema.TaggedError<UnknownFile>()(
  'UnknownFile',
  { path: Schema.String },
) {}

export class NotPerceivable extends Schema.TaggedError<NotPerceivable>()(
  'NotPerceivable',
  { target: Schema.String },
) {}

export class StaleReference extends Schema.TaggedError<StaleReference>()(
  'StaleReference',
  { target: Schema.String },
) {}

export class NoSnapshot extends Schema.TaggedError<NoSnapshot>()(
  'NoSnapshot',
  {},
) {}

export class NoArtifact extends Schema.TaggedError<NoArtifact>()(
  'NoArtifact',
  {},
) {}

export class SchemaMismatch extends Schema.TaggedError<SchemaMismatch>()(
  'SchemaMismatch',
  { detail: Schema.String },
) {}

export class NotOffered extends Schema.TaggedError<NotOffered>()('NotOffered', {
  tool: Schema.String,
}) {}

export class PartialFailure extends Schema.TaggedError<PartialFailure>()(
  'PartialFailure',
  { detail: Schema.String },
) {}

export class BackendDown extends Schema.TaggedError<BackendDown>()(
  'BackendDown',
  { backend: Schema.String, tool: Schema.String },
) {}

export class UnknownTool extends Schema.TaggedError<UnknownTool>()(
  'UnknownTool',
  { tool: Schema.String },
) {}

export class UnknownServer extends Schema.TaggedError<UnknownServer>()(
  'UnknownServer',
  { server: Schema.String },
) {}

export type DomainError =
  | UnknownServer
  | NotOffered
  | PartialFailure
  | BackendDown
  | UnknownTool
  | NoArtifact
  | SchemaMismatch
  | AccessDenied
  | UnknownFile
  | NotPerceivable
  | StaleReference
  | NoSnapshot
  | RobotsDisallowed
  | TooManyRedirects
  | UnknownPage
  | InvalidInput
  | UnknownCapability
  | SamePlace
  | NoRoute
  | PathExists
  | PathTooLong

export const describeError = (error: DomainError): string =>
  Match.value(error).pipe(
    Match.tagsExhaustive({
      RobotsDisallowed: ({ url, hop }) =>
        `robots.txt disallows ${url} (hop ${hop}).`,
      TooManyRedirects: ({ url }) =>
        `${url} redirected more than the allowed number of times.`,
      UnknownPage: ({ url }) => `${url} is not a page of the synthetic site.`,
      AccessDenied: ({ path, reason }) =>
        `Access denied for ${path}: ${reason}.`,
      UnknownFile: ({ path }) => `${path} does not exist.`,
      NotPerceivable: ({ target }) =>
        `"${target}" is not in the accessibility snapshot, so there is no reference to click.`,
      StaleReference: ({ target }) =>
        `The reference for "${target}" comes from an older snapshot. The page has changed since.`,
      NoSnapshot: () =>
        'No snapshot has been taken, so there are no references yet.',
      NoArtifact: () => 'No CLI has been generated yet.',
      SchemaMismatch: ({ detail }) =>
        `The server rejected the call: ${detail}.`,
      NotOffered: ({ tool }) => `The app in this build does not offer ${tool}.`,
      PartialFailure: ({ detail }) => detail,
      BackendDown: ({ backend, tool }) =>
        `${tool} is still listed, but its backend ${backend} is down.`,
      UnknownTool: ({ tool }) => `The inventory has no tool named ${tool}.`,
      UnknownServer: ({ server }) =>
        `The lab has no server named ${server} to profile.`,
      InvalidInput: ({ message }) => `Invalid input: ${message}`,
      UnknownCapability: ({ name }) => `There is no capability named ${name}.`,
      SamePlace: ({ place }) => `${place} cannot be connected to itself.`,
      NoRoute: ({ from, to }) => `No route leads from ${from} to ${to}.`,
      PathExists: ({ from, to }) =>
        `A path between ${from} and ${to} already exists.`,
      PathTooLong: ({ from, to, span, maxSpan }) =>
        `A path from ${from} to ${to} would span ${span}; the limit is ${maxSpan}.`,
    }),
  )
