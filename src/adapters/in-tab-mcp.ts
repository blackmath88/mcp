import { Effect, type Layer, Option, Schema } from 'effect'

import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

import { RunRecord } from '../domain/capabilities.ts'
import type { Pace } from '../domain/services.ts'
import type { World } from '../domain/world.ts'
import type { Held } from './lab-server.ts'

export const Frame = Schema.Struct({
  direction: Schema.Literals(['client → server', 'server → client']),
  label: Schema.String,
  json: Schema.String,
})
export type Frame = typeof Frame.Type

export const OfferedTool = Schema.Struct({
  name: Schema.String,
  title: Schema.String,
  description: Schema.String,
  readOnly: Schema.Boolean,
})
export type OfferedTool = typeof OfferedTool.Type

const labelOf = (message: unknown): string => {
  if (typeof message !== 'object' || message === null) {
    return 'not a JSON object'
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
  if ('error' in message) {
    const code = Object(message.error).code
    return `error ${typeof code === 'number' ? code : ''}`.trim()
  }
  return 'unrecognised message'
}

type Session = {
  client: Client
  clientWire: Transport
  held: Held
  frames: Array<Frame>
  tools: ReadonlyArray<OfferedTool>
  relisting: Promise<void> | undefined
  nextRawId: number
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

// NOTE: One long-lived MCP session per page: a real SDK client and the lab's
// real server, joined by the SDK's in-memory transport. It is the only mutable
// thing outside the Foldkit model, and every function below hands the model
// the frames, tools and world that resulted.
const session: { current: Promise<Session> | undefined } = {
  current: undefined,
}

const listTools = async (open: Session): Promise<void> => {
  const listed = await open.client.listTools()
  open.tools = listed.tools.map(tool => ({
    name: tool.name,
    title: tool.title ?? tool.name,
    description: tool.description ?? '',
    readOnly: tool.annotations?.readOnlyHint === true,
  }))
}

const connect = async (
  world: World,
  domain: string,
  pace: Layer.Layer<Pace>,
): Promise<Session> => {
  const [{ Client }, { InMemoryTransport }, { createLabServer }, types] =
    await Promise.all([
      import('@modelcontextprotocol/sdk/client/index.js'),
      import('@modelcontextprotocol/sdk/inMemory.js'),
      import('./lab-server.ts'),
      import('@modelcontextprotocol/sdk/types.js'),
    ])
  const frames: Array<Frame> = []
  const held: Held = { world, domain }
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
  const server = createLabServer(held, pace)
  const client = new Client({ name: 'mcp-lab-tab', version: '0.1.0' })
  const clientWire = recording(clientSide, frames, 'client → server')
  const open: Session = {
    client,
    clientWire,
    held,
    frames,
    tools: [],
    relisting: undefined,
    nextRawId: 1000,
  }
  client.setNotificationHandler(types.ToolListChangedNotificationSchema, () => {
    open.relisting = listTools(open)
  })
  client.onerror = () => undefined
  await server.connect(recording(serverSide, frames, 'server → client'))
  await client.connect(clientWire)
  await listTools(open)
  return open
}

const settle = async (open: Session): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 0))
  if (open.relisting !== undefined) {
    const pending = open.relisting
    open.relisting = undefined
    await pending
  }
}

const using = async <A>(
  world: World,
  domain: string,
  pace: Layer.Layer<Pace>,
  use: (open: Session) => Promise<A>,
) => {
  const wasOpen = session.current !== undefined
  session.current ??= connect(world, domain, pace)
  const open = await session.current
  const from = wasOpen ? open.frames.length : 0
  open.held.world = world
  const value = await use(open)
  await settle(open)
  return {
    value,
    world: open.held.world,
    tools: open.tools,
    frames: open.frames.slice(from),
  }
}

const failed = (cause: unknown) =>
  new Error(`The in-tab MCP connection failed: ${String(cause)}`)

export const resetSession = (): void => {
  session.current = undefined
}

export const enterDomain = (
  world: World,
  domain: string,
  pace: Layer.Layer<Pace>,
) =>
  Effect.tryPromise({
    try: () =>
      using(world, domain, pace, async open => {
        if (open.held.domain !== domain) {
          await open.client.callTool({
            name: 'enter_domain',
            arguments: { domain },
          })
        }
      }),
    catch: failed,
  })

export const runOverMcp = (
  world: World,
  domain: string,
  name: string,
  input: unknown,
  pace: Layer.Layer<Pace>,
) =>
  Effect.tryPromise({
    try: async () => {
      const done = await using(world, domain, pace, open =>
        open.client.callTool({ name, arguments: Object(input) }),
      )
      return {
        record: Option.getOrThrow(
          Schema.decodeUnknownOption(RunRecord)(done.value.structuredContent),
        ),
        world: done.world,
        frames: done.frames,
        tools: done.tools,
      }
    },
    catch: failed,
  })

const RAW_REPLY_WAIT_MILLISECONDS = 400
const noFrames: ReadonlyArray<Frame> = []
const noTools: ReadonlyArray<OfferedTool> = []

// NOTE: Sends whatever JSON the person wrote straight onto the wire, past the
// SDK client's own checks, and reports what the real server did with it.
export const sendRaw = (
  world: World,
  domain: string,
  text: string,
  pace: Layer.Layer<Pace>,
) =>
  Effect.tryPromise({
    try: async () => {
      const parsed = Option.liftThrowable((source: string): unknown =>
        JSON.parse(source),
      )(text)
      if (Option.isNone(parsed)) {
        return {
          note: 'This is not valid JSON, so it never left the client. Nothing was sent.',
          record: Option.none<RunRecord>(),
          world,
          frames: noFrames,
          tools: noTools,
          sent: false,
        }
      }
      const done = await using(world, domain, pace, async open => {
        const before = open.frames.length
        // The transport type wants a protocol message; the point here is to
        // send things that are not one.
        await open.clientWire.send(Object(parsed.value))
        const deadline = Date.now() + RAW_REPLY_WAIT_MILLISECONDS
        const waitForReply = async (): Promise<void> => {
          const replied = open.frames
            .slice(before)
            .some(frame => frame.direction === 'server → client')
          if (replied || Date.now() > deadline) {
            return
          }
          await new Promise(resolve => setTimeout(resolve, 10))
          return waitForReply()
        }
        await waitForReply()
        return open.frames.slice(before)
      })
      const reply = done.value
        .filter(frame => frame.direction === 'server → client')
        .at(-1)
      const record =
        reply === undefined
          ? Option.none<RunRecord>()
          : Schema.decodeUnknownOption(RunRecord)(
              Object(Object(JSON.parse(reply.json)).result).structuredContent,
            )
      return {
        note:
          reply === undefined
            ? `Sent. The server did not answer within ${RAW_REPLY_WAIT_MILLISECONDS} ms. Without "jsonrpc", "id" and "method" together it is not a request, so nothing is owed a reply.`
            : reply.label.startsWith('error')
              ? 'Sent. The server answered with a protocol error.'
              : Option.isSome(record)
                ? 'Sent. The server ran the tool and answered. The lab state follows what it returned.'
                : 'Sent. The server answered.',
        record,
        world: done.world,
        frames: done.frames,
        tools: done.tools,
        sent: true,
      }
    },
    catch: failed,
  })
