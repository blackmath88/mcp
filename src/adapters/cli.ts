import { Effect, Schema } from 'effect'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { parseArgs } from 'node:util'

import { catalogue, runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import {
  CALM_MAX_SPAN,
  FetchPolicy,
  STORM_MAX_SPAN,
  StoragePath,
  ThinkingMode,
  World,
  reinstallPackage,
  seedWorld,
  useStoragePath,
} from '../domain/world.ts'
import { catalogueText, recordText } from './text.ts'

const usage = `Usage: lab <capability> [--from <place>] [--to <place>] [options]
       lab list

Options:
  --url <url>     the page for fetch_page, e.g. https://valley.test/notice
  --policy <p>    robots policy for fetch_page: every-hop (default), first-hop, none
  --entity <e> --observation <o>   input for remember; --entity alone for recall
  --memory-path <p>  package-cache (default) or home
  --reinstall     simulate reinstalling the package: wipes the package cache first
  --thinking <m>  plan_steps build: record (default), compute, consult
  --thought <t>   a caller thought for plan_steps; repeatable
  --storm         start from the storm world (span limit ${STORM_MAX_SPAN} instead of ${CALM_MAX_SPAN})
  --state <file>  keep the world in this file between runs (default: a fresh world each run)
  --json          print the full run record as JSON

This is the CLI adapter of the MCP Lab engine. It runs the same domain code as the browser and the MCP server.`

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    from: { type: 'string' },
    to: { type: 'string' },
    url: { type: 'string' },
    policy: { type: 'string' },
    entity: { type: 'string' },
    observation: { type: 'string' },
    thought: { type: 'string', multiple: true },
    'memory-path': { type: 'string' },
    thinking: { type: 'string' },
    reinstall: { type: 'boolean', default: false },
    storm: { type: 'boolean', default: false },
    state: { type: 'string' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
})

const loadWorld = (statePath: string | undefined, storm: boolean): World =>
  statePath !== undefined && existsSync(statePath)
    ? Schema.decodeUnknownSync(World)(
        JSON.parse(readFileSync(statePath, 'utf8')),
      )
    : seedWorld(
        storm ? STORM_MAX_SPAN : CALM_MAX_SPAN,
        Schema.decodeUnknownSync(FetchPolicy)(values.policy ?? 'every-hop'),
        Schema.decodeUnknownSync(StoragePath)(
          values['memory-path'] ?? 'package-cache',
        ),
        Schema.decodeUnknownSync(ThinkingMode)(values.thinking ?? 'record'),
      )

const saveWorld = (statePath: string | undefined, world: World): void => {
  if (statePath !== undefined) {
    mkdirSync(dirname(statePath), { recursive: true })
    writeFileSync(statePath, `${JSON.stringify(world, null, 2)}\n`)
  }
}

const [command] = positionals

if (values.help || command === undefined) {
  console.log(usage)
  process.exit(command === undefined && !values.help ? 2 : 0)
}

if (command === 'list') {
  console.log(
    values.json ? JSON.stringify(catalogue, null, 2) : catalogueText(catalogue),
  )
  process.exit(0)
}

const input =
  values.entity !== undefined
    ? { entity: values.entity, observation: values.observation }
    : values.thought !== undefined
      ? { from: values.from, to: values.to, thoughts: values.thought }
      : values.url !== undefined
        ? { url: values.url }
        : values.from === undefined && values.to === undefined
          ? {}
          : { from: values.from, to: values.to }

const loaded = loadWorld(values.state, values.storm)
const moved =
  values['memory-path'] === undefined
    ? loaded
    : useStoragePath(
        loaded,
        Schema.decodeUnknownSync(StoragePath)(values['memory-path']),
      )
const startWorld = values.reinstall ? reinstallPackage(moved) : moved

const result = await Effect.runPromise(
  runOn(startWorld, command, input).pipe(Effect.provide(Pace.unpaced)),
)

saveWorld(values.state, result.world)

console.log(
  values.json
    ? JSON.stringify(result.record, null, 2)
    : recordText(result.record),
)
process.exit(result.record.outcome._tag === 'Succeeded' ? 0 : 1)
