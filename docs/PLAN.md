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

## MCP work plan (simulation first)

Agreed 2026-11-21: no live connection yet. Each MCP chapter is simulated in the browser and backed by a recording from the real stdio server driven by the SDK client. Nothing below is started.

1. **Check the facts.** Read the current specification for every feature a chapter uses and pin the revision. The SDK negotiated 2025-11-25 in our recording; that is an observation, not a reviewed choice.
2. **Tools versus resources versus prompts.** Show the map as a resource beside `read_map` as a tool, and add one prompt. The server already exposes the resource.
3. **Descriptions as interface (E01).** Same operation, vague and precise description; then the harmless hidden-instruction specimen from `lab/concept.html`.
4. **A kit that changes.** Tool list changes mid-session, including the changed-definition specimen and the maze.
5. **The server asks back.** Elicitation and sampling, only after step 1 confirms status and client support.
6. **An item with its own screen.** MCP Apps, same condition.
7. **Live examples.** Chosen with the owner later; the transport and the browser path are decided then.

Each chapter ships with its recording script, a recording and a test that the recording still matches the engine.

## Immediate next action

Try the slice with one person from the intended audience. Then start MCP work at steps 1 and 2.

## Explicit exclusions for this change

No runtime implementation, deployment, external-service registration, central ingestion, scheduling, paid inference, or activation of real-world write operations.
