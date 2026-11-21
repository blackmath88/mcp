# Embedded discovery exhibit

Status: small implementation example; not executed or end-to-end verified when authored. It is separate from the planned Effect/Foldkit application and is not an alternative framework decision.

## Run locally

Requires Python 3 with its standard library and a modern browser:

```sh
python3 examples/registry-discovery/serve.py
```

Open http://127.0.0.1:8765/ . Stop with Ctrl-C. No dependencies, accounts, or cloud resources are installed. Starting the process does not make a remote request; submitting a query does.

This embeds results and evidence from existing tools, not their websites. It has two actual REST adapters:

- Official registry: https://registry.modelcontextprotocol.io/v0.1/servers with search, version=latest, and limit=5.
- Existing hybrid search: https://mcp-registry-search.vercel.app/search with q and limit=5.

Public-service availability has not been tested. Changes, rate limits, and errors are displayed, not replaced with fabricated results. Server names and descriptions are rendered as text. The proxy binds loopback, allows only two fixed upstreams, refuses redirects, caps responses, and uses timeouts. It is an educational development server, not a hardened production proxy. Queries and payloads are not intentionally persisted by this application; upstream logging policies still apply.

## What this demonstrates

A single lab interface can use existing discovery providers, preserve their raw results, and show where data travelled. Official name search and hybrid task search are different semantics. Similarity scores are not trust scores. Latest records can be deprecated, so the page does not call results active or safe.

Neither path is MCP. A REST response must never appear as a captured MCP transcript.

## Next: use the existing semantic service through MCP

Upstream documents an SSE endpoint at https://mcp-registry-search.vercel.app/api/sse and tools search_mcp_servers(query, limit, full_text_weight, semantic_weight) and list_mcp_servers(limit, offset).

Add a separate Node-side MCP client adapter using a verified compatible SDK and the required SSE transport. Discover tools rather than assuming the hosted interface matches the README. Call search_mcp_servers, preserve actual messages, validate the result, and compare with REST. Do not rewrite the upstream search engine or stand up its Supabase/embedding stack merely to demonstrate it. If the endpoint is unavailable, show that limitation. A browser cannot launch stdio processes; use an explicit local backend boundary.

## Next: embed an existing MCP App

Use modelcontextprotocol/ext-apps, initially examples/map-server, with its basic-host example and app-bridge entry point as references. This needs an MCP Apps host integration, not an iframe of GitHub or an arbitrary remote website.

Host steps: discover the tool and its UI metadata; invoke the tool; obtain its UI resource through the protocol; render in the required sandbox; establish the SDK bridge; supply actual result/context; enforce declared CSP and permitted host-mediated calls; trace interactions. Preserve text-only fallback.

Pin a tested upstream revision and inspect licensing before copying example code. Keep an upstream example's own UI technology behind its app boundary; the outer lab can remain Foldkit. An embedded view need not be rewritten in Foldkit.

## Effect/Foldkit integration contract

Migrate behavior, not the raw DOM code, when the app foundation lands:

- Effect service: discover via named provider, with typed validation, timeout, network, and response-shape errors.
- Foldkit: query/source state; explicit loading, success, empty, and failure messages; correlate responses to requests.
- Evidence: raw provider envelope and observed timing, separated from Lens interpretation.
- Alchemy: optional deployment only; public network access from a server is not permission for arbitrary URL proxying.

Suggested tests: source/query validation, redirect refusal, timeout, oversized response, malformed JSON, unexpected shape, empty results, unknown provider, late response, and no external request before explicit submission. Use injected local fixtures for deterministic tests rather than depending on public endpoints.

## Broader embedding ladder

1. Registry results in our UI — this example.
2. The same service over a real MCP client — next.
3. An official interactive map App through a host bridge.
4. A local Everything specimen via a real SDK client and trace.
5. Optional gateway specimen for aggregation, not a required lab runtime.
6. Lens classifies observed evidence from these integrations; it does not replace them.

## Primary sources inspected

- https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/api/official-registry-api.md
- https://github.com/lastmile-ai/mcp-registry-search/blob/main/README.md
- https://github.com/modelcontextprotocol/ext-apps

Read on 2026-11-21. These sources document interfaces; that does not establish the hosted services are currently available. No code from upstream was copied into this example.
