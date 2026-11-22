import { Schema } from 'effect'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin, PreviewServer, ViteDevServer } from 'vite'

import { type Reply, Request } from './contract.ts'
import { errorMessage } from './evidence.ts'
import { searchRegistry } from './registry-server.ts'
import { createSandboxServer, isLoopbackHost } from './sandbox-server.ts'
import { createSessionHost, emptyReply } from './session-server.ts'
import { apiPath } from './specimens.ts'

async function readRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Array<Buffer> = []
  let size = 0
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    if (!Buffer.isBuffer(chunk)) {
      throw new Error('Invalid request chunk.')
    }
    size += chunk.length
    if (size > 8_192) {
      throw new Error('Request exceeded 8 KB.')
    }
    chunks.push(chunk)
  }
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  return Schema.decodeUnknownSync(Request)(parsed)
}

function send(res: ServerResponse, status: number, reply: Reply) {
  res
    .writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    .end(JSON.stringify(reply))
}

export function specimenHost(): Plugin {
  const configure = ({
    middlewares,
    httpServer,
  }: ViteDevServer | PreviewServer) => {
    const sandbox = createSandboxServer()
    const host = createSessionHost(sandbox.url)

    const middleware: Connect.NextHandleFunction = (req, res, next) => {
      if (req.url !== apiPath) {
        next()
        return
      }
      const authority = req.headers.host ?? ''
      if (
        req.method !== 'POST' ||
        req.headers['content-type'] !== 'application/json' ||
        !isLoopbackHost(authority) ||
        req.headers.origin !== `http://${authority}`
      ) {
        send(
          res,
          403,
          emptyReply('Use the specimen workbench from its loopback origin.'),
        )
        return
      }

      void readRequest(req)
        .then(
          async request => {
            if (request._tag === 'Search') {
              send(res, 200, await searchRegistry(request.query))
            } else {
              send(res, 200, await host.execute(request))
            }
          },
          error =>
            send(
              res,
              400,
              emptyReply(`Invalid lab request. ${errorMessage(error)}`),
            ),
        )
        .catch(error => send(res, 500, emptyReply(errorMessage(error))))
    }

    middlewares.use(middleware)
    httpServer?.once('close', () => {
      sandbox.close()
      void host.close()
    })
  }

  return {
    name: 'mcp-lab-specimen-host',
    configureServer: configure,
    configurePreviewServer: configure,
  }
}
