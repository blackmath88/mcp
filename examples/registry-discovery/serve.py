"""Local educational REST exhibit. Not an MCP client or production proxy."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from time import monotonic
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

BASE = Path(__file__).resolve().parent
SOURCES = {
    'official': 'https://registry.modelcontextprotocol.io/v0.1/servers',
    'semantic': 'https://mcp-registry-search.vercel.app/search',
}

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, content, kind='application/json'):
        data = content if isinstance(content, bytes) else json.dumps(content).encode()
        self.send_response(status)
        self.send_header('Content-Type', kind + '; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.headers.get('Host') not in ('127.0.0.1:8765', 'localhost:8765'):
            return self.reply(403, {'error': 'Local Host required'})
        path = urlsplit(self.path)
        if path.path == '/':
            return self.reply(200, (BASE / 'index.html').read_bytes(), 'text/html')
        if path.path != '/api/search':
            return self.reply(404, {'error': 'Not found'})
        args = parse_qs(path.query)
        source = args.get('source', [''])[0]
        query = args.get('q', [''])[0].strip()
        if source not in SOURCES or not 3 <= len(query) <= 200:
            return self.reply(400, {'error': 'Choose a source and enter 3–200 characters'})
        params = ({'search': query, 'version': 'latest', 'limit': 5}
                  if source == 'official' else {'q': query, 'limit': 5})
        url = SOURCES[source] + '?' + urlencode(params)
        started = monotonic()
        envelope = {'mode': 'live REST; not MCP', 'source': source, 'requestUrl': url}
        try:
            request = Request(url, headers={'Accept': 'application/json', 'User-Agent': 'mcp-lab-local-example/1'})
            with build_opener(NoRedirect()).open(request, timeout=15) as response:
                body = response.read(2_000_001)
                if len(body) > 2_000_000:
                    raise ValueError('Response exceeds 2 MB limit')
                envelope.update(upstreamStatus=response.status, response=json.loads(body))
            status = 200
        except HTTPError as exc:
            envelope.update(upstreamStatus=exc.code, error='Upstream HTTP error; redirects are not followed')
            status = 502
        except Exception as exc:
            envelope.update(error=type(exc).__name__ + ': ' + str(exc))
            status = 502
        envelope['elapsedMs'] = round((monotonic() - started) * 1000)
        return self.reply(status, envelope)

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 8765), Handler).serve_forever()
