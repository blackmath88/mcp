import { Schema } from 'effect'

import { Reply, type Request } from './contract.ts'
import { apiPath } from './specimens.ts'

const decodeReply = Schema.decodeUnknownSync(Reply)
const sessionKey = 'mcp-lab:exited-session'
const releaseListeners = new Map<string, AbortController>()

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
      const closed = await send({ _tag: 'Close', sessionId: previous }, signal)
      if (!closed.error) {
        remember(null)
      }
    }
    const reply = await send(request, signal)
    if (reply.session?.state === 'ready') {
      trackSessionExit(reply.session.id)
    }
    return reply
  }
  const reply = await send(request, signal)
  if (request._tag === 'Close' && !reply.error) {
    untrackSessionExit(request.sessionId)
    if (rememberedSession() === request.sessionId) {
      remember(null)
    }
  }
  return reply
}

function trackSessionExit(sessionId: string) {
  const lifetime = new AbortController()
  releaseListeners.set(sessionId, lifetime)
  window.addEventListener(
    'pagehide',
    event => {
      if (!event.persisted) {
        remember(sessionId)
        const request: Request = { _tag: 'Close', sessionId }
        window.navigator.sendBeacon(
          apiPath,
          new Blob([JSON.stringify(request)], { type: 'application/json' }),
        )
        untrackSessionExit(sessionId)
      }
    },
    { capture: true, signal: lifetime.signal },
  )
}

function untrackSessionExit(sessionId: string) {
  releaseListeners.get(sessionId)?.abort()
  releaseListeners.delete(sessionId)
}
