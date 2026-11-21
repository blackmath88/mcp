import { Effect, Schema } from 'effect'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { parseArgs } from 'node:util'

import { catalogue, runOn } from '../domain/capabilities.ts'
import { Pace } from '../domain/services.ts'
import {
  CALM_MAX_SPAN,
  FetchPolicy,
  FsBuild,
  GatewayBuild,
  Perception,
  STORM_MAX_SPAN,
  StoragePath,
  ThinkingMode,
  World,
  applyRootsUpdate,
  reinstallPackage,
  seedWorld,
  useGatewayBuild,
  useServerSchema,
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
  --path <p>      file for read_file, e.g. /valley/mill/ledger.txt
  --roots <a,b>   client roots update applied before the run; empty string revokes
  --fs-build <b>  default, confine or pre-fix
  --target <t>    control for click: gate, lever, valve, bell
  --perception <m>  snapshot (default) or vision
  --server-schema <n>  crate server schema for station 06: 1 or 2
  --gateway <b>   shared or per-connection (applies when the world is created)
  --client <c> --place <p>  input for go_to; --client alone for where_am_i
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
    path: { type: 'string' },
    roots: { type: 'string' },
    'fs-build': { type: 'string' },
    target: { type: 'string' },
    perception: { type: 'string' },
    'server-schema': { type: 'string' },
    gateway: { type: 'string' },
    client: { type: 'string' },
    place: { type: 'string' },
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
        Schema.decodeUnknownSync(FsBuild)(values['fs-build'] ?? 'default'),
        Schema.decodeUnknownSync(Perception)(values.perception ?? 'snapshot'),
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
  values.client !== undefined
    ? { client: values.client, place: values.place }
    : values.path !== undefined
      ? { path: values.path }
      : values.target !== undefined
        ? { target: values.target }
        : values.entity !== undefined
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
const upgraded =
  values['server-schema'] === undefined
    ? moved
    : useServerSchema(moved, Number(values['server-schema']))
const bridged =
  values.gateway === undefined || existsSync(values.state ?? '')
    ? upgraded
    : useGatewayBuild(
        upgraded,
        Schema.decodeUnknownSync(GatewayBuild)(values.gateway),
      )
const reinstalled = values.reinstall ? reinstallPackage(bridged) : bridged
const startWorld =
  values.roots === undefined
    ? reinstalled
    : applyRootsUpdate(
        reinstalled,
        values.roots === '' ? [] : values.roots.split(','),
      )

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
