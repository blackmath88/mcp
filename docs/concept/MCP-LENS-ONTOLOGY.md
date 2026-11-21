# MCP Lens: a learning ladder and an evidence-based classifier

Proposal v0.1 · 21 November 2026. This is the lab’s vocabulary. Protocol primitives retain their specified meanings. Use the [current host direction](ADDENDUM-SPECIMENS-LENS-AND-EMBEDDING.md) and [specimen research](../research/REAL-MCP-SPECIMENS.md) alongside it.

## Learner-facing chapters

The [three-chapter learner journey](LEARNER-JOURNEY.md) groups the distinctions below into Inventory, Workshop and Follow the work. The numbered entries are stable authoring and Lens keys, exposed as optional reveals in context.

## Learning ladder

Complexity accumulates in the learner’s questions. Each step keeps the earlier questions available and introduces one new distinction. This is a teaching order; real capabilities can exhibit any combination of traits. Build phases group work differently.

| Step | New distinction | Interaction or evidence |
| --- | --- | --- |
| 1. Read | Reference versus content | Open a handbook or fetch a map. Identify what was returned and its source. |
| 2. Query | Stored content versus computed answer | Give the same map two route queries. Compare answers against the underlying map. |
| 3. Act | Answer versus effect | Move a bridge. Inspect before and after, target identity and acting permission. |
| 4. Remember | A change now versus state later | Reopen the map in another session. Identify which component retained the edit. A thinking log can store steps supplied by its caller. |
| 5. Discover and perceive | World versus caller’s view | Compare two inventories or a Playwright accessibility snapshot with the page. Ask what the caller can see and what it is allowed to do. |
| 6. Trace interfaces and placement | Entrance versus engine | Reach one operation through CLI and MCP. Locate adapter, engine and storage. Move one component without changing the contract. |
| 7. Interact | One response versus a shared working surface | Open an upstream MCP App and edit by hand. Inspect which state reaches the next caller. |
| 8. Compose | Named action versus program | Compare a fixed procedure with caller-authored operations. Observe partial effects if a middle stage fails. |
| 9. Consult and delegate | Who contributes judgement versus who controls the subtask | Request advice, then request a revised artifact. Inspect context supplied, next decision owner and acceptance criteria. |
| 10. Iterate | Single pass versus evidence-driven repetition | Let a fixture inspect and repair an artifact, then give it an unsatisfiable condition. Observe progress and its stopping reason. |
| 11. Resume | Client lifetime versus work lifetime | Disconnect after dispatch. Recover the job and identify which effects already occurred. |
| 12. Connect workshops | One outward inventory versus a network of owners | Remove one backend behind a gateway. Compare discoverable routes, affected capabilities and the actual trace. |
| 13. Inspect the inspector | Claims versus grounds for believing them | Ask Lens to profile a pinned specimen, then its own advertised interface. Review one supported claim and one fact it cannot establish. Limit self-inspection to one snapshot. |

Test design: make one change at a time in each interactive exhibit. A classifier can associate a capability with several steps and report why. Stage 3 can include a high-impact physical effect; stage 13 can be read-only. Stage number measures neither risk nor product quality.

## Taxonomy: classify each capability on independent axes

