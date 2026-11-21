import { Effect, Schema } from 'effect'

import {
  type DomainError,
  NoSnapshot,
  NotPerceivable,
  StaleReference,
  describeError,
} from './errors.ts'
import { type ComponentId, Trace, WorldStore } from './services.ts'
import { NO_SNAPSHOT, type Page } from './world.ts'

// NOTE: The lab's own simulation of a browser tool that perceives a page
// through an accessibility snapshot, with coordinate clicks as an opt-in.

export type Control = Readonly<{
  id: 'gate' | 'lever' | 'valve' | 'bell'
  label: string
  madeOf: string
  inSnapshot: boolean
  x: number
  y: number
}>

export const controls: ReadonlyArray<Control> = [
  {
    id: 'gate',
    label: 'Open gate',
    madeOf: 'a labelled button',
    inSnapshot: true,
    x: 60,
    y: 40,
  },
  {
    id: 'lever',
    label: 'Lever',
    madeOf: 'a clickable picture with no role or name',
    inSnapshot: false,
    x: 180,
    y: 40,
  },
  {
    id: 'valve',
    label: 'Valve',
    madeOf: 'pixels drawn on a canvas',
    inSnapshot: false,
    x: 60,
    y: 110,
  },
  {
    id: 'bell',
    label: 'Ring bell',
    madeOf: 'a labelled button',
    inSnapshot: true,
    x: 180,
    y: 110,
  },
]

export const controlIds: ReadonlyArray<string> = controls.map(
  control => control.id,
)

export const SnapshotTaken = Schema.TaggedStruct('SnapshotTaken', {
  pageRevision: Schema.Number,
  entries: Schema.Array(
    Schema.Struct({
      ref: Schema.String,
      role: Schema.String,
      name: Schema.String,
    }),
  ),
  notExposed: Schema.Number,
})
export type SnapshotTaken = typeof SnapshotTaken.Type

export const Clicked = Schema.TaggedStruct('Clicked', {
  target: Schema.String,
  how: Schema.String,
  pageRevision: Schema.Number,
})
export type Clicked = typeof Clicked.Type

const refOf = (control: Control, revision: number): string =>
  `r${revision}e${controls.indexOf(control) + 1}`

const press = (page: Page, id: Control['id']): Page => ({
  ...page,
  revision: page.revision + 1,
  gate: id === 'gate' ? !page.gate : page.gate,
  lever: id === 'lever' ? !page.lever : page.lever,
  valve: id === 'valve' ? !page.valve : page.valve,
  bell: id === 'bell' ? page.bell + 1 : page.bell,
})

export const takeSnapshot = (calledBy: ComponentId) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const world = yield* store.read
    const step = {
      component: 'browser-tool',
      calledBy,
      operation: 'take snapshot',
    } as const
    yield* trace.emit({ ...step, kind: 'started', detail: '' })
    const exposed = controls.filter(control => control.inSnapshot)
    yield* trace.emit({
      component: 'accessibility-tree',
      calledBy: 'browser-tool',
      kind: 'succeeded',
      operation: 'read the accessibility tree',
      detail: `${exposed.length} of ${controls.length} controls have a role and a name`,
    })
    yield* store.commit({
      ...world,
      page: { ...world.page, snapshotRevision: world.page.revision },
    })
    yield* trace.emit({
      ...step,
      kind: 'succeeded',
      detail: `references are valid for page revision ${world.page.revision} only`,
    })
    return SnapshotTaken.make({
      pageRevision: world.page.revision,
      entries: exposed.map(control => ({
        ref: refOf(control, world.page.revision),
        role: 'button',
        name: control.label,
      })),
      notExposed: controls.length - exposed.length,
    })
  })

export const click = (calledBy: ComponentId, target: string) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const world = yield* store.read
    const page = world.page
    const step = {
      component: 'browser-tool',
      calledBy,
      operation: `click "${target}"`,
    } as const
    yield* trace.emit({
      ...step,
      kind: 'started',
      detail:
        page.mode === 'vision'
          ? 'by coordinates (vision capability on)'
          : 'by reference from the snapshot',
    })
    const control = controls.find(candidate => candidate.id === target)
    const attempt: Effect.Effect<
      Clicked,
      NoSnapshot | NotPerceivable | StaleReference,
      Trace
    > = Effect.gen(function* () {
      if (control === undefined) {
        return yield* new NotPerceivable({ target })
      }
      if (page.mode === 'vision') {
        yield* trace.emit({
          component: 'synthetic-page',
          calledBy: 'browser-tool',
          kind: 'state-changed',
          operation: `mouse click at (${control.x}, ${control.y})`,
          detail:
            'Something at that point reacted. Nothing told the tool what it was.',
        })
        yield* store.commit({ ...world, page: press(page, control.id) })
        return Clicked.make({
          target,
          how: `coordinates (${control.x}, ${control.y})`,
          pageRevision: page.revision + 1,
        })
      }
      if (page.snapshotRevision === NO_SNAPSHOT) {
        return yield* new NoSnapshot()
      }
      const lookUp = {
        component: 'accessibility-tree',
        calledBy: 'browser-tool',
        operation: `find a reference for "${target}"`,
      } as const
      if (!control.inSnapshot) {
        const error = new NotPerceivable({ target })
        yield* trace.emit({
          ...lookUp,
          kind: 'failed',
          detail: `${describeError(error)} It is ${control.madeOf}.`,
        })
        return yield* error
      }
      if (page.snapshotRevision !== page.revision) {
        const error = new StaleReference({ target })
        yield* trace.emit({
          ...lookUp,
          kind: 'failed',
          detail: `${describeError(error)} Snapshot: revision ${page.snapshotRevision}; page: revision ${page.revision}.`,
        })
        return yield* error
      }
      const ref = refOf(control, page.revision)
      yield* trace.emit({ ...lookUp, kind: 'succeeded', detail: ref })
      yield* trace.emit({
        component: 'synthetic-page',
        calledBy: 'browser-tool',
        kind: 'state-changed',
        operation: `click ${ref}`,
        detail: `"${control.label}" reacted. The page re-rendered: revision ${page.revision} → ${page.revision + 1}.`,
      })
      yield* store.commit({ ...world, page: press(page, control.id) })
      return Clicked.make({
        target,
        how: `reference ${ref}`,
        pageRevision: page.revision + 1,
      })
    })
    return yield* attempt.pipe(
      Effect.tap(() =>
        trace.emit({ ...step, kind: 'succeeded', detail: 'clicked' }),
      ),
      Effect.tapError((error: DomainError) =>
        trace.emit({ ...step, kind: 'failed', detail: describeError(error) }),
      ),
    )
  })
