import { Schema } from 'effect'

import { Reply, type Request } from './contract.ts'
import { apiPath } from './specimens.ts'

const decodeReply = Schema.decodeUnknownSync(Reply)

export async function requestSpecimen(
  request: Request,
  signal?: AbortSignal,
): Promise<Reply> {
  const response = await fetch(apiPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: signal ?? null,
    keepalive: request._tag === 'Close',
  })
  if (!response.headers.get('content-type')?.startsWith('application/json')) {
    throw new Error(
      'The local specimen host is unavailable. Use npm run dev or npm run preview.',
    )
  }
  const body: unknown = await response.json()
  return decodeReply(body)
}
