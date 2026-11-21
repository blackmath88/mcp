// @vitest-environment node
import { Effect } from 'effect'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

import { catalogue, runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import { CALM_MAX_SPAN, seedWorld } from '../domain/world.ts'
import recording from '../recordings/entrances.json'

const here = fileURLToPath(new URL('.', import.meta.url))
const cliPath = join(here, 'cli.ts')
const serverPath = join(here, 'mcp-server.ts')

const cli = (...args: ReadonlyArray<string>) =>
  spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8' })

const connect = ['connect_places', '--from', 'forge', '--to', 'dock']

const inProcessRecord = Effect.runSync(
  runOn(seedWorld(CALM_MAX_SPAN), 'connect_places', {
    from: 'forge',
    to: 'dock',
  }).pipe(Effect.provide(Pace.unpaced)),
).record

const withClient = async <A>(
  serverArgs: ReadonlyArray<string>,
  use: (client: Client) => Promise<A>,
): Promise<A> => {
  const client = new Client({ name: 'mcp-lab-test', version: '0.1.0' })
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [serverPath, ...serverArgs],
    }),
  )
  try {
    return await use(client)
  } finally {
    await client.close()
  }
}

describe('CLI adapter', () => {
  test('lists the catalogue', () => {
    const listed = cli('list')
    expect(listed.status).toBe(0)
    catalogue.forEach(capability => {
      expect(listed.stdout).toContain(capability.name)
    })
  })

  test('executes the operation and matches the in-process record', () => {
    const run = cli(...connect, '--json')
    expect(run.status).toBe(0)
    expect(JSON.parse(run.stdout)).toEqual(inProcessRecord)
  })

  test('exits 1 with the domain failure in a storm', () => {
    const run = cli(...connect, '--storm', '--json')
    expect(run.status).toBe(1)
    expect(JSON.parse(run.stdout).outcome).toMatchObject({
      _tag: 'Failed',
      error: 'PathTooLong',
    })
  })

  test('keeps the world between runs when given a state file', () => {
    const state = join(mkdtempSync(join(tmpdir(), 'mcp-lab-')), 'world.json')
    expect(cli(...connect, '--state', state).status).toBe(0)
    const route = cli(
      'find_route',
      '--from',
      'forge',
      '--to',
      'dock',
      '--state',
      state,
      '--json',
    )
    expect(JSON.parse(route.stdout).outcome).toMatchObject({
      output: { route: { places: ['forge', 'mill', 'kiln', 'dock'] } },
    })
    expect(JSON.parse(readFileSync(state, 'utf8')).revision).toBe(1)
  })
})

describe('MCP adapter over stdio, driven by the SDK client', () => {
  test('lists the same catalogue as tools', async () => {
    const tools = await withClient([], client => client.listTools())
    expect(tools.tools.map(tool => tool.name)).toEqual(
      catalogue.map(capability => capability.name),
    )
    expect(
      tools.tools.find(tool => tool.name === 'build_path')?.annotations,
    ).toEqual({ readOnlyHint: false })
  })

  test('tools/call runs the shared engine: same record as CLI and in-process', async () => {
    const result = await withClient([], client =>
      client.callTool({
        name: 'connect_places',
        arguments: { from: 'forge', to: 'dock' },
      }),
    )
    expect(result.isError).toBe(false)
    expect(result.structuredContent).toEqual(inProcessRecord)
    expect(result.structuredContent).toEqual(
      JSON.parse(cli(...connect, '--json').stdout),
    )
  })

  test('a domain failure comes back as isError with the same diagnosis', async () => {
    const result = await withClient(['--storm'], client =>
      client.callTool({
        name: 'connect_places',
        arguments: { from: 'forge', to: 'dock' },
      }),
    )
    expect(result.isError).toBe(true)
    expect(result.structuredContent).toMatchObject({
      outcome: { error: 'PathTooLong' },
      revisionAfter: 0,
    })
  })

  test('state persists across calls on one connection and the map is a resource', async () => {
    const map = await withClient([], async client => {
      await client.callTool({
        name: 'build_path',
        arguments: { from: 'mill', to: 'archive' },
      })
      return client.readResource({ uri: 'valley://map/current' })
    })
    const [content] = map.contents
    expect(
      JSON.parse(
        content !== undefined && 'text' in content ? content.text : '{}',
      ),
    ).toMatchObject({ revision: 1 })
  })
})

describe('fetch specimen through both entrances', () => {
  const notice = 'https://valley.test/notice'

  test('CLI: the policy flag changes the outcome of the same URL', () => {
    expect(cli('fetch_page', '--url', notice).status).toBe(1)
    const lenient = cli(
      'fetch_page',
      '--url',
      notice,
      '--policy',
      'first-hop',
      '--json',
    )
    expect(lenient.status).toBe(0)
    expect(JSON.parse(lenient.stdout).outcome.output.finalUrl).toBe(
      'https://valley.test/ledger',
    )
  })

  test('MCP: same tool name and schema, different server policy, different result', async () => {
    const call = (client: Client) =>
      client.callTool({ name: 'fetch_page', arguments: { url: notice } })
    const strict = await withClient([], call)
    const lenient = await withClient(['--policy=first-hop'], call)
    expect(strict.isError).toBe(true)
    expect(lenient.isError).toBe(false)
    expect(lenient.structuredContent).toMatchObject({
      outcome: { output: { finalUrl: 'https://valley.test/ledger' } },
    })
  })
})

describe('memory and thinking through MCP', () => {
  test('memory persists across calls on one connection and is gone on the next', async () => {
    const fact = { entity: 'Workshop A', observation: 'belongs to Team Blue' }
    const same = await withClient([], async client => {
      await client.callTool({ name: 'remember', arguments: fact })
      return client.callTool({
        name: 'recall',
        arguments: { entity: fact.entity },
      })
    })
    const later = await withClient([], client =>
      client.callTool({ name: 'recall', arguments: { entity: fact.entity } }),
    )
    expect(same.structuredContent).toMatchObject({
      outcome: { output: { observations: ['belongs to Team Blue'] } },
    })
    expect(later.structuredContent).toMatchObject({
      outcome: { output: { observations: [] } },
    })
  })

  test('the same plan_steps schema hides different builds', async () => {
    const call = (client: Client) =>
      client.callTool({
        name: 'plan_steps',
        arguments: { from: 'forge', to: 'mill', thoughts: ['Go.'] },
      })
    const recorded = await withClient([], call)
    const computed = await withClient(['--thinking=compute'], call)
    expect(recorded.structuredContent).toMatchObject({
      outcome: { output: { madeBy: 'the caller' } },
    })
    expect(computed.structuredContent).toMatchObject({
      outcome: { output: { steps: ['Walk forge → mill.'] } },
    })
  })
})

describe('recording shown in the lab', () => {
  test('carries its provenance and a real handshake', () => {
    expect(recording.mcpSdk).toMatch(/^\d+\.\d+\.\d+$/)
    expect(recording.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(recording.calm.mcp[0]).toMatchObject({
      direction: 'client → server',
      message: { method: 'initialize' },
    })
  })

  test('still matches what the engine does today', () => {
    expect(recording.calm.cli.stdout).toEqual(inProcessRecord)
  })
})
