# 06 · CLI, reversed

> Which parts discover a change dynamically, and which are generated artifacts that go stale?

Status: simulated in the lab on synthetic data; upstream not executed. Claims below are unverified research leads.

## Anchor

[modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector)

An instrument for inspecting a server's capabilities and exchanges.

## Diversion

- [openclaw/mcporter](https://github.com/openclaw/mcporter): Calls servers from scripts and the terminal, and generates a standalone CLI from a server's tool definitions.

## Where it bends

A generated CLI is a snapshot of a schema.

## Lab experiment

Generate a CLI, then change the server's schema.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | partly, generator doc and README read 2026-11-21; the snapshot question is not settled there |
| Controlled mutation | server schema version (v1, v2 adds a required field); regenerate |
| Actual evidence | lab simulation only: `npm run lab -- call_generated --state .lab/c.json --server-schema 2` after `generate_cli` |
| What this does not prove | anything about how the upstream tool behaves when run |

## Sources

- https://github.com/modelcontextprotocol/inspector
- https://github.com/openclaw/mcporter
- https://github.com/openclaw/mcporter/blob/main/docs/cli-generator.md
