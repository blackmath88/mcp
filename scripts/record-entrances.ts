// Runs the CLI and the MCP stdio server for real and writes what crossed the
// boundary to src/recordings/entrances.json. The lab shows that file as a
// recorded external execution; it is never fabricated in the browser.
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

const root = fileURLToPath(new URL('..', import.meta.url))
const cliPath = `${root}src/adapters/cli.ts`
const serverPath = `${root}src/adapters/mcp-server.ts`
const sdkVersion = JSON.parse(
  readFileSync(
    `${root}node_modules/@modelcontextprotocol/sdk/package.json`,
    'utf8',
  ),
).version

type Frame = {
  direction: 'client → server' | 'server → client'
  message: unknown
}

const recordMcp = async (storm: boolean) => {
  const frames: Array<Frame> = []
  const inner = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath, ...(storm ? ['--storm'] : [])],
  })
  const recording: Transport = {
    start: () => inner.start(),
    close: () => inner.close(),
    send: message => {
      frames.push({ direction: 'client → server', message })
      return inner.send(message)
    },
  }
  inner.onmessage = message => {
    frames.push({ direction: 'server → client', message })
    recording.onmessage?.(message)
  }
  inner.onclose = () => recording.onclose?.()
  inner.onerror = error => recording.onerror?.(error)
  const client = new Client({ name: 'mcp-lab-recorder', version: '0.1.0' })
  await client.connect(recording)
  await client.listTools()
  await client.callTool({
    name: 'connect_places',
    arguments: { from: 'forge', to: 'dock' },
  })
  await client.close()
  return frames
}

const recordCli = (storm: boolean) => {
  const args = [
    'connect_places',
    '--from',
    'forge',
    '--to',
    'dock',
    ...(storm ? ['--storm'] : []),
    '--json',
  ]
  const run = spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
  })
  return {
    command: `npm run lab -- ${args.join(' ')}`,
    exitCode: run.status,
    stdout: JSON.parse(run.stdout),
  }
}

const calm = await recordMcp(false)
const storm = await recordMcp(true)

writeFileSync(
  `${root}src/recordings/entrances.json`,
  `${JSON.stringify(
    {
      recordedAt: new Date().toISOString(),
      node: process.version,
      mcpSdk: sdkVersion,
      calm: { cli: recordCli(false), mcp: calm },
      storm: { cli: recordCli(true), mcp: storm },
    },
    null,
    2,
  )}\n`,
)
console.log('wrote src/recordings/entrances.json')
