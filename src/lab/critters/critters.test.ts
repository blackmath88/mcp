import { Schema } from 'effect'
// @vitest-environment node
import { describe, expect, test } from 'vitest'

import library from '../../../specimens/library.json'
import { Station } from '../model.ts'
import {
  clampX,
  critterForEntry,
  critters,
  hues,
  pickWeighted,
  rawCritters,
  resolveEntry,
} from './catalog.ts'
import { cellColour, mix } from './render.ts'
import { SIZE, spriteIds, sprites } from './sprites.ts'

describe('the critter sprites', () => {
  test('every frame is a 16 by 16 grid', () => {
    spriteIds.forEach(id => {
      sprites[id].frames.forEach(frame => {
        expect(frame).toHaveLength(SIZE)
        frame.forEach(row => expect(row).toHaveLength(SIZE))
      })
    })
  })

  test('every letter in a grid has a colour in its palette', () => {
    spriteIds.forEach(id => {
      const { palette, frames } = sprites[id]
      frames.forEach(frame =>
        frame.forEach(row =>
          [...row].forEach(char => {
            if (char !== '.')
              expect(palette[char], `${id}: ${char}`).toBeDefined()
          }),
        ),
      )
    })
  })

  test('every sprite has a hue for its mosaic and duotone art', () => {
    spriteIds.forEach(id => expect(hues[id]).toBeDefined())
  })
})

describe('the critter catalogue', () => {
  test('every critter resolves to a library entry or carries its own', () => {
    rawCritters.forEach(raw => {
      expect(resolveEntry(raw, library.entries), raw.id).toBeDefined()
    })
    expect(critters).toHaveLength(rawCritters.length)
  })

  test('every critter stands at a real station and opens its entry’s own words', () => {
    critters.forEach(critter => {
      expect(Schema.is(Station)(critter.station), critter.id).toBe(true)
      expect(critter.what.length).toBeGreaterThan(20)
      expect(critter.weird).toBeGreaterThanOrEqual(1)
      expect(critter.weird).toBeLessThanOrEqual(4)
      expect(critter.breaks).toBeGreaterThanOrEqual(1)
      expect(critter.breaks).toBeLessThanOrEqual(4)
    })
  })

  test('a library card finds the critter that stands for it', () => {
    const frank = library.entries.find(
      entry => entry.station === 'thinking' && entry.kind === 'breaking',
    )
    expect(frank).toBeDefined()
    if (frank === undefined) return
    expect(critterForEntry(frank.station, frank.kind, frank.name)?.id).toBe(
      'frank',
    )
  })

  test('the two servers outside the library are labelled as research', () => {
    const own = rawCritters.filter(raw => raw.entry !== undefined)
    expect(own.map(raw => raw.id).sort()).toEqual(['soul', 'trippy'])
    own.forEach(raw => expect(raw.entry?.evidence.kind).toBe('research'))
  })
})

describe('the walker’s pure helpers', () => {
  test('weighted picks follow the weights', () => {
    const items = ['plain', 'weird']
    const weight = (item: string) => (item === 'weird' ? 3 : 1)
    expect(pickWeighted(items, weight, 0)).toBe('plain')
    expect(pickWeighted(items, weight, 0.24)).toBe('plain')
    expect(pickWeighted(items, weight, 0.26)).toBe('weird')
    expect(pickWeighted([], weight, 0.5)).toBeUndefined()
  })

  test('a box never leaves the viewport', () => {
    expect(clampX(-40, 72, 0, 375, 0)).toBe(0)
    expect(clampX(350, 72, 0, 375, 0)).toBe(303)
    expect(clampX(100, 330, 0, 375, 12)).toBe(33)
    expect(clampX(100, 360, 0, 375, 12)).toBe(12)
  })
})

describe('the shading rules', () => {
  test('colours mix in hex', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  test('faces keep their outline colour; only the exterior edge is shaded', () => {
    // Gopher's eye pupil (row 4, column 4) is an outline pixel inside the face.
    expect(cellColour('gopher', 0, 'plain', 4, 4)).toBe(
      sprites.gopher.palette['k'],
    )
    // An empty cell has no colour.
    expect(cellColour('gopher', 0, 'plain', 0, 0)).toBeUndefined()
  })
})
