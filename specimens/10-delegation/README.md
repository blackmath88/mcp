# 10 · Another intelligence

> When did advice become delegated responsibility?

Status: simulated in the lab on synthetic data, with scripted stand-ins where a model would be; upstream not executed. Claims below are unverified research leads.

## Anchor

[sammcj/mcp-llm](https://github.com/sammcj/mcp-llm)

Exposes access to other LLMs: a direct model-as-capability example. Maintenance needs checking.

## Diversion

- [lastmile-ai/mcp-agent](https://github.com/lastmile-ai/mcp-agent): Composes models and MCP tools through routing, parallelism, orchestration and evaluation.

## Where it bends

A specialist cannot evaluate what it never receives.

## Lab experiment

Keep the expert fixed and change only the contract: answer a question, review an artifact, deliver a validated artifact. Then remove context from the handoff.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | partly: sammcj/mcp-llm README read on 2026-11-21: tools generate_code, generate_code_to_file, generate_documentation, ask_question. Last commit date not visible. mcp-agent not read for this station. |
| Controlled mutation | map sent with the handoff, or left out; three contracts: ask, review, deliver |
| Actual evidence | lab simulation only: `npm run lab -- deliver_plan --set context=none` |
| What this does not prove | anything about the upstream project, or about how a real model would behave |

## Sources

- https://github.com/sammcj/mcp-llm
- https://github.com/lastmile-ai/mcp-agent
