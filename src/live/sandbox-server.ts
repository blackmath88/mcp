import { readFile } from 'node:fs/promises'
import { type Server, createServer } from 'node:http'

export function isLoopbackHost(host: string): boolean {
  return /^(localhost|127\.0\.0\.1):\d{1,5}$/.test(host)
}

function frameAncestor(referrer: string | undefined): string | undefined {
  if (referrer) {
    try {
      const url = new URL(referrer)
      if (url.protocol === 'http:' && isLoopbackHost(url.host)) {
        return url.origin
      }
    } catch {
      return undefined
    }
  }
  return undefined
}

export function createSandboxServer() {
  let starting: Promise<string> | undefined
  let server: Server | undefined

  const start = async () => {
    const script = await readFile(
      new URL('./sandbox-proxy.js', import.meta.url),
    )
    const listener = createServer((req, res) => {
      const address = listener.address()
      const ownHost =
        typeof address === 'object' && address
          ? `127.0.0.1:${address.port}`
          : ''
      res.setHeader('Cache-Control', 'no-store')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), clipboard-read=(), clipboard-write=()',
      )

      if (req.method !== 'GET' || req.headers.host !== ownHost) {
        res.writeHead(403).end()
        return
      }
      if (req.url === '/proxy.js') {
        res
          .writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
          .end(script)
        return
      }
      const ancestor = frameAncestor(req.headers.referer)
      if (
        req.url !== '/sandbox' ||
        !ancestor ||
        ancestor === `http://${ownHost}`
      ) {
        res.writeHead(403).end()
        return
      }
      const policy = [
        "default-src 'none'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'unsafe-inline'",
        "frame-src 'self' about:",
        "base-uri 'none'",
        "form-action 'none'",
        `frame-ancestors ${ancestor}`,
      ].join('; ')
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': policy,
      })
        .end(`<!doctype html><html lang="en"><title>MCP Apps sandbox proxy</title>
        <style>html,body{margin:0;width:100%;height:100%}body{overflow:hidden}iframe{border:0;width:100%;height:100%;display:block}</style>
        <body><script src="/proxy.js" defer></script></body></html>`)
    })
    server = listener
    await new Promise<void>((resolve, reject) => {
      listener.once('error', reject)
      listener.listen({ host: '127.0.0.1', port: 0 }, () => {
        listener.removeListener('error', reject)
        resolve()
      })
    })
    listener.unref()
    const binding = listener.address()
    if (!binding || typeof binding === 'string') {
      throw new Error('Sandbox listener is unavailable.')
    }
    return `http://127.0.0.1:${binding.port}/sandbox`
  }

  return {
    url() {
      starting ??= start().catch((error: unknown) => {
        starting = undefined
        throw error
      })
      return starting
    },
    close() {
      server?.close()
    },
  }
}
