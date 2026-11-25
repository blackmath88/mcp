# Plan

Status: proposed sequence for a concept-first exploration lab. No delivery dates or implementation commitments are implied.

For implementation, read the [current specimen-host milestone](concept/ADDENDUM-SPECIMENS-LENS-AND-EMBEDDING.md) and [real-world specimen research](research/REAL-MCP-SPECIMENS.md). The research maps source-backed examples and controlled variations to the phases below.

The [Lens ontology and learning ladder](concept/MCP-LENS-ONTOLOGY.md) specify a proposed URL classifier and the distinctions each exhibit adds.

The [three-chapter journey and specimen shelf](concept/LEARNER-JOURNEY.md) show recurring aspects at increasing complexity and define progressive disclosure and an observable learner action for every ontology key.

## Phase 0 — Concept dossier

Capture narrative, architecture, conversation evolution, counterarguments, experiment proposals, and open decisions. Distinguish owner direction from assistant suggestions. This documentation change addresses Phase 0 only.

Exit proposal: concept is reviewable and its unresolved choices are explicit. A commit is not proof of acceptance of every design proposal.

## Phase 1 — Storyboard validation

Choose an initial audience and one synthetic domain. Storyboard inventory discovery, a simple action, and opening a program-like item. Compare at least two narrative orderings for CLI and placement. Validate whether the metaphor clarifies rather than conceals.

## Phase 2 — One executable slice

Build one shared engine with CLI and MCP access and a truthful trace. Use synthetic artifacts. Verify basic operation, error and empty states, keyboard access, reduced motion, and a non-spatial alternative.

Exit proposal: learner can explain interface versus implementation and trace one actual result.

Status 2026-11-21: a first executable slice exists (see docs/HANDOFF.md). Phase 1 storyboard validation with a chosen audience was skipped at the owner's instruction to build; the learner exit check has not been run with a person.

## Phase 3 — Composition and placement

Add a fixed workflow and a local/remote comparison. Identify state ownership, partial results, and dependencies. Do not introduce a general workflow platform unless needed.

## Phase 4 — Inversion and bounded feedback

Compare advice, delegation, and deterministic stages. Add inspect/repair with explicit budgets and a non-converging test. Keep model usage optional until separately authorized.

## Phase 5 — Network and failure

Reveal mixed modules, aggregation versus orchestration, a replaceable component, and controlled dependency failure. Show structural graph separately from execution.

## Phase 6 — Verified example enrichment

Research candidates from the conversation. Record primary sources, official/community status, exact capabilities, versions, client support, credentials, cost, effects, and documented versus executed evidence. Select examples for distinct lessons.

## Route plan (simulation first)

Agreed 2026-11-21: the lab follows the twelve specimens in specimens/route.json. Each station is simulated on synthetic data in the shared engine, reachable through the browser, the CLI and the MCP stdio server. Live connections wait for a later decision.

