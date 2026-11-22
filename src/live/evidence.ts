import { Clock, Effect } from 'effect'

import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js'

import type { Evidence } from './contract.ts'

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

export const formatEvidence = (value: unknown): string => {
  const detail =
    JSON.stringify(
      value,
      (key, item: unknown) => {
        if (typeof item !== 'string') {
          return item
        }
        if (
          key === 'html' ||
          (key === 'text' && /^\s*<!doctype html/i.test(item))
        ) {
          return `[HTML resource · ${item.length} characters]`
        }
        return item.length > 2_000 ? `${item.slice(0, 2_000)}… [excerpt]` : item
      },
      2,
    ) ?? ''
  return detail.length > 24_000
    ? `${detail.slice(0, 24_000)}\n… [excerpt]`
    : detail
}

export function createEvidence(channel: Evidence['channel'], limit = 100) {
  const events: Array<Evidence> = []
  let seq = 0
  const record = (
    direction: Evidence['direction'],
    label: string,
    payload: unknown,
    eventChannel = channel,
  ) => {
    seq += 1
    const entry = {
      seq,
      at: new Date(Effect.runSync(Clock.currentTimeMillis)).toISOString(),
      channel: eventChannel,
      direction,
      label,
      detail: formatEvidence(payload),
    }
    events.push(entry)
    if (events.length > limit) {
      events.shift()
    }
    return entry
  }

  return {
    record,
    snapshot: () => ({
      events: [...events],
      dropped: Math.max(0, seq - events.length),
    }),
    lastSequence: () => seq,
  }
}

export const frameLabel = (message: JSONRPCMessage): string => {
  if ('method' in message) {
    return 'id' in message ? `${message.method} #${message.id}` : message.method
  }
  return `${'error' in message ? 'Error' : 'Response'} #${message.id}`
}

export function observeTransport(
  source: Transport,
  observe: (direction: 'in' | 'out', message: JSONRPCMessage) => void,
): Transport {
  const transport: Transport = {
    start: () => {
      source.onmessage = (message, extra) => {
        observe('in', message)
        transport.onmessage?.(message, extra)
      }
      source.onerror = error => transport.onerror?.(error)
      source.onclose = () => transport.onclose?.()
      return source.start()
    },
    send: (message, options) => {
      const sending = source.send(message, options)
      observe('out', message)
      return sending
    },
    close: () => source.close(),
  }
  return transport
}
