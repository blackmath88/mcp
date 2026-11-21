# Concept addendum: real specimens, embedding, discovery, and MCP Lens

Date: 2026-11-21. Status: working direction and implementation proposals, consolidated from the conversation following the initial concept. This extends rather than replaces CONCEPT.md.

## 1. What changed in the direction

The lab should not merely explain hypothetical tools or link to interesting projects. Learners should use existing implementations inside our experience wherever practical, inspect actual results, and deliberately change one condition.

Every chapter should contain an understandable anchor and a surprising neighbour. The basics must already be interesting: fetching a page contains policy; memory depends on storage; a thinking tool is not necessarily another model. Complexity must not be saved for a final chapter.

The owner's additional direction includes Effect/Foldkit/Alchemy as the application stack, real GitHub specimens throughout, an MCP that explains other MCPs, discovery over existing registries, and embedded working examples rather than another directory of links.

Important distinction: the owner selected these directions; the precise module layout, interfaces, milestone ordering, and Lens taxonomy below remain proposals until implemented and evaluated.

## 2. Current repository reality

- The concept dossier is committed.
- lab/concept.html is an existing visual/interaction prototype with an exhibit ladder, inventory, Onstage/Backstage panels, stepping/play/reset, variants, scripted model behavior, and browser-side dispatch. Preserve and inspect it before migration. Its MCP-looking exchanges are not evidence of an external protocol connection.
- examples/registry-discovery contains an authored Python/HTML REST example for the official registry and LastMile search. It was committed without execution, endpoint availability checks, browser tests, or full compatibility validation.
- That REST example is not an MCP client, not an embedded MCP App, and not the Effect/Foldkit application.
- There is no claim here that Lens, a live specimen host, the new application, or a gateway integration has been built.

## 3. Use the existing stack and starter

Reference repository: https://github.com/blackmath88/effect-foldkit-alchemy-template

Use its current instructions, FOLDKIT.md, dependency lockfile, reference router, testing conventions, and optional infrastructure pattern. Inspect the selected revision rather than assuming older conversational version numbers are still right.

Proposed division:

- Effect: domain operations, typed failures, dependencies, cancellation, and execution boundaries.
- Foldkit: explicit Model/Message/Update/Command application state and presentation.
- Alchemy: optional infrastructure declaration, not a prerequisite for local use.

Import the necessary application foundation selectively. Do not overwrite this project's instructions or concept with template scaffolding. Retain one domain implementation behind adapters. Keep embedded upstream app code behind its own boundary rather than rewriting every example in Foldkit.

Local development and tests should need neither cloud credentials nor paid inference. Deployment and resource provisioning require separate authorization. Do not activate optional devtools MCP merely because it exists upstream.

## 4. The specimen method

Each exhibit should record:

1. Question: the assumption under examination.
2. Anchor: an established, official, or recognizable implementation.
3. Diversion: a fork, alternative, issue, or unusual composition.
4. Mutation: exactly one controlled change.
5. Observation: actual behavior and artifacts.
6. Boundary: what the observation supports and does not prove.

Prefer labels such as official reference or documented implementation over unsupported claims like most used or standardized. A reference server is not automatically production-ready. Historical issues describe particular revisions; a fixed bug is not evidence of a current vulnerability.

## 5. Candidate route and experiments

These are research leads from the conversation, not a verified compatibility matrix. Source and test each selected revision before shipping an exhibit.

| Step | Anchor / diversion | Proposed question and controlled experiment |
| --- | --- | --- |
| Fetch | modelcontextprotocol/servers src/fetch; LangGPT/mcp-fetch policy fork | Fetch through a synthetic redirect. Which destination and policy checks actually occurred? Distinguish policy variation from protocol compatibility. |
| Memory | modelcontextprotocol/servers src/memory; shaneholloman/mcp-knowledge-graph; okooo5km/memory-mcp-server | Restart client, restart server, then change storage path. What remembers? Add a contradiction; storage does not establish truth. |
| Thinking | modelcontextprotocol/servers src/sequentialthinking | Compare recording caller-supplied steps, deterministic planning, and calling another model. Where does reasoning originate? |
| Inventory and scope | github/github-mcp-server; reference filesystem server | Vary available toolsets and inspect effective workspace access. Reproduce historical Roots behavior only with a pinned compatible revision, not as a universal current feature. |
| Perception | microsoft/playwright-mcp | Compare accessibility representation, screenshot, and actual page state. Change the page after inspection. Is an action unavailable or merely unseen? |
| CLI inversion | modelcontextprotocol/inspector; openclaw/mcporter | Call a capability through MCP and a generated CLI, then change its schema. What is discovered dynamically and what becomes stale? |
| Placement | supercorp-ai/supergateway | Connect two clients and interrupt one. Which process/state belongs to whom? Distinguish transport bridging from session isolation and lifecycle. |
| Interactive item | modelcontextprotocol/ext-apps quickstart, map-server, threejs-server, wiki-explorer-server | Use the actual upstream view. Compare human-visible state with evidence received by host/model. |
| Programmability | cloudflare/mcp; maietta/mcp-code-mode-demo | Individual calls versus a program with a halfway failure. One call is not necessarily one effect or a transaction. |
| Intelligence inversion | sammcj/mcp-llm; Mastra agent exposure | Same expert as consultant versus delegated worker. Inspect context, authority, and acceptance criteria. |
| Iteration | lastmile-ai/mcp-agent evaluator-optimizer | Try unsatisfiable criteria and bounded repair. Distinguish model assessment from correctness. |
| Durability | lastmile-ai/mcp-agent Temporal examples | Interrupt a worker or caller. Identify which runtime persists progress and what repeats. |
| Network | IBM/mcp-context-forge | Assemble one inventory from backends, collide names, remove one, change a schema. A unified entrance is not a unified workflow. |
| Repair bench | Everything server and Inspector; tavric-labs/mcp-server-fuzzer; quanticsoul4772/mcplint | Malformed input, schema drift, cancellation and late results, against an isolated owned specimen only. Scanner success is not exhaustive verification. |

