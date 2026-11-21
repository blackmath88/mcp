# 13 · Inspect the inspector

Status: simulated. The lab's own Lens (`src/domain/lens.ts`) exposed as two tools, `profile_server` and `profile_self`.

## What is the lab's own and what is upstream

- The rules, the fingerprint and the self-inspection are this lab's proposal. See `docs/concept/MCP-LENS-ONTOLOGY.md`, step 13.
- `modelcontextprotocol/inspector` is named as the reference for inspecting a listing. It was **not read** for this station; nothing here is attributed to it.
- The recon note in `docs/research/2026-11-21-mcp-recon-and-bounty.md` shaped the rules. It is unverified.

## Evidence record

| Claim | Basis |
| --- | --- |
| The same listing gives the same profile | observed: test in `src/domain/lens.test.ts` |
| A changed description is reported against its pin | observed: tests in `src/domain/later.test.ts` and `src/adapters/in-tab-mcp.test.ts` |
| Self-inspection takes one snapshot | observed: `profile_self` returns one profile of two tools; there is no tool that profiles a profile |
| Inside this station the inspected server is the lab's catalogue | by construction; no connection is made |
