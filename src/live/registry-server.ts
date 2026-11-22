import { Agent, get } from 'node:https'
import { z } from 'zod'

import type { Reply } from './contract.ts'
import { createEvidence, errorMessage } from './evidence.ts'

const officialRegistry = 'https://registry.modelcontextprotocol.io/v0.1/servers'

const RegistryPage = z.object({
  servers: z.array(
    z.object({
      server: z.object({
        name: z.string(),
        version: z.string(),
        description: z.string().optional(),
        packages: z.array(z.object({ identifier: z.string() })).optional(),
        remotes: z.array(z.object({ url: z.string() })).optional(),
      }),
    }),
  ),
  metadata: z.object({ nextCursor: z.string().optional() }).optional(),
})

type RegistryResponse = Readonly<{ status: number; body: string }>
type RequestRegistry = (url: URL) => Promise<RegistryResponse>

const agent = new Agent({ proxyEnv: process.env })

const requestRegistry: RequestRegistry = url =>
  new Promise((resolve, reject) => {
    const request = get(
      url,
      {
        agent,
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      },
      response => {
        const status = response.statusCode ?? 0
        if (status !== 200) {
          response.resume()
          resolve({ status, body: '' })
          return
        }
        let size = 0
        const chunks: Array<Buffer> = []
        response.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > 512_000) {
            response.destroy(
              new Error('The registry response exceeded 512 KB.'),
            )
          } else {
            chunks.push(chunk)
          }
        })
        response.on('error', reject)
        response.on('end', () =>
          resolve({ status, body: Buffer.concat(chunks).toString('utf8') }),
        )
      },
    )
    request.on('error', reject)
  })

export async function searchRegistry(
  query: string,
  request = requestRegistry,
): Promise<Reply> {
  const evidence = createEvidence('Registry REST')
  const search = query.trim()
  if (search.length < 3 || search.length > 120) {
    return {
      ...evidence.snapshot(),
      error: 'Enter a registry query of 3–120 characters.',
    }
  }
  const url = new URL(officialRegistry)
  url.search = new URLSearchParams({
    search,
    version: 'latest',
    limit: '8',
  }).toString()
  evidence.record('out', 'GET /v0.1/servers', { url: url.href })
  try {
    const response = await request(url)
    evidence.record('in', `HTTP ${response.status}`, {
      bytes: Buffer.byteLength(response.body),
    })
    if (response.status !== 200) {
      throw new Error(`The official registry returned HTTP ${response.status}.`)
    }
    const page = RegistryPage.parse(JSON.parse(response.body))
    const entries = page.servers.map(({ server }) => ({
      name: server.name,
      version: server.version,
      description: server.description ?? '',
      packages: server.packages?.map(item => item.identifier) ?? [],
      remotes: server.remotes?.map(item => item.url) ?? [],
    }))
    evidence.record(
      'local',
      'Registry records decoded',
      { entries, nextCursor: page.metadata?.nextCursor },
      'Host',
    )
    return {
      ...evidence.snapshot(),
      registry: { entries, partial: Boolean(page.metadata?.nextCursor) },
    }
  } catch (error) {
    const message = errorMessage(error)
    evidence.record('local', 'Registry search failed', message, 'Host')
    return { ...evidence.snapshot(), error: message }
  }
}