Other category leads retained from the discussion: Figma, World Bank Data360, Microsoft Learn, shadcn/ui, TomTom, Blender integrations, Supabase, Sentry, Stripe, Alpaca, Hugging Face, Home Assistant, and Arduino integrations. Introduce them when they add a distinct lesson. Do not silently install all of them or expose real financial, infrastructure, or physical-device effects.

For issues and advisories, preserve reported/confirmed/fixed distinctions, affected version, reproducibility, and current status. Existing discussion of symlinks, Roots updates, redirects, bridge sessions, and description poisoning is a research queue, not a set of newly verified findings.

## 6. Embedding means reuse, not a wall of links

Different upstream surfaces require different integration forms:

- Normal MCP tool: real discovery/invocation, an input UI, and result rendering.
- MCP App: supplied UI rendered through the supported host bridge and sandbox.
- CLI: supervised local process through an explicit backend adapter.
- Workflow/gateway: a bounded runnable specimen behind an adapter, not a mandatory production dependency.
- Recorded evidence: replay with source, date, version, and an explicit recorded label.

A source link is provenance, not an embedded specimen. A screenshot is not a live integration. An arbitrary iframe is not an MCP Apps host.

## 7. Proposed next milestone: a real specimen host

References:

- https://github.com/modelcontextprotocol/ext-apps
- https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host
- https://github.com/modelcontextprotocol/ext-apps/blob/main/src/app-bridge.examples.ts
- https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/quickstart.md

Begin with the smallest official quickstart view, such as its server-time example, after checking the current source. The surrounding lab is ours; the embedded app and interaction are upstream's.

Required path:

1. Start/connect to a selected local specimen.
2. Discover its actual tools and UI metadata.
3. Invoke a tool through a real MCP client.
4. Obtain the supplied UI resource.
5. Render it using the SDK host bridge and required sandbox arrangement.
6. Forward permitted interactions and actual results.
7. Show observed exchanges in Backstage.
8. Stop a dependency and expose the failure honestly.

Adapt the official basic-host architecture instead of inventing a broad postMessage bridge. Inspect licensing and preserve notices before copying code. Pin tested SDK and specimen versions. Inspect compatibility with the starter's Effect runtime; isolate dependencies where needed rather than silently forcing incompatible packages into the browser.

After one view works, switch to the map, Three.js, and wiki-explorer specimens through the same boundary. Do not build three independent hosts. A model is optional for manual discovery and invocation; model-driven selection can follow later.

The host is not permission to connect to arbitrary URLs or launch arbitrary packages. Curate available specimens and use explicit user action. Define origin/source checks, resource limits, and sandbox policies using the selected SDK's actual guidance.

## 8. Evidence architecture

Keep these separate:

- User action.
- Foldkit state transition.
- Domain operation.
- Actual protocol message.
- Scripted explanation.
- Lens interpretation.

Do not label all of them the wire. Render observed protocol messages from the connection, not expected messages synthesized from a lesson script. Record enough identifiers to link run, request, artifact, and view without collecting sensitive content by default.

Modes must be persistent and explicit: scripted, in-process, live REST, live MCP, or recorded. An unavailable service must not silently turn into invented live output. Configured topology must be distinguishable from observed execution.

## 9. MCP Lens: the explainer becomes a capability

Owner direction: include an MCP that explains another MCP, categorizes its abstractions, and suggests improvements. Working name: MCP Lens. It is both a useful companion and the meta capstone; point it at itself only with bounded explicit recursion.

Proposed profile dimensions:

