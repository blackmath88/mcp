# Narrative and learning design

Status: proposed experience design based on the owner's direction. The lab is not implemented.

## 1. Teach through a changing mental model

A basic tool-call demo is necessary but insufficient. It explains the mechanics of one request while leaving the scope of the exposed system unclear. The narrative should repeatedly show an apparently familiar item, then reveal a richer relationship behind it.

Every chapter needs a question, an observable interaction, and a limitation. Avoid a sequence of animations that merely restates the narration.

## 2. Enter the domain

Opening an inventory answers: 'What is available here?' Begin with a small synthetic domain rather than several unrelated APIs.

Candidate items: scanner, handbook, blueprint, workbench, preview instrument, publication mechanism. These are explanatory representations, not literal MCP categories. A technical inspector must distinguish tools, resources, and prompts.

Show capability descriptions, inputs, outputs, and effects. Do not imply that discovering an item grants permission to use it.

The domain remains undecided. Departmental page creation is a useful discussion example, not a selected product requirement.

## 3. The strange item

The owner introduced the key surprise: an inventory item can be a program or map itself.

Present three similar maps:

- Readable: contains information.
- Queryable: answers questions over a domain.
- Operable: provides a control surface for preparing or performing changes.

Use the same learner objective across all three. For example, connecting two fictional places may mean identifying a route, comparing constraints, or preparing a construction operation. Keep this synthetic; no existing game behavior is assumed.

The lesson is that appearance does not determine authority or operational scope.

## 4. Breadth versus depth

A shelf of many narrow tools demonstrates breadth. One item opening a rich environment demonstrates depth. Both are needed, but they are different dimensions.

An item card should answer:

- What can I observe?
- What can I request?
- What does it produce?
- What can change?
- Does it finish now or continue working?
- What does it depend on?

Reveal complexity progressively instead of dumping every field on first encounter.

## 5. The CLI comparison

Show the same engine through CLI and MCP. The comparison should undermine magical thinking without reducing MCP to 'just another CLI.'

Keep implementation constant. Compare discovery, argument expression, output interpretation, error recovery, and integration with another caller.

A sophisticated CLI may already provide machine-readable discovery and structured output. A poor MCP wrapper may expose little more than a command runner. Preserve these fuzzy edges.

## 6. Local and remote

Open an item to reveal its execution path. Switch between logical and deployment views. Move one backend while preserving the external contract.

A local adapter can call a remote model; a remote organization service can keep downstream computation inside its environment. The educational point is to ask about the whole path, not award a local/cloud badge.

The interface should show synthetic payloads crossing boundaries. Never imply that a visualization of a configured path is proof of actual runtime behavior.

## 7. Processes inside items

Introduce procedure, branching workflow, feedback loop, and agent-selected action as different control structures. Do not present them as an inevitable ladder toward a superior agentic architecture.

Keep one task and one acceptance condition constant. Learners should observe what each added layer contributes and costs.

## 8. Intelligence inversion

The caller can be a small or local model while a capability consults a frontier model. Model strength and architectural role are separate dimensions.

Demonstrate consultation first: an assessment returns and the caller decides. Then demonstrate delegation: a specialist owns a bounded subtask and returns an artifact and evidence.

Make the handoff inspectable. A specialist cannot evaluate information it never receives. Do not represent delegation as automatic correctness.

## 9. The network reveal

Zoom out from one workshop into mixed modules: models, algorithms, databases, renderers, workflows, and review interfaces.

Distinguish aggregation from orchestration, and dependencies from feedback loops. Show actual calls separately from possible connections.

The culminating question is not 'How many MCP servers can we connect?' It is 'How much useful complexity can we compose while keeping responsibility understandable?'

## 10. Visual grammar

Three synchronized primary views:

| View | Meaning |
| --- | --- |
| Inventory | Available interface from one participant's perspective |
| Network | Structural dependencies and responsibilities |
| Trace | Events and results from one execution |

Optional overlays: placement, data movement, identity scope, artifacts, cost, and timing.

Required distinctions: simulated/live; available/authorized; proposed/applied; planned/executed; missing/failed; documented/verified.

Use text labels as well as color. Provide keyboard access and a non-spatial outline. Respect reduced motion. Do not require following animation to understand the system.

## 11. Where the metaphor stops

The inventory is a perspective, not the complete system. One participant may see a different catalogue from another. Items can depend on remote services, return handles, require additional input, or expose programs rather than fixed actions.

The city-of-workshops metaphor is useful only while it improves understanding. Do not force databases, events, or identity boundaries into decorative game objects when a clear diagram is better.
