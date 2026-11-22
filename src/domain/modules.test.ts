import { describe, expect, test } from 'vitest'

import { catalogue } from './capabilities.ts'
import { EXAMPLE_LISTING, parseListing } from './foreign.ts'
import { listedFromCatalogue, profile } from './lens.ts'
import { guessModule, interactionsOf, moduleOf, modules } from './modules.ts'

describe('the map of a tool list', () => {
  test('nine modules, one per rung, in order', () => {
    expect(modules.map(module => module.rung)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ])
  })

  test('every rung has at least one of the lab’s tools', () => {
    const used = new Set(catalogue.map(capability => moduleOf[capability.name]))
    expect(modules.filter(module => !used.has(module.id))).toEqual([])
  })

  test('lines are drawn only between lit modules', () => {
    const lit = catalogue
      .filter(capability => capability.specimen === 'arm')
      .map(capability => ({
        name: capability.name,
        module: moduleOf[capability.name],
        claims:
          profile([listedFromCatalogue(capability)]).tools[0]?.claims ?? [],
      }))
    expect(interactionsOf(lit).map(edge => edge.rule)).toEqual(['M07'])
    expect(interactionsOf([])).toEqual([])
  })

  test('a pasted listing is placed by guesses that name their basis, and the C01 pair shows', () => {
    const parsed = parseListing(EXAMPLE_LISTING)
    if (!parsed.ok) {
      throw new Error('the example should parse')
    }
    const placed = parsed.tools.map(tool => ({
      name: tool.name,
      module: guessModule(tool).module,
      claims: tool.claims,
      basis: guessModule(tool).basis,
    }))
    expect(placed.every(tool => tool.basis !== '')).toBe(true)
    expect(placed.some(tool => tool.module === 'ask')).toBe(false)
    expect(interactionsOf(placed).map(edge => edge.rule)).toContain('C01')
  })

  test('wording about a device is read as a possible physical action', () => {
    expect(
      guessModule({
        description: 'Turn the hallway lamp on or off.',
        family: 'change',
        familyBasis: 'not declared read-only',
      }).module,
    ).toBe('world')
  })
})
