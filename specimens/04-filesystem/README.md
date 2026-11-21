# 04 · Filesystem

> Is the boundary defined at launch, by the client, or by the server's effective state?

Status: reference only; not built. Claims below are unverified research leads.

## Anchor

[modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) · `src/filesystem`

File operations constrained by allowed directories.

## Diversion

- [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers): Issue 3602: CLI-provided directories versus client-provided Roots.

## Where it bends

Issue 5094 reports a roots update with no valid roots leaving the previous access list active; the thread records a later fix. A historical specimen, not a claim about current builds.

## Lab experiment

Use disposable directories and change the permitted workspace mid-session.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | no |
| Controlled mutation | not defined |
| Actual evidence | none |
| What this does not prove | not applicable yet |

## Sources

- https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
- https://github.com/modelcontextprotocol/servers/issues/3602
- https://github.com/modelcontextprotocol/servers/issues/5094
