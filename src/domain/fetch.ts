import { Effect, Option, Schema } from 'effect'

import {
  type DomainError,
  RobotsDisallowed,
  TooManyRedirects,
  UnknownPage,
  describeError,
} from './errors.ts'
import { type ComponentId, Trace, WorldStore } from './services.ts'
import type { FetchPolicy } from './world.ts'

// NOTE: This is the lab's own simulation of behaviours documented for fetch
// servers. It is not upstream code and makes no network request.

export const SITE = 'https://valley.test'
export const MAX_REDIRECTS = 3

type Entry =
  | Readonly<{ kind: 'page'; title: string; markdown: string }>
  | Readonly<{ kind: 'redirect'; to: string }>

const site: Readonly<Record<string, Entry>> = {
  '/welcome': {
    kind: 'page',
    title: 'Welcome to the valley',
    markdown: '# Welcome\n\nFive workshops, two roads and a river.',
  },
  '/notice': { kind: 'redirect', to: '/ledger' },
  '/ledger': {
    kind: 'page',
    title: 'Kiln ledger',
    markdown: '# Ledger\n\nThe Forge owes the Kiln 12 crates of clay.',
  },
  '/loop': { kind: 'redirect', to: '/loop' },
}

export const robotsDisallow: ReadonlyArray<string> = ['/ledger']

export const siteUrls: ReadonlyArray<string> = Object.keys(site).map(
  path => `${SITE}${path}`,
)

export const PageFetched = Schema.TaggedStruct('PageFetched', {
  requestedUrl: Schema.String,
  finalUrl: Schema.String,
  hops: Schema.Array(Schema.String),
  robotsChecks: Schema.Number,
  title: Schema.String,
  markdown: Schema.String,
})
export type PageFetched = typeof PageFetched.Type

const pathOf = (url: string): Option.Option<string> =>
  url.startsWith(`${SITE}/`)
    ? Option.some(url.slice(SITE.length))
    : Option.none()

const lookUp = (url: string): Option.Option<Entry> =>
  Option.flatMap(pathOf(url), path => Option.fromNullishOr(site[path]))

const policyLabel: Record<FetchPolicy, string> = {
  'every-hop': 'check every hop',
  'first-hop': 'check the first URL only',
  none: 'never check',
}

const checkRobots = Effect.fnUntraced(function* (url: string, hop: number) {
  const trace = yield* Trace
  const step = {
    component: 'robots-policy',
    calledBy: 'fetcher',
    operation: `check robots.txt for hop ${hop}`,
  } as const
  const isDisallowed = Option.match(pathOf(url), {
    onNone: () => false,
    onSome: path => robotsDisallow.includes(path),
  })
  if (isDisallowed) {
    const error = new RobotsDisallowed({ url, hop })
    yield* trace.emit({ ...step, kind: 'failed', detail: describeError(error) })
    return yield* error
  }
  yield* trace.emit({ ...step, kind: 'succeeded', detail: `${url} is allowed` })
  return true
})

type Visit = Readonly<{
  url: string
  hops: ReadonlyArray<string>
  robotsChecks: number
}>

const visit = (
  policy: FetchPolicy,
  current: Visit,
): Effect.Effect<
  PageFetched,
  RobotsDisallowed | TooManyRedirects | UnknownPage,
  Trace
> =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const hop = current.hops.length + 1
    const shouldCheck =
      policy === 'every-hop' || (policy === 'first-hop' && hop === 1)
    if (shouldCheck) {
      yield* checkRobots(current.url, hop)
    } else {
      yield* trace.emit({
        component: 'fetcher',
        calledBy: 'fetcher',
        kind: 'succeeded',
        operation: `robots.txt not consulted for hop ${hop}`,
        detail: `policy: ${policyLabel[policy]}`,
      })
    }
    const robotsChecks = current.robotsChecks + (shouldCheck ? 1 : 0)
    const hops = [...current.hops, current.url]
    const maybeEntry = lookUp(current.url)
    if (Option.isNone(maybeEntry)) {
      const error = new UnknownPage({ url: current.url })
      yield* trace.emit({
        component: 'synthetic-web',
        calledBy: 'fetcher',
        kind: 'failed',
        operation: `GET ${current.url}`,
        detail: describeError(error),
      })
      return yield* error
    }
    const entry = maybeEntry.value
    if (entry.kind === 'page') {
      yield* trace.emit({
        component: 'synthetic-web',
        calledBy: 'fetcher',
        kind: 'succeeded',
        operation: `GET ${current.url}`,
        detail: `200, "${entry.title}"`,
      })
      return PageFetched.make({
        requestedUrl: hops[0] ?? current.url,
        finalUrl: current.url,
        hops,
        robotsChecks,
        title: entry.title,
        markdown: entry.markdown,
      })
    }
    const next = `${SITE}${entry.to}`
    yield* trace.emit({
      component: 'synthetic-web',
      calledBy: 'fetcher',
      kind: 'succeeded',
      operation: `GET ${current.url}`,
      detail: `302, redirect to ${next}`,
    })
    if (hops.length > MAX_REDIRECTS) {
      return yield* new TooManyRedirects({ url: hops[0] ?? current.url })
    }
    return yield* visit(policy, { url: next, hops, robotsChecks })
  })

export const fetchPage = (calledBy: ComponentId, url: string) =>
  Effect.gen(function* () {
    const trace = yield* Trace
    const store = yield* WorldStore
    const world = yield* store.read
    const step = {
      component: 'fetcher',
      calledBy,
      operation: `fetch ${url}`,
    } as const
    yield* trace.emit({
      ...step,
      kind: 'started',
      detail: `policy: ${policyLabel[world.fetchPolicy]}`,
    })
    return yield* visit(world.fetchPolicy, {
      url,
      hops: [],
      robotsChecks: 0,
    }).pipe(
      Effect.tap(page =>
        trace.emit({
          ...step,
          kind: 'succeeded',
          detail: `returned "${page.title}" from ${page.finalUrl} after ${page.hops.length} hop(s), ${page.robotsChecks} robots check(s)`,
        }),
      ),
      Effect.tapError((error: DomainError) =>
        trace.emit({ ...step, kind: 'failed', detail: describeError(error) }),
      ),
    )
  })
