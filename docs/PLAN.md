# Plan

Status: proposed sequence for a concept-first exploration lab. No delivery dates or implementation commitments are implied.

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
| 08 The item becomes an application | next |
| 09 to 12 | reference cards only |

Per station, before calling it done: pin the upstream revision, check the documented behaviour against the source, and fill the evidence record in its README. None of that has been done for any station.

Protocol facts (revision, feature status, client support) still need a check against the specification before stations 04, 07, 08 and 12, which depend on Roots, transports, MCP Apps and gateways.

## Immediate next action

Stations 08 to 12 are a step up: an interactive application, a code-execution item, another model, iteration with durability, and the network. Before building them, decide with the owner how far simulation should go, because 10 and 11 centre on a model and the lab has none. Station 08 can reuse the valley map as the application. Seven stations still lack pinned upstream revisions.

## Explicit exclusions for this change

No runtime implementation, deployment, external-service registration, central ingestion, scheduling, paid inference, or activation of real-world write operations.
