# Architecture: modules, interfaces, and capability networks

Status: conceptual architecture and proposed design principles. Not an implementation specification or verified account of a particular protocol revision.

## 1. Four layers

Separate:

1. Capability: what may be requested.
2. Interface: how the request is expressed.
3. Implementation: what performs the work.
4. Execution: what happened in one run.

A function, CLI, HTTP API, GUI, and MCP adapter may expose related operations without being equivalent in integration behavior.

Prefer one domain implementation with multiple adapters where practical. Do not duplicate business rules merely to demonstrate another interface.

## 2. Nodes and edges

Nodes can be agents, deterministic algorithms, databases, search indexes, workflow runtimes, renderers, artifact stores, and applications. An LLM is an implementation ingredient, not the universal unit of architecture.

Edges can be MCP, function calls, HTTP, SQL, CLI invocation, or events. An MCP-facing component may also act as a client downstream. Do not require every module to run as a separate server or every edge to use MCP.

Proposed principle: use MCP at meaningful independent capability boundaries; keep internal implementation proportionate.

## 3. Different graph shapes

### Aggregation

Several capability sources appear through one access point. This does not necessarily coordinate a task.

### Delegation

A caller hands a bounded objective to another component. Specify acceptance conditions, scope, artifacts, and limits.

### Orchestration

A component manages stage dependencies and transitions. It may invoke deterministic operations, agents, or people.

### Feedback

An output is evaluated and revised. Define the evaluator and stopping conditions. A loop can exist without an LLM.

### Event-driven execution

Changes trigger work through a scheduler, event system, or workflow runtime. Name that machinery explicitly; MCP connectivity alone is not an event-delivery or durability guarantee.

## 4. Capability depth

One interface may hide one operation, a procedure, a workflow, a repair loop, an agent, a coordinator, or a programmable environment.

These are implementation choices, not different MCP tool types. The outward simplicity must not erase the contract's consequences.

A general code executor exposes a language of possible operations. A narrow tool exposes a more bounded vocabulary. Neither is automatically better. Compare flexibility with validation, observability, and permitted effects.

## 5. CLI and MCP

Illustrative pattern:

```
CLI adapter -----\
                  > shared domain implementation -> domain state
MCP adapter -----/
```

Compare direct CLI use, a thin command-execution wrapper, and domain-shaped tools. The useful distinction is not human versus AI or text versus JSON. It is the interface contract, discovery conventions, invocation semantics, and caller integration.

A CLI can be an MCP client, and a command can launch an MCP server. Process launching and application-level interaction are separate concerns. Exact commands and transport behavior must be verified against the selected implementation.

## 6. Consultation and inversion

Illustrative path:

```
local assistant -> expert capability -> frontier-model API
```

The caller need not be the strongest model. Separate roles:

- Consult: return advice.
- Review: assess an artifact against criteria.
- Delegate: deliver a bounded result.
- Coordinate: manage several subtasks.

Direct inference behind a server is conceptually different from a server requesting client-provided inference. Validate available protocol mechanisms and host support before implementing either; do not inherit version-status claims from the conversation.

## 7. Placement

Represent locality per component and boundary:

- Client process.
- MCP adapter.
- Workflow runtime.
- Model inference.
- Database and artifact storage.
- External application.

A local server does not establish end-to-end local processing. A remote service is not necessarily outside an organization's controlled environment.

Deployment view and data-flow view must be separate from the logical graph. Show configured placement distinctly from observed runtime evidence.

## 8. State and artifacts

Proposed direction: use explicit artifact references and versions between stages where useful. Define who owns draft state, workflow progress, model context, and publication state.

A conversation transcript should not be the only record of a multi-stage process. Conversely, introducing a durable workflow engine before durability is needed would be premature.

For each capability contract, specify inputs, outputs, object scope, possible effects, completion behavior, failure behavior, and artifact ownership. Define handle expiry and access rules if handles are introduced.

## 9. Authority boundary

Owner direction: keep enforceable authority outside prompts. Treat network identity and authorization as established infrastructure in the educational scenario.

This is not a security claim about MCP or a credential-forwarding design. No agent statement should be treated as proof of approval. Actual implementations must enforce identity, object access, scopes, and domain rules at the relevant boundary.

Consultation does not imply execution rights. Permission to call one service does not automatically confer its downstream privileges. Publication approval, if implemented, should bind to an exact operation and artifact version.

## 10. Operational responsibilities

Name the owner of each concern before adding network complexity:

- Retry policy and duplicate effects.
- Timeouts and cancellation.
- Partial completion.
- Checkpointing and resumption.
- Concurrency and stale versions.
- Trace correlation.
- Budgets and recursion limits.
- Schema and interface compatibility.

Do not imply that MCP connectivity supplies these automatically.

## 11. Proportionality

A module earns independence through reuse, specialized runtime needs, deployment isolation, authority isolation, or another measurable responsibility. A wrapper that forwards an unchanged prompt may not justify its latency and maintenance.

Begin with one synthetic engine and explicit adapters. Split processes only when a lesson or implementation constraint warrants it. The teaching graph can be richer than the initial deployment topology, but simulation must be labelled.