| Station | State |
| --- | --- |
| 00 The valley (the lab's own specimen) | working, seven steps |
| 01 Fetch a page | simulated: three robots policies, redirect, loop |
| 02 Memory | simulated: storage path, client and server restart, reinstall, conflicting statements |
| 03 "Thinking" as a tool | simulated: record, compute, consult (scripted stand-in) behind one tool name |
| 04 Filesystem | simulated: three server builds, client roots sent and revoked |
| 05 Browser perception | simulated: snapshot versus coordinates, stale references |
| 06 CLI, reversed | simulated: generated artifact versus live call across a schema change |
| 07 Local and remote | simulated: shared process versus one per connection; reconnect, vanish, timeout |
| 08 The item becomes an application | simulated: tool result, screen and model's knowledge drift apart |
| 09 One item contains a language | simulated: three calls versus one program, with a failing write; plus an editable Python program run in the tab whose writes are real MCP calls |
| 10 Another intelligence | simulated with a scripted stand-in: ask, review, deliver; map sent or left out |
| 11 Iteration and durable execution | simulated with scripted stand-ins: the reference loop rule; crash with and without durability |
| 12 The network and the repair bench | simulated: name collision, prefixed names, a backend going down. No fuzzing. |
| 13 Inspect the inspector | simulated: Lens as two tools; a listing that changed since it was pinned; one bounded self-inspection |

### Ladder coverage (all thirteen segments)

Source of truth: `src/domain/ladder.ts`, shown in the app under Atlas → Thirteen questions. A test runs every listed capability.

| Step | Distinction | Where to meet it |
| --- | --- | --- |
| 1 Read | reference versus content | valley, filesystem, fetch |
| 2 Query | stored versus computed | valley, memory |
| 3 Act | answer versus effect | valley, browser perception, ledger |
| 4 Remember | change now versus state later | memory, thinking |
| 5 Discover and perceive | world versus caller's view | browser perception, filesystem |
| 6 Trace interfaces and placement | entrance versus engine | generated CLI, local and remote |
| 7 Interact | one response versus a shared surface | interactive map |
| 8 Compose | named action versus program | valley, one item a language |
| 9 Consult and delegate | judgement versus control | another intelligence |
| 10 Iterate | single pass versus repetition | a loop that refines |
| 11 Resume | client lifetime versus work lifetime | a loop that refines (crash and resume) |
| 12 Connect workshops | one inventory versus many owners | the network |
| 13 Inspect the inspector | claims versus grounds | inspect the inspector |

Thin spots: step 11 is one tool that crashes a workflow and restarts it; it does not show a client disconnecting and a job being fetched by handle. Step 2 has no "same content, two queries" comparison on one screen.

Per station, before calling it done: pin the upstream revision, check the documented behaviour against the source, and fill the evidence record in its README. None of that has been done for any station.

Protocol facts (revision, feature status, client support) still need a check against the specification before stations 04, 07, 08 and 12, which depend on Roots, transports, MCP Apps and gateways.

## Immediate next action

1. Hand the lab to one person: station 08 on a phone, then the call console.
2. Give the other stations a specimen you can touch, starting with 02 Memory and 04 Filesystem; build timelines for 09 and 11.
3. Build the home dashboard from the design canvas and use its station names.
4. Put more of the protocol on the wire where a station needs it: the map as a resource in 00, roots in 04, a changing tool list in a rug-pull station.
5. Pin upstream revisions; stations 01 to 03 were never checked against a source.

## Explicit exclusions for this change

No runtime implementation, deployment, external-service registration, central ingestion, scheduling, paid inference, or activation of real-world write operations.
## Preserved local implementation record — 18 November 2026

The following record was recovered from Linuc during Git synchronization on 24 November 2026. It describes the earlier local prototype and its historical decisions; the newer concept and specimen-host direction above remain current. Historical verification claims below have not been re-certified by this preservation step.

# Current plan

Audience and format accepted: technically curious MCP newcomers; IDE-style workbench with central interaction. Previous project examples are historical evidence, not the new curriculum.

| Outcome | State | Evidence / next action |
| --- | --- | --- |
| Lab Factory coordination | Implemented | Local MCP/CLI state, bounded native workers, hashes, checks and advisory judgments |
| Real-world curriculum | Researched | Eight candidates with primary sources; no universal usage ranking established |
| Learning interaction | Specified | Notes retrieval → edit, with access variation and visible application state |
| Newcomer workbench | First slice implemented | Searchable Basics / Possibilities / Edges navigation; Weird filter; one playable model and seven labelled previews |
| Independent review | Completed with fixes | Source truth, learning contract, state changes and UI checks; does not certify understanding |
| Visual Basics layers | Implemented and reviewed | Who acts / What travels / What changes; four-specialist mission,8 state tests and90 browser checks |
| Human learning | Unverified | Try first complete notes example before scaling into more runnable exhibits |
| Live third-party connections | Not enabled | Separate account/client configuration; no simulation may imply live execution |

Implementation brief: `docs/research/mcp-learning-workbench-design.md`. Source shortlist: `docs/research/mcp-real-world-curriculum.md`. Review rubric: `tooling/docs/EXHIBIT-REVIEW.md`.
