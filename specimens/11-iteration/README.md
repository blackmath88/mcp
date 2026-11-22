# 11 · Iteration and durable execution

> Who says "good enough", what stops the loop, and which component supplies durability?

Status: simulated in the lab on synthetic data, with scripted stand-ins where a model would be; upstream not executed. Claims below are unverified research leads.

## Anchor

[lastmile-ai/mcp-agent](https://github.com/lastmile-ai/mcp-agent) · `src/mcp_agent/workflows/evaluator_optimizer`

Evaluator-optimizer with quality evaluation and bounded refinement; examples include Temporal-backed execution.

## Diversion

- [lastmile-ai/mcp-agent](https://github.com/lastmile-ai/mcp-agent): Wrap a larger workflow inside the evaluator.

## Where it bends

A model rating is evidence of an assessment, not proof of correctness.

## Lab experiment

Set criteria that cannot all be satisfied. Interrupt execution and inspect what can resume.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | partly: mcp-agent evaluator_optimizer.py and the Temporal example README read on 2026-11-21. The loop: minimum rating GOOD, at most 3 refinements, returns the best-rated response; the last refinement is never rated. The README credits Temporal with durability. |
| Controlled mutation | criteria satisfiable or contradictory; engine in-memory or durable |
| Actual evidence | lab simulation only: `npm run lab -- refine_plan --set criteria=contradictory` |
| What this does not prove | anything about the upstream project, or about how a real model would behave |

## Sources

- https://github.com/lastmile-ai/mcp-agent
- https://github.com/lastmile-ai/mcp-agent/blob/main/examples/temporal/README.md
