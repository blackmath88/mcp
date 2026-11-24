---
name: lab-factory
description: Run a supervised research and making lab around a format, protocol, or tool, using local MCP mission state, bounded workers, concrete exhibits, and evidence-based review.
---

Use this repository's local Lab Factory MCP and CLI. Read README.md, tooling/README.md, CONCEPT.md and docs/HANDOFF.md first. Inspect existing missions before creating another. `node tooling/src/cli.mjs list` is the fallback when the host has not loaded the MCP tools.

Turn the subject into a question a person can investigate through a small working exhibit. Research actual objects and their creative communities: surprising uses, changes, contested boundaries, and failures. Keep sources, interpretation, and proposed experiments separate. A successful tool call is not a learning outcome.

Coordinate bounded roles as needed: scout discovers source evidence; builder makes one exhibit; reviewer independently challenges claims. The human chooses direction and records what they learned. Prefer existing deterministic tools for operations they already perform.

For a native subagent task, assign a local run with provider `native-codex`, launch the bounded worker through the host's native subagent tool, and link its returned task ID. Record the actual runtime; do not label native work as a Happier execution. Preserve explicit user backend choices.

For Happier-managed work, assign a local run, launch `subagents.delegate.start` through Happier, link its external run ID, then wait using `execution_run_wait`. Omit sessionId for the current session. Capture the worker's structured deliverables, not its conversation. Respect the requested backend; never silently substitute one. If dispatch fails, finish the local run as failed. If interrupted, inspect the external run before deciding it is abandoned. The store permits two active runs per mission; this is a cooperative limit, not enforcement over unrelated host workers.

Store evidence with source revision and artifact IDs. `artifact_store` requires the current `expectedRevision` to replace a named artifact. Read the current head after a stale-write error and reconsider the change. Never suppress a failed attempt by overwriting its history.

Use deterministic criteria for verifiable invariants, `judge_submit` for advisory interpretation, and human criteria for learning. Judges must cite artifact revisions; they cannot satisfy deterministic or human criteria. Unknown runtime usage stays unknown. Do not manufacture user feedback. Caller-supplied evaluator names are not authenticated identities.

The built-in Personas adapter validates projects through the existing local renderer. Render sequentially. On linuc, `LAB_COMPACT_VIEW=1 PERSONAS_ROOT=/home/nuc/projects/msteams-personas npm --prefix tooling run pilot` reproduces the successful first exhibit; without LAB_COMPACT_VIEW it deliberately exercises the observed house-layout edge. Each pilot creates a new mission. Keep original and adapted views distinct.

Close each loop with a report (`node tooling/src/cli.mjs report MISSION .lab/report.html`), precise failures and remaining uncertainties, and one invitation to inspect or change the exhibit. Do not start endless workers or declare universal automation: new subjects still need source research, an exhibit design, and possibly a module adapter.
