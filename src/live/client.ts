import { Schema } from 'effect'

import { Reply, type Request } from './contract.ts'
import { apiPath } from './specimens.ts'

const decodeReply = Schema.decodeUnknownSync(Reply)
const sessionKey = 'mcp-lab:active-session'

async function send(request: Request, signal?: AbortSignal): Promise<Reply> {
  const response = await fetch(apiPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: signal ?? null,
  })
  if (!response.headers.get('content-type')?.startsWith('application/json')) {
    throw new Error(
      'The local specimen host is unavailable. Use npm run dev or npm run preview.',
    )
  }
  const body: unknown = await response.json()
  return decodeReply(body)
}

function rememberedSession(): string | null {
  try {
    return window.sessionStorage.getItem(sessionKey)
  } catch {
    return null
  }
}

function remember(sessionId: string | null) {
  try {
    if (sessionId === null) {
      window.sessionStorage.removeItem(sessionKey)
    } else {
      window.sessionStorage.setItem(sessionKey, sessionId)
    }
  } catch {
    // The session still works when tab storage is disabled.
  }
}

export async function requestSpecimen(
  request: Request,
  signal?: AbortSignal,
): Promise<Reply> {
  if (request._tag === 'Connect') {
    const previous = rememberedSession()
    if (previous) {
      await send({ _tag: 'Close', sessionId: previous }, signal)
    }
    const reply = await send(request, signal)
    if (reply.session?.state === 'ready') {
      remember(reply.session.id)
    }
    return reply
  }
  const reply = await send(request, signal)
  if (
    request._tag === 'Close' &&
    rememberedSession() === request.sessionId &&
    !reply.error
  ) {
    remember(null)
  }
  return reply
}

export function releaseOnExit(sessionId: string, navigator: Navigator) {
  const request: Request = { _tag: 'Close', sessionId }
  navigator.sendBeacon(
    apiPath,
    new Blob([JSON.stringify(request)], { type: 'application/json' }),
  )
}
