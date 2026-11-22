import { Effect, Option, Schema } from 'effect'

import {
  AccessDenied,
  type DomainError,
  UnknownFile,
  describeError,
} from './errors.ts'
import { type ComponentId, Trace, WorldStore } from './services.ts'
import { isAllowed } from './world.ts'

// NOTE: The lab's own simulation of a directory-confined file server.

const files: Readonly<Record<string, string>> = {
  '/valley/forge/orders.txt': '3 hinges for the Mill, due Friday.',
  '/valley/forge/plans/bridge.txt': 'Bridge plan: two spans, oak deck.',
  '/valley/mill/ledger.txt': 'Mill ledger: 40 sacks owed to the Dock.',
}

export const filePaths: ReadonlyArray<string> = Object.keys(files)

export const rootChoices: ReadonlyArray<string> = [
  '/valley/forge/plans',
  '/valley/mill',
  '/valley',
]

export const FileRead = Schema.TaggedStruct('FileRead', {
  path: Schema.String,
  content: Schema.String,
  allowedBy: Schema.String,
})
export type FileRead = typeof FileRead.Type

export const readFile = (calledBy: ComponentId, path: string) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const world = yield* store.read
    const step = {
      component: 'file-server',
      calledBy,
      operation: `read ${path}`,
    } as const
    yield* trace.emit({ ...step, kind: 'started', detail: '' })
    const attempt: Effect.Effect<FileRead, AccessDenied | UnknownFile, Trace> =
      Effect.gen(function* () {
        const check = {
          component: 'boundary',
          calledBy: 'file-server',
          operation: `is ${path} inside an allowed directory?`,
        } as const
        if (!isAllowed(world.files, path)) {
          const error = new AccessDenied({
            path,
            reason:
              world.files.allowed.length === 0
                ? 'no allowed directories'
                : `outside ${world.files.allowed.join(', ')}`,
          })
          yield* trace.emit({
            ...check,
            kind: 'failed',
            detail: describeError(error),
          })
          return yield* error
        }
        const allowedBy =
          world.files.allowed.find(
            directory => path === directory || path.startsWith(`${directory}/`),
          ) ?? ''
        yield* trace.emit({
          ...check,
          kind: 'succeeded',
          detail: `yes, inside ${allowedBy} (${world.files.rootsInForce ? 'set by client roots' : 'set at launch'})`,
        })
        const maybeContent = Option.fromNullishOr(files[path])
        if (Option.isNone(maybeContent)) {
          return yield* new UnknownFile({ path })
        }
        yield* trace.emit({
          component: 'synthetic-files',
          calledBy: 'file-server',
          kind: 'succeeded',
          operation: `open ${path}`,
          detail: `${maybeContent.value.length} characters`,
        })
        return FileRead.make({ path, content: maybeContent.value, allowedBy })
      })
    return yield* attempt.pipe(
      Effect.tap(() =>
        trace.emit({ ...step, kind: 'succeeded', detail: 'content returned' }),
      ),
      Effect.tapError((error: DomainError) =>
        trace.emit({ ...step, kind: 'failed', detail: describeError(error) }),
      ),
    )
  })
