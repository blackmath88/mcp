# What can an MCP proxy actually see?

**Proposed Gateway exhibit and Papercut integration.** A map editor has two ways to reach the same workshop. One passes through a proxy. Can the learner tell which route was used, who allowed the edit, and whether the map actually changed?

## Three decisions on the mediated route

| Moment | Proposed proxy behaviour | Evidence and limit |
| --- | --- | --- |
| Discovery | Filter the advertised inventory by principal. Compare a canonical snapshot of tool names, descriptions and schemas with the reviewed revision. Hold changed entries for review. | Record the two revisions and the changed fields. A matching manifest says nothing about current backend behaviour. |
| Invocation | Enforce the current policy again for every call, including calls made by name from a cached inventory. Check the principal, tool revision, arguments and target. Bind any human approval to that request. Apply a separate policy to server-initiated sampling and elicitation. | Record the rule, policy revision and forward/hold/deny decision. The backend still checks access to the actual object. |
| Return | Inspect results before forwarding them to the host. A policy may redact or hold a result. | Record what was forwarded. A scanner verdict is evidence about its checks. The host decides what enters model context, and the backend may already have acted. |

One implementation worth inspecting is MCPProxy's configurable tool-change quarantine. Pin the version and configuration before comparing it with this design. The supplied names mcp-gate-policy, mcp-shield, Vault and ShieldMCP are research leads. Their reported detection rates, latency and attack-success figures are unverified here. [MCPProxy configuration](https://github.com/smart-mcp-proxy/mcpproxy-go/blob/main/docs/configuration.md)

## Where coverage ends

- **Transport.** Draw each real connection. A direct local stdio child sits outside an HTTP gateway. A host that supports a configured stdio wrapper can mediate that specific connection. Mark unknown host routes explicitly. [MCP transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- **Sequence.** Two individually permitted operations can produce a combined effect outside the user's intent. Correlate receipts across sessions and compare them with the original task and independently observed state.
- **Result content.** An unchanged catalogue can return new, untrusted text. A filtered result and a change in the model's decision are separate observations.
- **Durable memory.** A note copied into a shared graph can reach another client later. Preserve author, source revision and intended audience through storage and retrieval. Check the reader's grant when the note is used.
- **Proxy authority.** A proxy connecting to a third-party API becomes an OAuth client itself. Reusing upstream consent across downstream clients risks a confused deputy. Bind consent to the user, downstream client and requested scope, validate redirect URIs, and validate token audience. [MCP security best practices](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices)

## How Papercut could use the receipts

The proposed L0/L2 integration contributes observations on mediated routes. Document interpretation, provenance and downstream effects require evidence from other components.

| Module | Contribution from the proxy | Responsibility retained by Papercut |
| --- | --- | --- |
| M02 scope | Enforcement decision and applicable policy revision | ScopeGuard defines allowed work across proxied, local and offline paths. |
| M09 mcp-recon | Advertised manifest, upstream identity and reviewed revision | Assess meaning and provenance of descriptions. |
| M10 mcp-drift | Timestamped inventory differences | Relate changes to affected flows and prioritise review. |
| M11 chain | Correlation IDs and ordered decisions | Connect document transformations and subsequent actions to independent effect evidence. |
| M12 model-trial | Record of what the host received | Compare model choices under controlled conditions using the host transcript. |

For the ledger, retain route, correlation ID, principal alias, tool and policy revisions, direction and decision. Attach backend effect evidence by reference. Keep credentials and raw document content out of default receipts.

## Smallest exhibit

Use a fictional map, a scripted caller and one in-memory workshop. Give the editor a cached tool name, then withdraw its proxy grant. On the mediated route, expect the refreshed inventory to omit the tool and the cached call to be denied. Check the workshop counter independently. On a separately configured direct stdio route, let the workshop deny the same edit under its own policy. Expect a backend denial with no corresponding proxy receipt. Display missing evidence as “unobserved”. The learner should be able to identify the enforcing component in both cases even though the map looks identical.

This is an experiment design. A future run would use disposable fixture state and discard its receipts afterward.
