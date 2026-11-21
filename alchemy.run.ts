import * as Alchemy from 'alchemy'
import * as Effect from 'effect/Effect'

import * as Cloudflare from '@alchemy.run/cloudflare'

// This example only provisions the website. No database or API credentials are required.
// Rename the stack and npm package before the first remote deployment.
export const Website = Cloudflare.Website.Foldkit('Web')
export type WebsiteEnv = Cloudflare.InferEnv<typeof Website>

export default Alchemy.Stack(
  process.env.ALCHEMY_STACK_NAME ?? 'mcp-lab',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const site = yield* Website
    return { url: site.url }
  }),
)
