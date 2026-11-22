function connectSandboxProxy() {
  const hostOrigin = new URL(document.referrer).origin
  const proxyOrigin = window.location.origin

  if (window.parent === window || hostOrigin === proxyOrigin) {
    throw new Error('The sandbox proxy must be embedded by a separate origin.')
  }

  const inner = document.createElement('iframe')
  inner.title = 'Upstream MCP App'
  inner.sandbox.add('allow-scripts')
  inner.referrerPolicy = 'no-referrer'
  document.body.append(inner)

  const proxyReady = 'ui/notifications/sandbox-proxy-ready'
  const resourceReady = 'ui/notifications/sandbox-resource-ready'
  const sandboxPrefix = 'ui/notifications/sandbox-'
  const resourcePolicy = [
    "default-src 'none'",
    "script-src 'unsafe-inline'",
    "style-src 'unsafe-inline'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-src 'none'",
  ].join('; ')
  let loaded = false

  window.addEventListener('message', event => {
    const message = event.data
    if (message?.jsonrpc !== '2.0') {
      return
    }

    if (event.source === window.parent && event.origin === hostOrigin) {
      if (
        message.method === resourceReady &&
        !loaded &&
        typeof message.params?.html === 'string'
      ) {
        loaded = true
        const policy = `<meta http-equiv="Content-Security-Policy" content="${resourcePolicy}">`
        const html = message.params.html
        const headPattern = /<head(?:\s[^>]*)?>/i
        inner.srcdoc = headPattern.test(html)
          ? html.replace(headPattern, head => head + policy)
          : policy + html
        return
      }
      if (loaded && !message.method?.startsWith(sandboxPrefix)) {
        inner.contentWindow?.postMessage(message, '*')
      }
    } else if (
      loaded &&
      event.source === inner.contentWindow &&
      event.origin === 'null'
    ) {
      if (!message.method?.startsWith(sandboxPrefix)) {
        window.parent.postMessage(message, hostOrigin)
      }
    }
  })

  window.parent.postMessage(
    { jsonrpc: '2.0', method: proxyReady, params: {} },
    hostOrigin,
  )
}

connectSandboxProxy()
