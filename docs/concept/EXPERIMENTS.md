# Proposed experiments and evaluation

Status: proposals only. No experiment has been executed by this documentation change.

## Design rule

Hold the user task and acceptance criteria constant while changing one architectural variable. Use synthetic data, reversible operations, explicit simulation labels, and no live credentials or paid inference by default.

## E01 — Same capability, different description

Compare vague and precise descriptions of one operation. Observe selection, input construction, and clarification. Lesson: interface quality matters; a schema is not a complete domain explanation.

## E02 — Same map, different affordances

Readable, queryable, and operable versions of a map receive the same objective. Observe which parts of the objective each can actually satisfy. Lesson: appearance and tool count do not establish scope.

## E03 — CLI versus MCP

Use a shared engine to create, inspect, and remove synthetic workshops. Compare direct CLI, thin command wrapper, and named domain tools. Observe discovery, integration effort, errors, and recovery. Do not change backend semantics between variants.

## E04 — Move a component

Run a renderer locally, then through a remote adapter or clearly labelled simulation. Keep the contract constant. Trace payloads, timing, dependencies, and failure. Lesson: logical architecture and deployment topology are separate.

## E05 — Consultation versus delegation

Use the same expert model or deterministic stand-in. First ask for advice; then delegate a bounded artifact-producing task. Observe context handoff, control of next steps, and evidence returned. No paid model call is implied by this proposal.

## E06 — Procedure versus dynamic agent

Solve one task through fixed stages and through model-selected actions. Compare output, latency, cost where measurable, failure, and inspectability. An agentic result is not presumed better.

## E07 — Bounded repair loop

Introduce an invalid artifact. Evaluate generate/check/repair cycles using explicit constraints. Stop at success, budget exhaustion, or escalation. Record attempted and completed changes separately. Test a non-converging case.

## E08 — Same contract, different implementation

Replace a model-backed capability with an algorithmic implementation or a different model. Identify which assumptions remain stable and which leak through the interface. Lesson: replaceability is demonstrated, not inferred from a common tool name.

## E09 — Aggregation versus orchestration

Expose the same backend capabilities directly and behind one coordinator. Compare caller burden, intermediate visibility, and recovery. Lesson: a unified catalogue is not the same thing as task coordination.

## E10 — Failure in the network

Inject unavailable service, invalid result, stale artifact, and partial write. Check whether the trace identifies the failing component and whether recovery repeats effects. Never claim exactly-once behavior from a successful retry alone.

## E11 — Delegation cycle

Create a synthetic A-to-B-to-A delegation path. Enforce hop, duration, and resource limits. Record a clear stopped result. Lesson: arbitrary composition needs bounded execution.

## E12 — Authority does not depend on model cooperation

Attempt an out-of-scope synthetic operation from a cooperative agent, adversarial caller, and direct request. The application boundary should reject all forbidden variants. This tests the scenario's boundary, not universal security.

## Evaluation record

For each executed experiment record:

- Hypothesis and baseline.
- Task and acceptance criteria defined before execution.
- Exact code, protocol, SDK, client, and model versions where relevant.
- Configuration and environment.
- Synthetic input and artifact references.
- Observed path, result, and failure.
- Timing and usage only when measured.
- What the result supports and does not support.
- Remaining uncertainty.

## Initial build acceptance proposal

A learner can discover one capability, execute it, inspect its trace, identify the resulting artifact, invoke the same domain operation through CLI, and explain how a richer item changes the interaction.

Implementation checks should cover truthful success/error/empty states, keyboard access, a non-spatial alternative, and reduced motion. Learning evaluation should ask the learner to explain a boundary or predict a changed configuration; do not rely solely on successful clicking.
