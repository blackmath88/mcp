import { Effect, Schema } from 'effect'

import {
  type DomainError,
  NoArtifact,
  SchemaMismatch,
  describeError,
} from './errors.ts'
import { type ComponentId, Trace, WorldStore } from './services.ts'
import { NO_ARTIFACT } from './world.ts'

// NOTE: The lab's own simulation of a CLI generated from a server's tool
// schema. mcporter's generator doc says an artifact embeds the resolved server
// definition and its metadata; it does not settle whether tool schemas are
// fixed at generation time. This specimen simulates the case where they are.

export const fieldsOf = (schemaVersion: number): ReadonlyArray<string> =>
  schemaVersion >= 2 ? ['count', 'destination'] : ['count']

export const wanted = { count: 3, destination: 'dock' } as const

export const helpText = (schemaVersion: number): string =>
  `valley-cli ship_crates ${fieldsOf(schemaVersion)
    .map(field => `--${field} <${field}>`)
    .join(' ')}`

export const CliGenerated = Schema.TaggedStruct('CliGenerated', {
  schemaVersion: Schema.Number,
  help: Schema.String,
})
export type CliGenerated = typeof CliGenerated.Type

export const CratesShipped = Schema.TaggedStruct('CratesShipped', {
  via: Schema.String,
  sentFields: Schema.Array(Schema.String),
  schemaUsed: Schema.Number,
})
export type CratesShipped = typeof CratesShipped.Type

const serverAccepts = (
  calledBy: ComponentId,
  serverSchema: number,
  sentFields: ReadonlyArray<string>,
) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const expected = fieldsOf(serverSchema)
    const missing = expected.filter(field => !sentFields.includes(field))
    const unknown = sentFields.filter(field => !expected.includes(field))
    const step = {
      component: 'crate-server',
      calledBy,
      operation: `ship_crates(${sentFields.join(', ')})`,
    } as const
    if (missing.length > 0 || unknown.length > 0) {
      const error = new SchemaMismatch({
        detail: [
          missing.length > 0 ? `missing ${missing.join(', ')}` : '',
          unknown.length > 0 ? `unknown ${unknown.join(', ')}` : '',
        ]
          .filter(part => part !== '')
          .join('; '),
      })
      yield* trace.emit({
        ...step,
        kind: 'failed',
        detail: describeError(error),
      })
      return yield* error
    }
    yield* trace.emit({
      ...step,
      kind: 'succeeded',
      detail: `accepted under schema v${serverSchema}`,
    })
    return true
  })

export const generateCli = (calledBy: ComponentId) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const world = yield* store.read
    const version = world.cli.serverSchema
    const step = {
      component: 'cli-generator',
      calledBy,
      operation: 'generate CLI',
    } as const
    yield* trace.emit({ ...step, kind: 'started', detail: '' })
    yield* trace.emit({
      component: 'crate-server',
      calledBy: 'cli-generator',
      kind: 'succeeded',
      operation: 'list tools',
      detail: `schema v${version}: ship_crates(${fieldsOf(version).join(', ')})`,
    })
    yield* store.commit({
      ...world,
      cli: { ...world.cli, artifactSchema: version },
    })
    yield* trace.emit({
      ...step,
      kind: 'artifact-produced',
      detail: `valley-cli embeds schema v${version}. It will not look again.`,
    })
    return CliGenerated.make({
      schemaVersion: version,
      help: helpText(version),
    })
  })

const shipped = (
  step: Readonly<{
    component: ComponentId
    calledBy: ComponentId
    operation: string
  }>,
  attempt: Effect.Effect<CratesShipped, DomainError, Trace>,
) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    yield* trace.emit({ ...step, kind: 'started', detail: '' })
    return yield* attempt.pipe(
      Effect.tap(() =>
        trace.emit({ ...step, kind: 'succeeded', detail: 'shipped' }),
      ),
      Effect.tapError(error =>
        trace.emit({ ...step, kind: 'failed', detail: describeError(error) }),
      ),
    )
  })

export const callLive = (calledBy: ComponentId) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const world = yield* store.read
    const version = world.cli.serverSchema
    return yield* shipped(
      {
        component: 'live-client',
        calledBy,
        operation: 'ship 3 crates to the dock',
      },
      Effect.gen(function* () {
        yield* trace.emit({
          component: 'crate-server',
          calledBy: 'live-client',
          kind: 'succeeded',
          operation: 'list tools',
          detail: `discovered now: schema v${version}`,
        })
        const sentFields = fieldsOf(version)
        yield* serverAccepts('live-client', version, sentFields)
        return CratesShipped.make({
          via: 'a live call that listed the tools first',
          sentFields,
          schemaUsed: version,
        })
      }),
    )
  })

export const callGenerated = (calledBy: ComponentId) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const world = yield* store.read
    const { artifactSchema, serverSchema } = world.cli
    return yield* shipped(
      {
        component: 'generated-cli',
        calledBy,
        operation: 'ship 3 crates to the dock',
      },
      Effect.gen(function* () {
        if (artifactSchema === NO_ARTIFACT) {
          return yield* new NoArtifact()
        }
        const sentFields = fieldsOf(artifactSchema)
        yield* trace.emit({
          component: 'generated-cli',
          calledBy: 'generated-cli',
          kind: 'succeeded',
          operation: 'check arguments against the embedded schema',
          detail: `valid under embedded schema v${artifactSchema}. The server was not asked.`,
        })
        yield* serverAccepts('generated-cli', serverSchema, sentFields)
        return CratesShipped.make({
          via: 'the generated CLI',
          sentFields,
          schemaUsed: artifactSchema,
        })
      }),
    )
  })
