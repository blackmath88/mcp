import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { Pace } from '../domain/services.ts'
import { applySettings } from '../domain/settings.ts'
import {
  CALM_MAX_SPAN,
  STORM_MAX_SPAN,
  seedWorld,
  useGatewayBuild,
} from '../domain/world.ts'
import { createLabServer } from './lab-server.ts'

// NOTE: This process is the MCP adapter. The world lives in this process's
// memory for the lifetime of the connection; nothing is shared with the CLI
// or the browser.
const seeded = seedWorld(
  process.argv.includes('--storm') ? STORM_MAX_SPAN : CALM_MAX_SPAN,
  process.argv.includes('--policy=first-hop')
    ? 'first-hop'
    : process.argv.includes('--policy=none')
      ? 'none'
      : 'every-hop',
  process.argv.includes('--memory-path=home') ? 'home' : 'package-cache',
  process.argv.includes('--thinking=compute')
    ? 'compute'
    : process.argv.includes('--thinking=consult')
      ? 'consult'
      : 'record',
  process.argv.includes('--fs-build=confine')
    ? 'confine'
    : process.argv.includes('--fs-build=pre-fix')
      ? 'pre-fix'
      : 'default',
  process.argv.includes('--perception=vision') ? 'vision' : 'snapshot',
)

const held = {
  world: applySettings(
    process.argv.includes('--gateway=per-connection')
      ? useGatewayBuild(seeded, 'per-connection')
      : seeded,
    process.argv.flatMap(argument =>
      argument.startsWith('--set=') ? [argument.slice('--set='.length)] : [],
    ),
  ),
}

const server = createLabServer(held, Pace.unpaced)

await server.connect(new StdioServerTransport())
