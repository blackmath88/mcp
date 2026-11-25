import { Effect } from 'effect'

// NOTE: Asks a real MCP server, at a URL the person typed, for its tool list
// and nothing else: initialize, tools/list, close. No tool is called. The
// browser makes the request, so the server must allow this page's origin
// (CORS), and a server that needs a login will refuse.

export type RemoteListing = Readonly<{ json: string; tools: number }>

const reasonOf = (cause: unknown): string => {
  const text = String(cause)
  return /Failed to fetch|NetworkError|Load failed|CORS/i.test(text)
    ? 'The browser could not reach it. Most often the server does not allow requests from this page (CORS), or the address is wrong.'
    : /401|403|unauthori[sz]ed|forbidden/i.test(text)
      ? 'The server asked for a login. This page does not sign in anywhere.'
      : `The server did not answer as an MCP server: ${text}`
}

export const listRemoteTools = (address: string) =>
  Effect.tryPromise({
    try: async (): Promise<RemoteListing> => {
      const url = new URL(address)
      if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
        throw new Error('Only https addresses, or localhost, are accepted.')
      }
      const [{ Client }, { StreamableHTTPClientTransport }] = await Promise.all(
        [
          import('@modelcontextprotocol/sdk/client/index.js'),
          import('@modelcontextprotocol/sdk/client/streamableHttp.js'),
        ],
      )
      const client = new Client({ name: 'mcp-lab-inspect', version: '0.1.0' })
      const transport = new StreamableHTTPClientTransport(url)
      await client.connect(transport)
      try {
        const listed = await client.listTools()
        return {
          json: JSON.stringify({ tools: listed.tools }, null, 2),
          tools: listed.tools.length,
        }
      } finally {
        await client.close()
      }
    },
    catch: cause =>
      new Error(
        cause instanceof Error &&
          cause.message.startsWith('Only https addresses')
          ? cause.message
          : reasonOf(cause),
      ),
  })
