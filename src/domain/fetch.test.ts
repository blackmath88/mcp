// @vitest-environment node
import { Effect } from 'effect'
import { describe, expect, test } from 'vitest'

import { CapabilityName, catalogue, runOn } from './capabilities.ts'
import { Pace } from './services.ts'
import { CALM_MAX_SPAN, type FetchPolicy, seedWorld } from './world.ts'

const fetchWith = (policy: FetchPolicy, path: string) =>
  Effect.runSync(
    runOn(seedWorld(CALM_MAX_SPAN, policy), 'fetch_page', {
      url: `https://valley.test${path}`,
    }).pipe(Effect.provide(Pace.unpaced)),
  ).record

describe('catalogue', () => {
  test('every executable capability has a catalogue entry', () => {
    expect([...catalogue.map(capability => capability.name)].sort()).toEqual(
      [...CapabilityName.literals].sort(),
    )
  })
})

describe('fetch_page on the synthetic site', () => {
  test('an allowed page comes back under every policy', () => {
    const policies: ReadonlyArray<FetchPolicy> = [
      'every-hop',
      'first-hop',
      'none',
    ]
    policies.forEach(policy => {
      expect(fetchWith(policy, '/welcome').outcome).toMatchObject({
        _tag: 'Succeeded',
        output: {
          finalUrl: 'https://valley.test/welcome',
          hops: [expect.any(String)],
        },
      })
    })
  })

  test('checking every hop refuses the redirect target', () => {
    const record = fetchWith('every-hop', '/notice')
    expect(record.outcome).toMatchObject({ error: 'RobotsDisallowed' })
    expect(record.events.find(event => event.kind === 'failed')).toMatchObject({
      component: 'robots-policy',
      operation: 'check robots.txt for hop 2',
    })
  })

  test('checking only the first URL returns the disallowed page', () => {
    const record = fetchWith('first-hop', '/notice')
    expect(record.outcome).toMatchObject({
      _tag: 'Succeeded',
      output: {
        requestedUrl: 'https://valley.test/notice',
        finalUrl: 'https://valley.test/ledger',
        robotsChecks: 1,
      },
    })
    expect(
      record.events.some(
        event => event.operation === 'robots.txt not consulted for hop 2',
      ),
    ).toBe(true)
  })

  test('with no checks the policy component is never called', () => {
    const record = fetchWith('none', '/ledger')
    expect(record.outcome._tag).toBe('Succeeded')
    expect(
      record.events.some(event => event.component === 'robots-policy'),
    ).toBe(false)
  })

  test('a direct request for the disallowed page is refused by both checking policies', () => {
    expect(fetchWith('every-hop', '/ledger').outcome).toMatchObject({
      error: 'RobotsDisallowed',
    })
    expect(fetchWith('first-hop', '/ledger').outcome).toMatchObject({
      error: 'RobotsDisallowed',
    })
  })

  test('a redirect loop stops and an unknown page fails', () => {
    expect(fetchWith('none', '/loop').outcome).toMatchObject({
      error: 'TooManyRedirects',
    })
    expect(fetchWith('none', '/nowhere').outcome).toMatchObject({
      error: 'UnknownPage',
    })
  })

  test('a missing url is invalid input', () => {
    const record = Effect.runSync(
      runOn(seedWorld(CALM_MAX_SPAN), 'fetch_page', {}).pipe(
        Effect.provide(Pace.unpaced),
      ),
    ).record
    expect(record.outcome).toMatchObject({ error: 'InvalidInput' })
  })
})
