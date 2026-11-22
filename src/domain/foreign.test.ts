// @vitest-environment node
import { describe, expect, test } from 'vitest'

import { EXAMPLE_LISTING, characterNote, parseListing } from './foreign.ts'
import { profile } from './lens.ts'

const tools = (text: string) => {
  const parsed = parseListing(text)
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }
  return parsed.tools
}

describe('reading a tool list the lab did not write', () => {
  test('it accepts the three shapes a person is likely to paste', () => {
    const one = {
      name: 'a',
      inputSchema: { type: 'object', properties: { x: {} } },
    }
    expect(tools(JSON.stringify({ tools: [one] }))[0]?.parameters).toEqual([
      'x',
    ])
    expect(
      tools(
        JSON.stringify({ jsonrpc: '2.0', id: 1, result: { tools: [one] } }),
      ),
    ).toHaveLength(1)
    expect(tools(JSON.stringify([one]))).toHaveLength(1)
  })

  test('it says what is wrong instead of guessing', () => {
    expect(parseListing('{')).toMatchObject({ ok: false })
    expect(parseListing('{"nope": 1}')).toMatchObject({ ok: false })
    expect(parseListing('{"tools": [{"description": "no name"}]}')).toEqual({
      ok: false,
      error: 'Tool 1 has no name.',
    })
    expect(parseListing('   ')).toEqual({ ok: false, error: '' })
  })

  test('absent hints stay absent; they are not filled with defaults', () => {
    const send = tools(EXAMPLE_LISTING).find(tool => tool.name === 'send_email')
    expect(send?.hints).toEqual({
      readOnly: undefined,
      destructive: undefined,
      idempotent: undefined,
      openWorld: true,
    })
  })

  test('the example shows a poisoned description, hidden characters and a way out', () => {
    const listed = tools(EXAMPLE_LISTING)
    const rules = (name: string) =>
      listed
        .find(tool => tool.name === name)
        ?.claims.map(claim => claim.rule) ?? []
    expect(rules('summarise_inbox')).toContain('L09')
    expect(rules('get_weather')).toContain('L10')
    expect(
      characterNote(
        listed.find(tool => tool.name === 'get_weather')?.description ?? '',
      ),
    ).toMatch(/do not display/)
    expect(profile(listed).compositions.map(entry => entry.rule)).toEqual([
      'C01',
    ])
  })

  test('the family is a guess that names what it rests on', () => {
    const listed = tools(EXAMPLE_LISTING)
    expect(listed.find(tool => tool.name === 'save_note')).toMatchObject({
      family: 'remember',
    })
    expect(listed.find(tool => tool.name === 'send_email')?.family).toBe(
      'change',
    )
    expect(listed.every(tool => tool.familyBasis !== '')).toBe(true)
  })
})
