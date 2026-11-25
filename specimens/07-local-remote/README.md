# 07 · Local and remote

> Who owns this server process, and whose state is it holding?

Status: simulated in the lab on synthetic data; upstream not executed. Claims below are unverified research leads.

## Anchor

[supercorp-ai/supergateway](https://github.com/supercorp-ai/supergateway)

Bridges local stdio servers and network transports.

## Where it bends

Issue history includes a child process shared across clients, reconnection handling and cleanup of abandoned sessions (issues 35, 126, 160). Some record fixes; pin the revision to reproduce.

## Lab experiment

Connect two clients to a specimen with explicit state. Disconnect one unexpectedly.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | yes, README and issues 35, 126, 160 read 2026-11-21; release notes not checked |
| Controlled mutation | gateway build (one shared process, a process per connection); reconnect, vanish, timeout |
| Actual evidence | lab simulation only: `npm run lab -- where_am_i --client A --state .lab/g.json` after two `go_to` calls |
| What this does not prove | anything about how the upstream tool behaves when run |

## Sources

- https://github.com/supercorp-ai/supergateway
- https://github.com/supercorp-ai/supergateway/issues/35
- https://github.com/supercorp-ai/supergateway/issues/126
- https://github.com/supercorp-ai/supergateway/issues/160
