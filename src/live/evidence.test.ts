import { expect, it, vi } from 'vitest'

import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

import { observeTransport } from './evidence.ts'

it('keeps rejected writes out of the completed protocol trace', async () => {
  const frame = { jsonrpc: '2.0', method: 'tools/list', id: 1 } as const
  const record = vi.fn()
  const source: Transport = {
    start: async () => {},
    send: async () => {
      throw new Error('stdio write failed')
    },
    close: async () => {},
  }
  const transport = observeTransport(source, record)
  await transport.start()

  await expect(transport.send(frame)).rejects.toThrow('stdio write failed')
  expect(record).not.toHaveBeenCalled()

  source.send = async () => {}
  await transport.send(frame)
  expect(record).toHaveBeenCalledExactlyOnceWith('out', frame)
})
