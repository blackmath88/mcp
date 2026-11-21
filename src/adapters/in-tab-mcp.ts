import { Effect, type Layer, Schema } from 'effect'

import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

import { RunRecord } from '../domain/capabilities.ts'
import type { Pace } from '../domain/services.ts'
import type { World } from '../domain/world.ts'

export const Frame = Schema.Struct({
  direction: Schema.Literals(['client → server', 'server → client']),
  label: Schema.String,
  json: Schema.String,
})
export type Frame = typeof Frame.Type

const labelOf = (message: unknown): string => {
  if (typeof message !== 'object' || message === null) {
    return 'message'
  }
  if ('method' in message && typeof message.method === 'string') {
    return message.method
  }
  if ('result' in message) {
    return 'isError' in Object(message.result) &&
      Object(message.result).isError === true
      ? 'result · isError: true'
      : 'result'
  }
  return 'error'
}

const recording = (
  inner: Transport,
  frames: Array<Frame>,
  outgoing: Frame['direction'],
): Transport => {
  const outer: Transport = {
    start: () => inner.start(),
    close: () => inner.close(),
    send: message => {
      frames.push({
        direction: outgoing,
        label: labelOf(message),
        json: JSON.stringify(message, null, 2),
      })
      return inner.send(message)
    },
  }
  inner.onmessage = message => outer.onmessage?.(message)
  inner.onclose = () => outer.onclose?.()
  inner.onerror = error => outer.onerror?.(error)
  return outer
}

// NOTE: A real MCP client and a real MCP server, both in this JavaScript
// context, joined by the SDK's in-memory transport. Nothing crosses a network.
// The SDK is imported on demand so it only loads when a run needs it.
const connectAndCall = async (
  world: World,
  name: string,
  input: unknown,
  pace: Layer.Layer<Pace>,
) => {
  const [{ Client }, { InMemoryTransport }, { createLabServer }] =
    await Promise.all([
      import('@modelcontextprotocol/sdk/client/index.js'),
      import('@modelcontextprotocol/sdk/inMemory.js'),
      import('./lab-server.ts'),
    ])
  const frames: Array<Frame> = []
  const held = { world }
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  const server = createLabServer(held, pace)
  const client = new Client({ name: 'mcp-lab-tab', version: '0.1.0' })
  await server.connect(recording(serverSide, frames, 'server → client'))
  await client.connect(recording(clientSide, frames, 'client → server'))
  const result = await client.callTool({
    name,
    arguments: Object(input),
  })
  await client.close()
  return {
    record: Schema.decodeUnknownSync(RunRecord)(result.structuredContent),
    world: held.world,
    frames,
  }
}

export const runOverMcp = (
  world: World,
  name: string,
  input: unknown,
  pace: Layer.Layer<Pace>,
) =>
  Effect.tryPromise({
    try: () => connectAndCall(world, name, input, pace),
    catch: cause =>
      new Error(`The in-tab MCP connection failed: ${String(cause)}`),
  })
