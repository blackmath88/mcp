# 09 · One item contains a language

> Is the unit of responsibility a tool call, an individual effect, or the whole program?

Status: simulated in the lab on synthetic data, with scripted stand-ins where a model would be; upstream not executed. Claims below are unverified research leads.

## Anchor

[cloudflare/mcp](https://github.com/cloudflare/mcp)

Uses code execution to expose a broad API without sending its whole specification into the model's context.

## Diversion

- [maietta/mcp-code-mode-demo](https://github.com/maietta/mcp-code-mode-demo): Community demonstration converting MCP tools into TypeScript APIs. Experimental; not a performance validation.

## Where it bends

Batching does not give transaction semantics.

## Lab experiment

Run a batch as individual calls, then as one program. Fail after the second write.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | partly: cloudflare/mcp README read on 2026-11-21. It describes search and execute tools where the model writes JavaScript run in isolated Workers, and a large token saving. It says nothing about partial failure or transactions. |
| Controlled mutation | third write fails or not; three calls versus one program |
| Actual evidence | lab simulation only: `npm run lab -- run_as_program --set fault=after-second` |
| What this does not prove | anything about the upstream project, or about how a real model would behave |

## Sources

- https://github.com/cloudflare/mcp
- https://github.com/maietta/mcp-code-mode-demo
