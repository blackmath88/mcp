# Handoff

## IDE layout and MCP plan — 2026-11-21

Owner direction: simulation is enough for now, plan the MCP work, and use an IDE-style layout with the workbench in the middle and the easy-to-complex navigation always visible (D08, D09).

Changed: `src/lab/view.ts` and `src/styles.css` only, plus a `network` Backstage tab. Left sidebar holds the journey (seven working chapters, five listed as planned) and the kit; the workbench is centred with a "Next" button; the inspector on the right holds the item card and the five questions; Backstage is a bottom panel with four tabs; a status bar states the mode. The engine, adapters and state logic are unchanged.

Evidence: typecheck, lint, build and 39 tests pass. Headless Chromium at 1440, 1000 and 400 px: no console errors, no horizontal overflow.

Known UX gaps: panes are not resizable; the bottom panel is short on small laptop screens; planned chapters are not clickable; no light/dark toggle.

Next: see "MCP work plan" in docs/PLAN.md.


## First executable slice — 2026-11-21

Status: implemented and checked locally. Not deployed. No learner evaluation.

### Changed

- Foundation from `blackmath88/effect-foldkit-alchemy-template` at 7b398a7: pinned dependencies, Vite, Vitest, oxlint/oxfmt config, `FOLDKIT.md`, gated `alchemy.run.ts` and its deploy guard. Governance files, reference catalog and Git history were not copied.
- `src/domain`: valley map engine in Effect with typed errors and three services (world store, trace, pace). Operations emit their own events.
- `src/adapters`: in-process (browser, slowed 350 ms per stage so a run can be cancelled), CLI (`npm run lab`), MCP stdio server (`npm run mcp:server`, low-level SDK `Server`, four tools and the map as a resource).
- `src/lab`: Foldkit app. Chapter ladder, kit, Onstage/Backstage, replay (from start, step, play, pause, show all), weather as the one mutation, five questions and a network table derived from the last run's events.
- `scripts/record-entrances.ts` and `src/recordings/entrances.json`: a real CLI run and real MCP frames (handshake, tools/list, tools/call) for calm and storm.

### Evidence (executed in this session)

- `npm run typecheck`, `npm run lint`, `npm run build`: pass.
- `npm test`: 39 tests in 4 files pass. They cover valid and invalid domain operations, state transitions, reset and cancel with late results, replay, the UI path inventory → execution → trace, evidence labels, CLI execution, and MCP over stdio through the SDK client. CLI, MCP and in-process records are asserted equal.
- `npm run test:infra-guard`, `python3 scripts/check.py`, `pytest tests`: pass.
- Headless Chromium against the production build at 1280 px and 400 px: full journey, cancel, reset while running, keyboard selection of a kit item, no console errors, no horizontal overflow. Screenshot: `docs/reports/first-slice/storm-failure.png`.
- The SDK negotiated protocol version 2025-11-25 in the recording. That is an observation of SDK 1.32.2, not a reviewed protocol choice.

### Migrated from `lab/concept.html`

Chapter ladder, kit bar with item cards, Onstage/Backstage split, step/play/reset, one "bend it" switch, five questions, visual tokens.

### Left in the reference HTML

The scripted model and its chat bubbles, and the exhibits on tool descriptions, changed tool definitions, sampling, elicitation, MCP Apps and the tool-list maze. Their protocol details remain unverified.

### Limitations

- The browser never speaks MCP. Live browser-to-MCP was left out to keep the SDK and a subprocess bridge out of the bundle; the MCP path is proven by tests and shown as a recording.
- No model, approval or identity layer. The five questions say so.
- Replay shows a finished run; events are not streamed while the engine works.
- The network view is a table, not a graph. The app follows the system colour scheme only.
- The starter's `package-lock.json` was out of sync with its `package.json` (TypeScript), so `npm ci` failed and `npm install` regenerated the lock. `npm audit` reports 3 advisories in dev tooling; not triaged.
- No Node job was added to CI. `foundation-checks.yml` still runs only the Python checks.
- Cancel and reset discard an in-flight result in the browser. The CLI and MCP adapters have no cancel.

### Practice receipt

`blackmath88/development-practice` is outside this session's repository access, so the live practice source was not read. Work followed local `AGENTS.md`, `FOLDKIT.md` and the starter's `AGENTS.md`.

### Next

1. Run the slice with one learner and record what they can explain.
2. Decide the next slice: a live MCP path from the browser, or the local/remote placement chapter.
3. Add a Node job to CI if this stack stays.

## Concept documentation — 2026-11-21

Status: documentation-only concept dossier. No implementation, runtime verification, or external integration acceptance is claimed.

### Learned

The owner wants an exploration lab progressing from inventory discovery to program-like capabilities, CLI overlap, placement, workflows, inversion, and a mixed module network. The concept must argue its choices and expose critical limitations before adding verified real-world examples.

### Direction and proposals

Owner direction and assistant proposals are separated in docs/DECISIONS.md and docs/concept/CONVERSATION-SYNTHESIS.md. Network identity and authorization are treated as infrastructure assumptions, not a protocol security guarantee.

### Scope of this change

Replaces the concept, decisions, plan, and handoff scaffolds and adds six concept documents: narrative, architecture, critical questions, experiments, and conversation synthesis alongside the canonical concept index. Specifically, five new files under docs/concept are added; total files changed: nine. The write payload is the authoritative list if this prose count differs.

No verbatim transcript, unrelated personal data, private practice text, runtime code, manifest classification change, README rewrite, or service activation is included. The synthesis covers all distinct conceptual threads and consolidates repeated turns.

### Repository evidence

Inspected repository root, AGENTS.md, START-HERE.md, CONCEPT.md, docs listing, docs/DEVELOPMENT-PRACTICE.md, docs/DECISIONS.md, docs/PLAN.md, docs/HANDOFF.md, .practice/source.json, and branches. main resolved to b120b9e7c84366fc55010a77b296689057d5aab8 and was unchanged on the subsequent branch check.

No Observatory snapshot content was inspected; direct repository inspection was used. No claim of complete repository audit is made. Unrelated files are preserved.

### Practice receipt

Source: blackmath88/development-practice at 8a416833d269475653861964984cb8cfb6aa37c1.

Selected: PRACTICE.md baseline, docs/DECISIONS.md, profiles/prototype.md; no optional method. The baseline was read through main, and the subsequent source-root resolution identified the same recorded revision. Decision ledger and profile were read using the pinned revision.

Applied: proportionate concept-first scope, explicit proposals versus observations, synthetic demonstration direction, preservation of unrelated work, and truthful verification limits. Guidance is advisory; private source text is not vendored.

Exceptions: no implementation was requested in this phase; no runtime, UI, or deployment checks were applicable. This is not a compliance certification.

### Checks and limitations

Executed: read-only GitHub inspection and branch resolution. No shell commands, automated link checks, Markdown lint, runtime tests, or learner evaluation were run. No external example or protocol-feature claim was freshly verified. Earlier conversational technical specifics must be checked before use.

### Next

Review the concept, choose the first audience and synthetic domain, then storyboard one inventory-to-execution path. Real-world example enrichment follows, with explicit evidence records. No further authority or execution permission is implied by this handoff.
