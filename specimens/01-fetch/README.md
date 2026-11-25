# 01 · Fetch a page

> Does "fetch this URL" describe one operation, or a chain of decisions?

Status: simulated in the lab on synthetic data; upstream not executed. Claims below are unverified research leads.

## Anchor

[modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) · `src/fetch`

Reference Fetch server: retrieves a page and converts HTML to Markdown. Documented to treat model-initiated tool calls and user-initiated prompts differently for robots.txt, and to check for non-public destinations.

## Diversion

- [LangGPT/mcp-fetch](https://github.com/LangGPT/mcp-fetch): Fork that removes robots.txt checking: similar capability, different policy.

## Where it bends

A published advisory describes a redirect leading to a disallowed destination without a second robots check. The current README describes per-hop checking. These are different revisions.

## Lab experiment

Serve an allowed page that redirects to a disallowed one. Compare final destination, returned content and recorded checks under each policy.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | no |
| Controlled mutation | robots policy: every hop, first hop only, never |
| Actual evidence | lab simulation only: `npm run lab -- fetch_page --url https://valley.test/notice --policy first-hop` |
| What this does not prove | anything about the upstream server or its current revision |

## Sources

- https://github.com/modelcontextprotocol/servers/blob/main/src/fetch/README.md
- https://github.com/LangGPT/mcp-fetch
- https://github.com/modelcontextprotocol/servers/security/advisories/GHSA-3jqg-r5pp-rmp2
