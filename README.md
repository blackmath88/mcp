# MCP Lab

An exploration lab for one question: when an AI gains access to a capability, what has it actually gained access to? See [CONCEPT.md](CONCEPT.md).

## What you will find

- **"What is MCP?"** as the front door, answered with one picture: the map of a tool list.
- **The workshop**: every server drawn as the same building. You and the AI app outside; MCP as the front desk where the `tools/list` board hangs, all the AI is shown; behind it the server's workshop with nine places a tool can be (Read, Ask, Write, Compute, Sequence, Share, Invent, Delegate, Act); outside its walls what the tools reach. Rules sit in the wall openings, and each server says where the picture simplifies.
- **The route up the ladder**: 16 real (simulated) servers in the order of the nine slots, starting with fetching a page, each with one idea, one thing to try and one thing to notice. Then four side trips about where tools run, and your own server last.
- **A toolbench per server**: the map, what the tools work on, what comes back, what stays changed. Use a tool, watch the engine events replay, set the host to ask you first and deny a write. The cart server really asks you mid-call over MCP (`elicitation/create`).
- **Under the hood** of every tool: the `tools/list` entry as received, the exact `tools/call` it would send, what Lens infers from the wording, and hidden-character checks. Python runs in the tab for the code-mode server; every `ledger.write` is a real tool call.

## Run the first slice

Requires Node 22.18 or newer. No cloud account, API key or model is needed.

```bash
npm install
npm run dev          # the lab at http://localhost:5173
npm test             # domain, state, UI, CLI and MCP integration tests
npm run typecheck && npm run lint && npm run build
```

The same domain engine has three entrances:

```bash
npm run lab -- list
npm run lab -- connect_places --from forge --to dock            # CLI, succeeds
npm run lab -- connect_places --from forge --to dock --storm    # CLI, controlled failure, exit 1
npm run lab -- build_path --from mill --to archive --state .lab/world.json   # keep the world between runs
npm run lab -- fetch_page --url https://valley.test/notice --policy first-hop   # station 01, bent
npm run mcp:server   # MCP server over stdio, for any MCP client
npm run record       # rerun the real CLI and MCP exchange shown in the lab
```

What is real and what is not:

- The browser runs a real MCP client and a real MCP server in the tab, joined by the SDK's in-memory transport. Every run is an actual `tools/call`; Backstage shows the frames. The data is made up and nothing crosses a network.
- The CLI and the MCP stdio server run the same engine. The MCP path is tested with the official SDK client over stdio.
- The "Recorded CLI + MCP" tab shows `src/recordings/entrances.json`, captured by `npm run record`. It is a recording, labelled as such.
- There is no model, no approval step and no remote service anywhere in this slice.

The route of twelve specimens lives in [specimens/](specimens/README.md); its claims about upstream projects are unverified research leads.

Layout: `src/domain` (engine, no DOM or transport), `src/adapters` (in-process, CLI, MCP), `src/lab` (Foldkit model, update, view), `lab/concept.html` (the earlier prototype, kept as reference). `npm run infra:deploy` is gated and was not run; nothing is deployed.

## Also in this repository

- **The earlier workbench** (`lab/`, the 18 November prototype): an IDE-style workbench for newcomers with one playable notes model and seven source-backed previews. Kept as reference; see [lab/README.md](lab/README.md). The Foldkit lab above (`src/`) is the current app, and `npm run build` builds only that.
- **Lab Factory** ([tooling/](tooling/README.md)): bounded native workers, source evidence, artifact revisions, deterministic checks, advisory review and learning feedback. Runtime history stays in ignored `.lab/`.
- Direction: [CONCEPT.md](CONCEPT.md). Current evidence and next work: [docs/HANDOFF.md](docs/HANDOFF.md). Historical experiments: `tooling/docs/experiments/`.
