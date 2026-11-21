# 11 · Iteration and durable execution

> Who says "good enough", what stops the loop, and which component supplies durability?

Status: reference only; not built. Claims below are unverified research leads.

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
| Documented behaviour checked against source | no |
| Controlled mutation | not defined |
| Actual evidence | none |
| What this does not prove | not applicable yet |

## Sources

- https://github.com/lastmile-ai/mcp-agent
- https://github.com/lastmile-ai/mcp-agent/blob/main/examples/temporal/README.md
