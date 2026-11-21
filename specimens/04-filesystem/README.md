# 04 · Filesystem

> Is the boundary defined at launch, by the client, or by the server's effective state?

Status: simulated in the lab on synthetic data; upstream not executed. Claims below are unverified research leads.

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
| Documented behaviour checked against source | yes, README and issues 3602 and 5094 read 2026-11-21; not pinned to a commit |
| Controlled mutation | server build (roots replace, roots only narrow, before the fix) and client roots updates |
| Actual evidence | lab simulation only: `npm run lab -- read_file --path /valley/mill/ledger.txt --roots /valley/mill` |
| What this does not prove | anything about how the upstream server behaves when run |

## Sources

- https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
- https://github.com/modelcontextprotocol/servers/issues/3602
- https://github.com/modelcontextprotocol/servers/issues/5094
