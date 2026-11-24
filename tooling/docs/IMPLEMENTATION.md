# How we built the first version

Built locally on linuc on 18 November 2026. This is an account of executed work, with future possibilities separated in the concept document.

## Start from existing software

We inspected the MCP repository scaffold and the local Personas feature branch at `4a9b9ae3285c9acba78d5ec1a74cb717aae96b99`. Its example generator, hierarchy model, validator, compiler and MCP renderer already supplied the specialist operations. A Happier-managed Codex scout checked the intended room move and identified the required scene-root and presenter-note changes. Personas source was not modified.

The core uses Node's SQLite support and the official MCP SDK. SQLite transactions coordinate local processes. Named artifacts use expected-revision checks; bytes carry SHA-256 hashes. Append-only events record mission, run, artifact, verification and judgment changes. The report makes outcomes inspectable without the agent being present.

## Keep execution and evidence separate

The lead agent launches bounded Happier workers and links their real execution IDs to local run records. The store does not launch workers. In the first build, completed worker receipts were imported afterward and labeled as imports; registration timestamps do not pretend to be dispatch timestamps. Only structured deliverables and selected evidence were saved, not worker conversations.

The first pilot uses a deterministic SDK client to call Lab MCP. Lab MCP calls the existing Personas MCP. It gets an example, validates a move, renders both states, retrieves images and checks the evidence. No model is needed for that deterministic transformation. Models helped investigate and independently review the implementation.

## Let the experiment fail visibly

The room move was valid, but the destination's combined house-and-Teams detail slide exceeded its layout budget. The exact rejection and failed mission were retained. Both sides of a second comparison used a compact Teams detail profile; the houses overview remained unchanged. This isolated the room move within a view that fit.

## Independent review changed the implementation

| Finding | Correction / boundary |
| --- | --- |
| SDK timeout passed in the wrong position | Use the installed SDK's second options argument |
| A later image retrieval could leave a partial render | Retrieve and hash-check all outputs, then save the bundle transactionally |
| Duplicate IDs could pass the independent diff audit | Check unique identities and valid ancestry before auditing the diff |
| PNG header checks were described too broadly | State signature/header dimensions only; visually inspect actual images separately |
| Images could appear current after source changes | Track input dependencies and propagate stale status |

Tests exercise hash/retrieval failure, retry, late-insert rollback, stale writes, judge boundaries and shared-store behavior. Final independent review accepted the four initial fixes. All four real images were inspected by the coordinator. No screenshot-only agent comparison or human-learning claim was made.

## Organize it as tooling

At the user's request, implementation, package dependencies, tests, scripts, skill and detailed documentation were moved beneath `tooling/`. The root keeps project direction and selected handoff documents. A relative link preserves skill discovery. The existing Codex server path was updated. Runtime state stays at root `.lab/` so historical missions retain their identity.

The first exhibit exports only fictional project JSON, recipe, four images and an evidence index with hashes. The full local ledger and worker receipts remain ignored. Existing records are not rewritten to make historical paths look current.

## Limits

This is a trusted local-account prototype. Hashes and append-only triggers are not a signed tamper-proof ledger; caller names do not authenticate reviewers. The two-worker limit is cooperative per mission. Renderer crashes can leave a lock requiring inspected recovery. Costs/tokens were not reported by the runtime. Tests can establish properties of an artifact; they cannot establish that the visitor understood it.
