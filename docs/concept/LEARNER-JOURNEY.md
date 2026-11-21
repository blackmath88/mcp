# Three chapters, thirteen optional reveals

Proposed learner experience · 21 November 2026. Companion to the [Lens ontology](MCP-LENS-ONTOLOGY.md) and [research dossier](../research/REAL-MCP-SPECIMENS.md). The ontology numbers below index lessons for authors. Learners see three entry points. Each stands on its own; the map and its current revision can travel across them.

## Recurring aspects

Follow one map from lookup to shared edit to downstream job. Interface, behaviour and architecture recur in every phase. This matrix is an authoring aid. Onstage, show the artifact, action and consequence; Backstage can unfold the underlying ontology and trace.

| Learner phase | Interface | Behaviour and information | Architecture | Visible evidence |
| --- | --- | --- | --- | --- |
| Explore the inventory | Choose one map and request a route. | The caller can read a specific map revision. The query returns a route and leaves the map intact. | One caller reaches one route service backed by a map. | Route and source revision alongside each other. |
| Open the workshop | Open the interactive map, move a bridge by hand and ask for the route again. | An authorised edit creates a new revision. The next route depends on which revision reached the caller. | Human editor and agent share a map through the host. The edit has a return path to inspect. | Before/after geometry and the revision used for the second answer. |
| Follow the work | Dispatch the map to a simulated printer, disconnect and reopen the job. | A queued job retains its submitted revision while the live map can change. A later print can faithfully show the old bridge. | The caller, queue, worker and output store have separate lifetimes. Follow one job across them. | Job receipt, submitted revision and labelled simulated output. |

For finer-grained reveals inside a phase, repeat the same pattern. For example, switching from MCP to CLI varies the interface while holding the map operation and engine constant. Introducing a repair loop varies the behaviour while keeping the artifact and entry point familiar. The thirteen reveal keys let authors select these variations.

Keep the simulation visibly labelled, even with the inspector closed. The bridge story is a proposed synthetic thread. Real specimens keep their actual vocabulary, supported operations and evidence.

## How disclosure works

Show the artifact and one meaningful action first. On action, keep the result and its immediate consequence adjacent: returned route, moved bridge, or printed revision. Offer **What changed?** beside that result. This opens a short before/after or source view. **Inspect run** opens Backstage focused on the relevant event, caller, artifact and revision. Raw messages, protocol vocabulary, provenance and Lens facets are available there on demand.

The learner can switch chapters directly, explore one additional variation, undo a reversible edit or reset the specimen. Preserve their selected artifact and revision when opening or closing detail. Give the same actions and evidence in a keyboard-accessible text view. Keep source, simulated/live mode and pending, failed or partial outcomes visible wherever they affect interpretation. For a consequential action, show the target and intended effect before invocation. A successful click is weak learning evidence: ask for one prediction during a variation, then let the result settle it.

## Specimen shelf for authors

Each row is an optional reveal triggered by a question. Upstream sources document the mechanism; actions below are proposals for a pinned specimen or clearly labelled local fixture. Never attribute synthetic bridge, print or revision behaviour to a source that does not provide it.

| Chapter / ontology key | Specimen or source | Learner variation and evidence |
| --- | --- | --- |
| Inventory · 1 Read | [Reference memory server](https://github.com/modelcontextprotocol/servers/blob/main/src/memory/README.md) | Read one seeded workshop record. Show which observation and entity supplied the answer. |
| Inventory · 2 Query | [Context7 API guide](https://context7.com/docs/api-guide) | Hold the selected library fixed and change the query. Show selected excerpts, their source and what changed. |
| Inventory · 5 Perceive | [Playwright MCP](https://github.com/microsoft/playwright-mcp) | Compare the page and accessibility snapshot for one local fixture. Point to one detail available in each representation. |
| Workshop · 3 Act | [tldraw demonstration](https://tldraw.dev/blog/tldraw-mcp-app) | Change one shape. Display the changed object beside the previous state. |
| Workshop · 4 Remember | [Reference memory server](https://github.com/modelcontextprotocol/servers/blob/main/src/memory/README.md) | Save an observation in a disposable store; reopen it in a fresh session. Change the store separately and inspect the result. |
| Workshop · 6 Trace the entrance | [Playwright CLI](https://github.com/microsoft/playwright-cli) and [Playwright MCP](https://github.com/microsoft/playwright-mcp) | Perform the same action on a reset local page through each entrance. Compare the resulting page state and the two caller-visible records. |
| Workshop · 7 Share a surface | [tldraw](https://tldraw.dev/blog/tldraw-mcp-app) and [official basic host](https://github.com/modelcontextprotocol/ext-apps/blob/main/examples/basic-host/README.md) | A person edits the drawing. Inspect whether the next agent turn received the change. Distinguish host rendering from an observed return path. |
| Workshop · 8 Compose | [Cloudflare Code Mode](https://github.com/cloudflare/mcp) | In a local, labelled analogue, compare two named changes with one program requesting both. Make the second stage fail; inspect which change remains. |
| Follow · 9 Delegate | [Consilium creator retrospective](https://huggingface.co/blog/consilium-multi-llm) | Use the model council as the advice example. In the fixture, switch from returning advice to returning an edited artifact. Identify who accepts it. |
| Follow · 10 Iterate | [Plotter Studio](https://github.com/ucodia/plotter-studio-mcp) | Compare design, dispatch receipt and camera feedback. In simulation, stop after one repair; show which observation triggered it. |
| Follow · 11 Resume | [SDK polling demo](https://github.com/modelcontextprotocol/python-sdk/blob/main/examples/servers/sse-polling-demo/README.md) and [Tasks specification](https://tasks.extensions.modelcontextprotocol.io/specification/2026-07-28/tasks) | Inspect a stream closing and reconnecting. Compare with retrieval by task handle. Test worker restart separately before making a durability claim. |
| Follow · 12 Connect | [IBM ContextForge](https://github.com/IBM/mcp-context-forge) | In a two-backend local fixture, make one unavailable. Compare the available inventory, affected requests and path of the last successful run. |
| Follow · 13 Inspect the inspector | [Official MCP Inspector](https://github.com/modelcontextprotocol/inspector) and [our Lens proposal](MCP-LENS-ONTOLOGY.md) | Compare the captured listing with a Lens claim derived from it. Ask what evidence could establish a write or durable state. Inspector serves as a reference for inspection; Lens supplies our proposed classification. |

## Implementation order and behavioural acceptance

Start with the existing real upstream host milestone. Use one actual tool and UI across the first two chapters before adding more backends. Prototype the third chapter with labelled, deterministic versioned artifacts. Link optional cases from the relevant result; the landing screen needs no catalogue of thirteen entries.

For the first walkthrough, observe whether a learner can (1) find and use one item without opening documentation, (2) predict whether their manual edit reached the caller, and (3) explain a mismatched print by identifying its submitted revision. Also observe whether they can stop after one chapter and return to the same artifact after inspecting evidence. These are proposed evaluation questions, not measured outcomes.
