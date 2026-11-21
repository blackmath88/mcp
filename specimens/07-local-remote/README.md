# 07 · Local and remote

> Who owns this server process, and whose state is it holding?

Status: reference only; not built. Claims below are unverified research leads.

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
| Documented behaviour checked against source | no |
| Controlled mutation | not defined |
| Actual evidence | none |
| What this does not prove | not applicable yet |

## Sources

- https://github.com/supercorp-ai/supergateway
- https://github.com/supercorp-ai/supergateway/issues/35
- https://github.com/supercorp-ai/supergateway/issues/126
- https://github.com/supercorp-ai/supergateway/issues/160
