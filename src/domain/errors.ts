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

export type DomainError =
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
