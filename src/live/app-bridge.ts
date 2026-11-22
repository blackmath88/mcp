import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import {
  CallToolResultSchema,
  JSONRPCMessageSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { requestSpecimen } from './client.ts'
import {
  type AppResource,
  type Evidence,
  type Reply,
  Request,
} from './contract.ts'
import {
  createEvidence,
  errorMessage,
  frameLabel,
  observeTransport,
} from './evidence.ts'
import { hostName, hostVersion } from './specimens.ts'

type BridgeCallbacks = Readonly<{
  observed: (entry: Evidence) => void
  initialized: () => void
  failed: (error: string) => void
  called: (reply: Reply) => void
}>

function sandboxTransport(target: Window, origin: string): Transport {
  const receive = (event: MessageEvent<unknown>) => {
    if (event.source !== target || event.origin !== origin) {
      return
    }
    const frame = JSONRPCMessageSchema.safeParse(event.data)
    if (frame.success) {
      transport.onmessage?.(frame.data)
    } else {
      transport.onerror?.(new Error('The app sent invalid JSON-RPC.'))
    }
  }
  const transport: Transport = {
    start: async () => window.addEventListener('message', receive),
    send: async message => target.postMessage(message, origin),
    close: async () => {
      window.removeEventListener('message', receive)
      transport.onclose?.()
    },
  }
  return transport
}

export function connectApp(
  host: Element,
  resource: AppResource,
  sessionId: string,
  callbacks: BridgeCallbacks,
) {
  const sandbox = new URL(resource.sandboxUrl)
  if (
    sandbox.protocol !== 'http:' ||
    sandbox.hostname !== '127.0.0.1' ||
    sandbox.origin === window.location.origin ||
    sandbox.pathname !== '/sandbox'
  ) {
    throw new Error(
      'The MCP Apps sandbox URL must use its separate loopback origin.',
    )
  }
  const frame = document.createElement('iframe')
  frame.title = 'MCP Apps sandbox'
  frame.referrerPolicy = 'origin'
  frame.sandbox.add('allow-scripts', 'allow-same-origin')
  frame.src = sandbox.href
  host.replaceChildren(frame)

  const target = frame.contentWindow
  if (!target) {
    throw new Error('The browser could not create an MCP App sandbox.')
  }

  const abort = new AbortController()
  const bridge = new AppBridge(
    null,
    { name: hostName, version: hostVersion },
    { serverTools: {} },
    {
      hostContext: {
        displayMode: 'inline',
        availableDisplayModes: ['inline'],
        containerDimensions: { maxHeight: 480 },
      },
    },
  )
  const evidence = createEvidence('MCP Apps')
  let initialized = false
  const deadline = window.setTimeout(() => {
    callbacks.failed('The MCP App did not initialize within 8 seconds.')
    dispose()
  }, 8_000)

  function failed(error: unknown) {
    if (abort.signal.aborted) {
      return
    }
    const message = errorMessage(error)
    callbacks.observed(
      evidence.record('local', 'Apps bridge error', message, 'Host'),
    )
    callbacks.failed(message)
    dispose()
  }

  function dispose() {
    if (abort.signal.aborted) {
      return
    }
    window.clearTimeout(deadline)
    abort.abort()
    const closing = initialized
      ? bridge.teardownResource({}, { timeout: 250 })
      : Promise.resolve()
    void closing
      .catch(() => undefined)
      .finally(() => {
        void bridge.close().catch(() => undefined)
        frame.remove()
      })
  }

  bridge.onerror = failed
  bridge.addEventListener('sandboxready', () => {
    void bridge.sendSandboxResourceReady({ html: resource.html }).catch(failed)
  })
  bridge.addEventListener('initialized', () => {
    initialized = true
    window.clearTimeout(deadline)
    const deliver = async () => {
      await bridge.sendToolInput({
        arguments: JSON.parse(resource.argumentsJson),
      })
      await bridge.sendToolResult(
        CallToolResultSchema.parse(JSON.parse(resource.resultJson)),
      )
      callbacks.initialized()
    }
    void deliver().catch(failed)
  })
  bridge.addEventListener('sizechange', ({ height }) => {
    if (typeof height === 'number' && Number.isFinite(height)) {
      frame.style.height = `${Math.max(112, Math.min(height + 12, 480))}px`
    }
  })

  bridge.oncalltool = async ({ name, arguments: args }) => {
    if (!initialized || name !== resource.tool) {
      const error = 'The host denied a tool call outside this app’s grant.'
      callbacks.observed(
        evidence.record(
          'local',
          'App tool call denied',
          { name, error },
          'Host',
        ),
      )
      return { isError: true, content: [{ type: 'text', text: error }] }
    }

    try {
      const request = Request.make({
        _tag: 'Call',
        sessionId,
        tool: name,
        arguments: args ?? {},
        from: 'app',
        appRun: resource.run,
      })
      const reply = await requestSpecimen(request, abort.signal)
      callbacks.called(reply)
      if (reply.invocation) {
        return CallToolResultSchema.parse(
          JSON.parse(reply.invocation.resultJson),
        )
      }
      return {
        isError: true,
        content: [
          { type: 'text', text: reply.error ?? 'No tool result was received.' },
        ],
      }
    } catch (error) {
      const message = errorMessage(error)
      if (!abort.signal.aborted) {
        callbacks.called({ events: [], dropped: 0, error: message })
      }
      return { isError: true, content: [{ type: 'text', text: message }] }
    }
  }

  const transport = observeTransport(
    sandboxTransport(target, sandbox.origin),
    (direction, message) => {
      if (!abort.signal.aborted) {
        callbacks.observed(
          evidence.record(direction, frameLabel(message), message),
        )
      }
    },
  )
  void bridge.connect(transport).catch(failed)
  return dispose
}
