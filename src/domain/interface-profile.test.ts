import { expect, it } from 'vitest'

import { interfaceProfile, interfaceUnknowns } from './interface-profile.ts'

it('classifies explicit interface fields and preserves unknown behaviour', () => {
  const metadata = {
    name: 'write_to_a_model',
    inputSchemaJson: '{"type":"object"}',
    uiUri: 'ui://example/editor',
    readOnlyHint: false,
  }
  const claims = interfaceProfile(metadata)
  expect(claims).toEqual(interfaceProfile(metadata))
  expect(claims.map(claim => claim.rule)).toEqual([
    'surface.tool',
    'surface.schema',
    'ui.declared',
    'effect.hint',
  ])
  expect(
    claims.find(claim => claim.rule === 'ui.declared')?.evidence,
  ).toContain(metadata.uiUri)
  expect(interfaceUnknowns).toContain('Effective permissions and side effects')
  expect(interfaceUnknowns).toContain(
    'Whether a declared view renders or sends anything back',
  )

  expect(
    interfaceProfile({
      name: 'dangerous_persistent_remote_llm',
      inputSchemaJson: '{}',
    }).map(claim => claim.rule),
  ).toEqual(['surface.tool', 'surface.schema'])
})
