# 12 · The network and the repair bench

> Is one entrance also one domain, one authority, or one workflow?

Status: simulated in the lab on synthetic data, with scripted stand-ins where a model would be; upstream not executed. Claims below are unverified research leads.

## Anchor

[IBM/mcp-context-forge](https://github.com/IBM/mcp-context-forge)

Gateway describing aggregation, virtual servers and federation across capability sources.

## Diversion

- [tavric-labs/mcp-server-fuzzer](https://github.com/tavric-labs/mcp-server-fuzzer): Malformed and realistic inputs over actual transports.
- [quanticsoul4772/mcplint](https://github.com/quanticsoul4772/mcplint): Advertised protocol-validation and security checks.

## Where it bends

A scanner passing does not establish correctness. Use fuzzers only against authorised, isolated specimens.

## Lab experiment

Assemble one inventory from two backends, collide names, remove a dependency, change a schema.

## Evidence record

| Field | Value |
| --- | --- |
| Pinned upstream revision | not pinned |
| Documented behaviour checked against source | partly: IBM/mcp-context-forge README read on 2026-11-21, truncated at about half. It describes a gateway, registry and proxy with federation and virtual servers. How tool-name collisions between backends are handled is not stated in what was read. Fuzzer repositories not read. |
| Controlled mutation | naming: first name wins or names carry the backend; dock backend up or down |
| Actual evidence | lab simulation only: `npm run lab -- call_tool --name weigh --set dock=down` |
| What this does not prove | anything about the upstream project, or about how a real model would behave |

## Sources

- https://github.com/IBM/mcp-context-forge
- https://github.com/tavric-labs/mcp-server-fuzzer
- https://github.com/quanticsoul4772/mcplint