- Capabilities and possible effects.
- Expressiveness: narrow operation, query language, code, environment.
- Composition: action, procedure, workflow, iteration, delegation.
- Intelligence placement: deterministic, model-backed, mixed, unknown.
- Interaction: result, additional input, UI, continuing work.
- State ownership and persistence.
- Local/remote dependencies.
- Authority boundaries.
- Observability and evidence.

These are our analytical dimensions, not official protocol categories. Prefer a multidimensional profile to one forced label.

Three inspection modes:

1. Interface-only: advertised descriptions, schemas, and metadata.
2. Source-assisted: selected implementation and configuration.
3. Controlled execution: an explicitly permitted test and its observed results.

Every conclusion carries evidence, uncertainty, and scope. For example: observed arbitrary SQL input; inferred programmable query surface; unknown database privileges; suggested documentation and an access-boundary test.

Improvement suggestions should state evidence, possible benefit, trade-off, and a small validating experiment. Avoid a universal quality score. Sometimes the correct recommendation is to keep one simple tool rather than add another abstraction.

Lens must not claim to know hidden workflows, model use, security, or durability from tool descriptions alone. Source and tool text are untrusted evidence, not instructions. Source inspection and execution are independent permissions. Self-inspection should expose Lens's own blind spots rather than certify itself.

## 10. Discovery and the master-MCP idea

Reuse existing catalogues rather than building another global registry.

Candidates discussed:

- modelcontextprotocol/registry: public server metadata and discovery API.
- lastmile-ai/mcp-registry-search: semantic/hybrid search with REST and MCP interfaces.
- KBB99/mcp-registry-server: earlier semantic registry retrieval implementation.
- IBM/mcp-context-forge: configured aggregation and routing, distinct from public indexing.

Proposed architecture:

```
Public registries + curated local/private specimens
                      |
                Discovery adapter
                      |
                  MCP Lens
             explain / classify / compare
                      |
             Explicit connection decision
                      |
               Selected specimen
```

Discovery, inspection, connection, installation, and execution are separate actions. Published identity is not code review. No index can be assumed exhaustive, especially for private or unpublished servers. Similarity ranking is not a trust score.

Keep registry search and gateway execution distinct. Do not introduce a large gateway merely to render a search result.

## 11. REST versus MCP discovery exhibit

Keep the current examples/registry-discovery as a clearly bounded adapter experiment. It must not be presented as completed MCP integration or the final application frontend.

Next compare the same existing search service over REST and a real MCP connection. Verify transport, discover available tools, capture actual messages, and handle unavailable services explicitly. Do not reimplement the upstream embedding index or provision its database just to demonstrate retrieval.

Migration target: an Effect discovery service with typed failure modes, Foldkit request-state messages and stale-result protection, and provenance-preserving result/evidence views. Alchemy remains optional.

## 12. Claude implementation handoff

Read local project instructions and the whole concept; inspect lab/concept.html and the existing starter. Then build, rather than produce another broad architecture essay.

Recommended first delivery:

- Effect/Foldkit local application foundation using compatible pinned dependencies.
- One real upstream MCP tool and UI through the specimen-host boundary.
- Inventory, Onstage, and actual Backstage evidence.
- A bounded controlled variation and truthful failure.
- One REST-versus-MCP discovery comparison when the provider is available.
- Tests for domain/adapters, state transitions, late results, UI labels, keyboard use, and protocol integration.
- Updated working commands and a handoff distinguishing implemented, tested, and deferred.

Do not gate the first host proof on Lens, paid inference, a universal gateway, or a full distributed deployment. Preserve a no-cloud local path and use fixtures for deterministic tests. Live external tests remain explicit and separate.

## 13. Acceptance criteria and limits

The next milestone is not complete merely because an iframe appears. A user must discover an upstream tool, invoke it, interact with its supplied view, inspect actual evidence, and observe a dependency failure. Another specimen should reuse the host boundary.

Document upstream revision, SDK versions, commands, environment, test results, license handling, and remaining incompatibilities. Replay and simulation remain useful fallbacks only when labelled as such.

## 14. Reference register

The repositories and paths above are public research entry points carried forward from the conversation, not fresh verification during this documentation update. Additional primary references:

- https://github.com/modelcontextprotocol/servers
- https://github.com/github/github-mcp-server
- https://github.com/microsoft/playwright-mcp
- https://github.com/openclaw/mcporter
- https://github.com/supercorp-ai/supergateway
- https://github.com/cloudflare/mcp
- https://github.com/lastmile-ai/mcp-agent
- https://github.com/IBM/mcp-context-forge
- https://github.com/modelcontextprotocol/registry
- https://github.com/lastmile-ai/mcp-registry-search
- https://github.com/KBB99/mcp-registry-server

Before adoption, check exact upstream behavior and license, select a revision, run the smallest useful experiment, and distinguish documented, inspected, executed, and independently verified evidence.
