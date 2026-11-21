# 09 · One item contains a language

> Is the unit of responsibility a tool call, an individual effect, or the whole program?

Status: reference only; not built. Claims below are unverified research leads.

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
| Documented behaviour checked against source | no |
| Controlled mutation | not defined |
| Actual evidence | none |
| What this does not prove | not applicable yet |

## Sources

- https://github.com/cloudflare/mcp
- https://github.com/maietta/mcp-code-mode-demo