Browse the [specimen index by ontology facet](../research/REAL-MCP-SPECIMENS.md#specimens-by-mcp-lens-ontology) for examples and multi-facet capability profiles.

### Three questions for a capability profile

| Profile question | Facet keys | What belongs together |
| --- | --- | --- |
| What can I do with it? | surface, affordance, interaction | How the capability presents itself, what the caller can request and how the exchange unfolds. |
| What can it change? | authority, effect, state | Who may act on which target, what the operation can affect and what persists afterwards. Read access also has a scope and a recipient. |
| How does it work? | composition, intelligence, placement | Which parts do the work, who chooses the next action and where the parts run. |

**Evidence belongs beside every answer.** Keep observability as the tenth underlying facet. Give each claim its source and scope. A declaration can support “the server offers this action”; a particular outcome needs run evidence. Keep unknowns visible. Show the three questions as a summary for each capability within the existing learner chapters. Expand a question to inspect its facets and sources.

### Detailed classification keys

Use stable facet keys. Multiple values can coexist where evidence warrants it. A server overview groups capability profiles and preserves exceptions. A gateway exposing a job tool does not make every backend durable.

| Facet | Initial values or measurements |
| --- | --- |
| surface | tool, resource, resource-template, prompt; optional app UI or task extension recorded separately |
| affordance | read, query, mutate, execute a caller-supplied program, expose a workspace |
| effect | returns information, changes local artifact, changes external record, publishes, actuates hardware |
| state | owner, target identity, lifetime (per-call, session, persistent), version or handle |
| interaction | one-shot result, shared UI, requests additional input, asynchronous job |
| composition | atomic operation, fixed workflow, branch, bounded loop, delegated subtask, aggregation, orchestration |
| intelligence | deterministic processing, caller model, downstream model, human decision; identify who selects the next action |
| placement | location of host, adapter, engine, storage and external dependencies separately |
| authority | principal, granted scope if evidenced, affected target, data recipient and enforcement point |
| observability | advertised topology, source-supported path, observed calls, independent artifact or effect evidence |

These values are open to revision. For state, authority and placement, record individual fields independently. A tool name containing “AI” or “memory” cannot establish a downstream model or persistence.

## Ontology: the things and their relationships

| Subject | Relationship | Object |
| --- | --- | --- |
| Source URL | identifies or describes | project, registry record, deployment endpoint or document |
| Client or host | connects to | server deployment |
| Deployment | advertises | versioned capability, protocol revision or extension |
| Capability | uses an interface to reach | implementation |
| Implementation | depends on | model, service, store, person or another implementation |
| Principal | holds a grant scoped to | operation and target |
| Run | invokes | capability on a deployment under a principal |
| Run | contains | events, child runs and observed calls |
| Event | reads, creates or changes | artifact and revision |
| Claim | attributes a facet or relationship to | one scoped entity |
| Evidence | supports or conflicts with | claim |

A project can have multiple deployments; a deployment exposes multiple capabilities; the same engine can be reached through several interfaces. Give each claim a subject, facet or predicate, value, evidence kind, source locator, observation time and applicable scope (revision, deployment, caller and run when known). Evidence kinds: advertised, documented, source-inspected, runtime-observed, inferred. Report unknown explicitly. Keep conflicting claims and their scopes. A captured listing proves what the endpoint advertised to this caller at this time; its descriptions remain publisher claims about behaviour.

## From a URL to a profile

1. **Resolve the input kind.** A GitHub URL identifies source at a revision. An official registry record can describe a remote deployment or a package that must run locally. A docs page supplies documented claims. An endpoint can supply protocol evidence. Preserve links between these entities. An ambiguous page or an authentication challenge yields a partial result with a reason.
2. **Collect bounded evidence.** For a user-selected remote discovery target, use a revision-compatible MCP client, enumerate supported inventory lists and templates, and follow pagination within a budget. Report truncation, unsupported operations, missing credentials and timeouts separately from an observed empty list. For source, inspect explicitly selected metadata as data. Public URL intake needs outbound destination checks including redirects and resolved addresses. Keep local/private specimens on an explicitly configured local path. No automatic installation, tool invocation, purchasing inference or rendering remote UI upon paste.
3. **Normalize facts deterministically.** Illustrative rule IDs below. One rule emits one scoped claim and its source pointer. A description can seed a candidate label; a model may explain or suggest further inspection. Neither upgrades evidence strength.
4. **Aggregate by capability, then deployment.** Return matched learning steps, their reasons, conflicting evidence, unknowns, and the smallest observation that could resolve each important unknown. Cache by source revision or endpoint, protocol revision, access context and time; never reuse one principal’s private inventory as another’s.
5. **Offer one interface to the classifier.** A CLI or Foldkit view can call the same function as an MCP wrapper such as `profile_mcp`. For the first implementation, make `classify(evidenceBundle, rulesVersion)` pure and test it on saved fixtures. Keep external fetching separate so classification is reproducible offline. Source inspection and controlled execution are independent optional inputs.

| Rule | Input | Emitted claim | Unresolved question |
| --- | --- | --- | --- |
| surface.tool | Tool appears in a complete or partial tool listing | This deployment advertised this named tool to this caller. | Does invocation succeed for this target? |
| ui.declared | Tool has Apps metadata pointing to a UI resource | This capability advertises an app UI; candidate step 7. | Did a compatible host render it, and did a human edit reach the caller? |
| effect.hint | Tool declares a read-only annotation | Publisher describes the capability as read-only. | What side effects does the implementation permit? |
| task.support | Endpoint declares the Tasks extension | Deployment advertises extension support. | Which calls return task handles? Can the particular job resume? |
| run.changed | Trace links one call to an independently observed artifact revision change | This run changed that artifact; candidate step 3. | How long does that state persist? |

**Worked example.** A fixture listing contains a tool called `open_map` with `_meta.ui.resourceUri = ui://map/view`. Lens emits the advertised tool and UI relationship, cites the metadata field, and tags step 7 as a candidate. Persistence, edit scope, downstream models and UI rendering all remain unknown. A later controlled run supplies a host-render event; only the rendering claim changes. A human edit followed by another caller observing revision 4 adds separate state-flow evidence. A second connection that receives a 401 yields an auth-required report for that caller.

**Minimum acceptance.** Feed the same fixture twice and obtain identical claims with stable rule IDs. Compare URL kinds for the same project. Show an auth wall, a partially paginated result and a package-only record without inventing an empty inventory. Check that a UI declaration cannot produce a runtime-rendered claim and that one observed run cannot establish universal behaviour. Show the Lens result beside one existing host specimen; the classifier need not gate the first host milestone.

Protocol references: [versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning), [tools and annotations](https://modelcontextprotocol.io/specification/2026-07-28/server/tools), [MCP Apps metadata](https://apps.extensions.modelcontextprotocol.io/api/documents/overview.html), [Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/2026-07-28/tasks), [registry](https://modelcontextprotocol.io/registry/about), [security guidance](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices).
