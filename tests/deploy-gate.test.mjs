import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'

const guard = path.join(path.dirname(fileURLToPath(import.meta.url)), '../scripts/confirm-deploy.mjs')
const baseEnv = { ...process.env }
delete baseEnv.ALCHEMY_STACK_NAME
delete baseEnv.ALLOW_EXPERIMENTAL_DEPLOY
delete baseEnv.CI

const check = env => spawnSync(process.execPath, [guard], {
  env: { ...baseEnv, ...env },
  encoding: 'utf8',
})

test('cannot deploy without explicit permission', () => {
  assert.equal(check({}).status, 1)
})

test('cannot use unchanged template name for deployment', () => {
  assert.equal(check({ ALLOW_EXPERIMENTAL_DEPLOY: 'yes', ALCHEMY_STACK_NAME: 'mcp-lab' }).status, 1)
})

test('unique approved names pass the local guard but do not deploy', () => {
  assert.equal(check({ ALLOW_EXPERIMENTAL_DEPLOY: 'yes', ALCHEMY_STACK_NAME: 'test-project-123' }).status, 0)
})

test('CI remains blocked even with explicit variables', () => {
  assert.equal(check({ CI: 'true', ALLOW_EXPERIMENTAL_DEPLOY: 'yes', ALCHEMY_STACK_NAME: 'test-project-123' }).status, 1)
})
