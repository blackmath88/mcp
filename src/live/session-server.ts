import { Clock, Effect } from 'effect'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  RESOURCE_MIME_TYPE,
  getToolUiResourceUri,
  isToolVisibilityAppOnly,
  isToolVisibilityModelOnly,
} from '@modelcontextprotocol/ext-apps/app-bridge'
import { EXTENSION_ID } from '@modelcontextprotocol/ext-apps/server'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import {
  InitializeResultSchema,
  type Tool as McpTool,
} from '@modelcontextprotocol/sdk/types.js'

import type { Invocation, Reply, Request, Session, Tool } from './contract.ts'
import {
  createEvidence,
  errorMessage,
  frameLabel,
  observeTransport,
} from './evidence.ts'
import {
  type SpecimenId,
  allowedTools,
  hostName,
  hostVersion,
} from './specimens.ts'

const require = createRequire(import.meta.url)
const commandPath = (specimen: Exclude<SpecimenId, 'registry'>): string => {
  if (specimen === 'everything') {
    return join(
      dirname(
        require.resolve('@modelcontextprotocol/server-everything/package.json'),
      ),
      'dist/index.js',
    )
  }
  return fileURLToPath(
    new URL(
      specimen === 'time'
        ? '../../vendor/mcp-apps-quickstart/stdio.ts'
        : './boundary-server.ts',
      import.meta.url,
    ),
  )
}

const options = { timeout: 5_000 }
const idleLifetime = 10 * 60_000
const maxSessions = 12
const now = () => Effect.runSync(Clock.currentTimeMillis)

type ActiveSession = {
  specimen: SpecimenId
  client: Client
  evidence: ReturnType<typeof createEvidence>
  data: Session
  activeApp: { tool: string; run: number } | undefined
  busy: boolean
  touched: number
}

const listedTool = (
  tool: McpTool,
  evidence: ActiveSession['evidence'],
): Tool => {
  const { name, title, description, inputSchema, annotations } = tool
  let uiUri: string | undefined
  try {
    uiUri = getToolUiResourceUri(tool)
  } catch (error) {
    evidence.record(
      'local',
      'Invalid advertised UI URI',
      { name, error: errorMessage(error) },
      'Host',
    )
  }
  return {
    name,
    ...(title === undefined ? {} : { title }),
    ...(description === undefined ? {} : { description }),
    inputSchemaJson: JSON.stringify(inputSchema),
    ...(annotations?.readOnlyHint === undefined
      ? {}
      : { readOnlyHint: annotations.readOnlyHint }),
    ...(uiUri === undefined ? {} : { uiUri }),
    appVisible: !isToolVisibilityModelOnly(tool),
  }
}

export async function discoverTools(client: Pick<Client, 'listTools'>) {
  const tools = new Map<string, McpTool>()
  const cursors = new Set<string>()
  let cursor: string | undefined
  let error: string | undefined
  for (let page = 0; page < 5; page += 1) {
    try {
      const listing = await client.listTools(
        cursor === undefined ? {} : { cursor },
        options,
      )
      listing.tools.forEach(tool => tools.set(tool.name, tool))
      cursor = listing.nextCursor
      if (cursor === undefined || cursors.has(cursor) || tools.size >= 120) {
        break
      }
      cursors.add(cursor)
    } catch (cause) {
      if (page === 0) {
        throw cause
      }
      error = 'Tool discovery is partial. ' + errorMessage(cause)
      break
    }
  }
  return {
    tools: [...tools.values()].slice(0, 120),
    partial: cursor !== undefined || tools.size > 120,
    error,
  }
}

export const emptyReply = (error?: string): Reply => ({
  events: [],
  dropped: 0,
  ...(error === undefined ? {} : { error }),
})

function snapshot(session: ActiveSession, fields: Partial<Reply> = {}): Reply {
  return { ...session.evidence.snapshot(), session: session.data, ...fields }
}

