# Specimen route: examples for every step

Source: research supplied by the owner on 2026-11-21 (assembled with an external research assistant). This file is an editorial capture, not a verbatim copy. The twelve stations are stored in full, as data, in [specimens/route.json](../../specimens/route.json) and as one README each under [specimens/](../../specimens/README.md).

Status: research leads. The supplied text states that popularity was not benchmarked and no project was executed. The lab has not verified any claim, pinned any revision or run any upstream code.

## Direction carried by this drop

- "Bend it" belongs in every chapter, including the first. Even fetching a page or remembering a fact has rich edges.
- Each station has an anchor (a recognisable implementation), a diversion (a different implementation, fork or design) and an experiment (what the lab should make observable).
- "Official reference" does not mean "most used" or "production standard".
- The new opening is Fetch → Memory → Thinking: a simple tool can contain policy, "memory" depends on storage, and something named "thinking" may contain no model.
- Historical issues and advisories are specimens of a past revision, not claims about current builds.
- Fuzzers are used only against authorised, isolated specimens; a passing scan does not establish correctness.
- Organise as twelve specimen folders, not twelve integrations to install. Each should eventually hold: question, upstream repository and pinned revision, documented behaviour, controlled mutation, expected observation, actual evidence, what this does not prove.

## Further leads named in the source list but not placed on the route

- https://github.com/s2005/mcp-memory-server
- https://github.com/modelcontextprotocol/servers/issues/5197 (fetch: a 5xx robots.txt response parsed as rules)
- https://github.com/aaronsb/memory-graph
- https://gist.github.com/MinaResearchDesk/76992065296b108a6c20787f5835494b
- https://gist.github.com/ruvnet/764ac53c97942e1a6c190aba2245a493
- https://github.com/modelcontextprotocol/inspector/blob/main/docs/mcp-server-configuration.md
- https://github.com/modelcontextprotocol/ext-apps/blob/HEAD/examples/map-server/server.ts
- https://github.com/lastmile-ai/mcp-agent/blob/64b93d25/src/mcp_agent/workflows/evaluator_optimizer/evaluator_optimizer.py
- https://github.com/IBM/mcp-context-forge/blob/main/docs/docs/architecture/index.md

All other source links are listed per station in `specimens/route.json`.
