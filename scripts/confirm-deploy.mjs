// A small explicit gate for the example's potentially billable cloud action.
// Not an authorization system: humans/agents must still check identity, account and resources.
const approved = process.env.ALLOW_EXPERIMENTAL_DEPLOY === 'yes'
const renamed = process.env.ALCHEMY_STACK_NAME
const slug = /^[a-z][a-z0-9-]{2,39}$/

if (!approved || !renamed || !slug.test(renamed) || renamed === 'mcp-lab') {
  console.error(
    'Deployment blocked: set a unique ALCHEMY_STACK_NAME (3-40 lowercase letters, digits or dashes) and ALLOW_EXPERIMENTAL_DEPLOY=yes after reviewing Cloudflare identity and cost.',
  )
  process.exit(1)
}

if (process.env.CI) {
  console.error(
    'Deployment blocked in CI by this template. Configure a separately reviewed release process if needed.',
  )
  process.exit(1)
}