export function createSessionHost(getSandboxUrl: () => Promise<string>) {
  const sessions = new Map<string, ActiveSession>()
  const sweep = setInterval(() => {
    sessions.forEach((session, id) => {
      if (!session.busy && now() - session.touched > idleLifetime) {
        sessions.delete(id)
        void session.client.close().catch(() => undefined)
      }
    })
  }, 30_000)
  sweep.unref()

  async function connect(specimen: SpecimenId): Promise<Reply> {
    if (specimen === 'registry') {
      return emptyReply('This exhibit uses Registry REST search.')
    }
    if (sessions.size >= maxSessions) {
      return emptyReply('The local host has reached its session limit.')
    }

    const id = randomUUID()
    // The SDK adds its own fixed default environment keys. Keep those empty so local
    // account locations and paths are not passed into the curated specimen process.
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [commandPath(specimen)],
      env: {
        HOME: '',
        LOGNAME: '',
        PATH: '',
        SHELL: '',
        TERM: '',
        USER: '',
        APPDATA: '',
        HOMEDRIVE: '',
        HOMEPATH: '',
        LOCALAPPDATA: '',
        USERPROFILE: '',
        SYSTEMDRIVE: '',
        TEMP: '',
        USERNAME: '',
        PROCESSOR_ARCHITECTURE: '',
        PROGRAMFILES: '',
      },
      stderr: 'ignore',
      maxBufferSize: 1_048_576,
    })
    const evidence = createEvidence('MCP stdio')
    const client = new Client(
      { name: hostName, version: hostVersion },
      {
        capabilities: {
          extensions: { [EXTENSION_ID]: { mimeTypes: [RESOURCE_MIME_TYPE] } },
        },
      },
    )
    const session: ActiveSession = {
      specimen,
      client,
      evidence,
      activeApp: undefined,
      busy: true,
      touched: now(),
      data: {
        id,
        state: 'ready',
        server: 'Unknown',
        version: 'Unknown',
        protocol: 'Unknown',
        tools: [],
        partial: false,
      },
    }
    sessions.set(id, session)
    let acceptedProtocol = 'Unknown'
    client.onerror = error =>
      evidence.record(
        'local',
        'MCP transport error',
        errorMessage(error),
        'Host',
      )
    client.onclose = () => {
      if (session.data.state === 'ready') {
        session.data = { ...session.data, state: 'failed' }
      }
      evidence.record(
        'local',
        'MCP transport closed',
        { state: session.data.state },
        'Host',
      )
    }
    try {
      await client.connect(
        observeTransport(transport, (direction, frame) => {
          evidence.record(direction, frameLabel(frame), frame)
          if (direction === 'in' && 'result' in frame) {
            const initialization = InitializeResultSchema.safeParse(
              frame.result,
            )
            if (initialization.success) {
              acceptedProtocol = initialization.data.protocolVersion
            }
          }
        }),
        options,
      )
      const serverInfo = client.getServerVersion()
      session.data = {
        ...session.data,
        server: serverInfo?.name ?? 'Unknown',
        version: serverInfo?.version ?? 'Unknown',
        protocol: acceptedProtocol,
      }
      const inventory = await discoverTools(client)
      session.data = {
        ...session.data,
        tools: inventory.tools
          .filter(tool => !isToolVisibilityAppOnly(tool))
          .map(tool => listedTool(tool, evidence)),
        partial: inventory.partial,
      }
      if (inventory.error) {
        evidence.record(
          'local',
          'Tool listing incomplete',
          inventory.error,
          'Host',
        )
        return snapshot(session, { error: inventory.error })
      }
      return snapshot(session)
    } catch (error) {
      const message = errorMessage(error)
      session.data = { ...session.data, state: 'failed' }
      evidence.record('local', 'Discovery failed', message, 'Host')
      sessions.delete(id)
      await client.close().catch(() => undefined)
      return snapshot(session, { error: message })
    } finally {
      session.busy = false
      session.touched = now()
    }
  }

  async function call(
    session: ActiveSession,
    request: Extract<Request, { _tag: 'Call' }>,
  ): Promise<Reply> {
    const { tool, arguments: args, from } = request
    const declared = session.data.tools.find(item => item.name === tool)
    let invocation: Invocation | undefined
    try {
      if (!declared || !allowedTools[session.specimen].includes(tool)) {
        throw new Error(
          'This tool is outside the specimen host’s invocation scope.',
        )
      }
      if (
        from === 'app' &&
        (session.activeApp?.tool !== tool ||
          session.activeApp.run !== request.appRun ||
          !declared.appVisible)
      ) {
        throw new Error('This app has no active grant for the requested tool.')
      }
      evidenceForCall(session, request)
      const result = await session.client.callTool(
        { name: tool, arguments: args },
        undefined,
        options,
      )
      invocation = {
        tool,
        argumentsJson: JSON.stringify(args),
        from,
        resultJson: JSON.stringify(result),
        isError: result.isError === true,
      }
      if (from !== 'learner' || !declared.uiUri || invocation.isError) {
        return snapshot(session, { invocation })
      }
      const resource = await session.client.readResource(
        { uri: declared.uiUri },
        options,
      )
      const content = resource.contents.find(
        item => item.uri === declared.uiUri,
      )
      if (
        !content ||
        content.mimeType !== RESOURCE_MIME_TYPE ||
        !('text' in content)
      ) {
        throw new Error(
          'The declared UI URI did not supply a supported MCP Apps HTML resource.',
        )
      }
      if (content.text.length > 500_000) {
        throw new Error('The MCP Apps resource is too large for this host.')
      }
      const sandboxUrl = await getSandboxUrl()
      const run = session.evidence.lastSequence()
      session.activeApp = { tool, run }
      return snapshot(session, {
        invocation,
        app: {
          ...invocation,
          uri: declared.uiUri,
          html: content.text,
          sandboxUrl,
          run,
        },
      })
    } catch (error) {
      const message = errorMessage(error)
      session.evidence.record(
        'local',
        'Call failed',
        { tool, from, error: message },
        'Host',
      )
      return snapshot(session, {
        error: message,
        ...(invocation === undefined ? {} : { invocation }),
      })
    }
  }

  async function execute(
    request: Exclude<Request, { _tag: 'Search' }>,
  ): Promise<Reply> {
    if (request._tag === 'Connect') {
      return connect(request.specimen)
    }
    const session = sessions.get(request.sessionId)
    if (!session) {
      return request._tag === 'Close'
        ? emptyReply()
        : emptyReply(
            'This MCP session expired or is unavailable. Discover tools again.',
          )
    }
    if (request._tag === 'Close') {
      sessions.delete(request.sessionId)
      await session.client.close()
      return emptyReply()
    }
    if (session.busy) {
      return emptyReply('Another request is in progress on this MCP session.')
    }

    session.busy = true
    try {
      if (request._tag === 'Call') {
        return await call(session, request)
      }
      if (session.data.state === 'ready') {
        session.data = { ...session.data, state: 'stopped' }
        await session.client.close()
      }
      return snapshot(session)
    } catch (error) {
      const message = errorMessage(error)
      session.evidence.record(
        'local',
        'Could not close MCP transport',
        message,
        'Host',
      )
      return snapshot(session, { error: message })
    } finally {
      session.busy = false
      session.touched = now()
    }
  }

  return {
    execute,
    async close() {
      clearInterval(sweep)
      const closing = [...sessions.values()]
      sessions.clear()
      await Promise.allSettled(closing.map(session => session.client.close()))
    },
  }
}

function evidenceForCall(
  session: ActiveSession,
  request: Extract<Request, { _tag: 'Call' }>,
) {
  session.evidence.record(
    'local',
    'Host accepted invocation',
    {
      tool: request.tool,
      arguments: request.arguments,
      initiator: request.from,
    },
    'Host',
  )
}
