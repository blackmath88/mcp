# MCP Exploration Lab

Status: working concept derived from the owner's conversation on 2026-11-21; detailed design proposals remain open. No implementation or external integration verification is claimed.

> Discover an inventory of capabilities, open the workshop inside an item, then zoom out to see the network of workshops.

## Purpose

Build an exploration lab that makes MCP understandable through its possibilities, limits, and architectural edges. Begin with simple capabilities and progressively reveal programs, applications, workflows, models, agents, and networks behind the same outward interface.

The project must go beyond 'an AI can call a tool.' Its central question is:

> When an AI gains access to a capability, what has it actually gained access to?

The answer may be information, an operation, building materials, an interactive application, another intelligence, or an environment for composing new operations. These distinctions matter more than a wall of integration logos.

## Origin and owner direction

The owner proposed a Minecraft-inspired inventory metaphor: entering a domain reveals what can be used there. The crucial extension was an inventory item that is itself a program or map. Subsequent questions introduced CLI overlap, local and remote execution, models exposed through tools, inversion toward frontier-model consultation, workflows, iteration, and a network of mixed software modules.

The owner requested a coherent concept first, detailed arguments and criticism, and real-world examples afterward. This repository records that direction before choosing an implementation stack.

The source conversation is consolidated in [Conversation synthesis](docs/concept/CONVERSATION-SYNTHESIS.md). That document preserves distinct ideas and their development, not a verbatim transcript. Repeated turns are collapsed. Assistant suggestions are not silently treated as owner decisions.

## Audience and learning outcomes

Initial audience hypothesis: technically curious builders and mixed technical teams. Exact audience and facilitation format remain open.

Learners should be able to:

1. Separate a capability, its interface, its implementation, and an actual execution.
2. Compare MCP with CLI and APIs without false dichotomies.
3. Follow data and execution through local and remote components.
4. Distinguish consultation, delegation, workflow, iteration, and dynamic action selection.
5. Understand how LLM-powered, algorithmic, storage, and infrastructure modules compose.
6. Identify when an abstraction provides leverage and when it hides unnecessary complexity.
7. Separate possible network paths from the path actually executed.
8. Recognize unverified claims and limits of a demonstration.

## Narrative

1. Enter a domain and discover its inventory.
2. Use a simple instrument or operation.
3. Open a strange item containing a program or interactive map.
4. Find another entrance to the same implementation: CLI.
5. Trace where work runs: local, remote, and mixed.
6. Compose operations into workflows and bounded feedback loops.
7. Invert intelligence: the caller consults or delegates to a stronger model.
8. Zoom out to a network of modules with explicit responsibilities.

The precise ordering of CLI and the strange-item reveal may be tested in storyboards.

## Architectural position

Software is the network. MCP is one possible connection contract within it. Not every node is an agent, and not every edge should be MCP.

Prefer shared domain implementation with replaceable access adapters. Agents propose and compose; application code enforces domain constraints and permitted effects. Treat network identity and authorization as established infrastructure for the educational scenario, not as a claim that MCP automatically solves security.

## Experience model

Use synchronized views:

- Inventory: what this participant can discover and use.
- Network: components, responsibilities, and dependencies.
- Trace: what actually occurred in one run.

Deployment and data-flow overlays reveal where processing and storage occur. An accessible outline or table must carry the same meaning as the spatial graph.

## Smallest useful outcome

A synthetic domain with a readable artifact, one bounded operation, one richer program-like capability, a shared CLI/MCP implementation, and an inspectable execution trace.

Acceptance proposal: a learner discovers an operation, executes it, identifies the implementation and resulting artifact, reaches the same domain operation through CLI, and explains what changes when a richer capability is opened.

Do not begin by building a universal agent platform or a production mesh. Each extra layer must teach something observable.

## Non-goals

Not a general-purpose agent platform, identity provider, universal gateway, workflow engine, integration directory, trading application, physical-device platform, or literal Minecraft clone. Not an argument that MCP replaces all other interfaces or that agents are always the best implementation.

## Evidence policy

Conversation records establish intent, not external technical truth. Earlier protocol-version, feature-status, SDK, and provider claims require fresh primary-source validation before implementation. No prior claim about sampling, discovery, bidirectionality, tasks, or client support should become a requirement merely because it appeared in the discussion.

## Updated direction: real specimens and the meta layer

The follow-up direction selects Effect/Foldkit/Alchemy as the application stack, reuses existing tools as working specimens, and adds discovery plus MCP Lens as an explanation layer. This supersedes the earlier implication that stack choice was entirely open; it does not imply that the application or specimen host has been implemented.

Read the [concept addendum](docs/concept/ADDENDUM-SPECIMENS-LENS-AND-EMBEDDING.md) for the chapter-by-chapter anchors and diversions, actual MCP Apps embedding, REST/MCP discovery comparison, Lens evidence model, critical limits, and the next Claude build milestone.

The existing Python/HTML registry example remains an untested REST adapter example, not a substitute for a real MCP connection or the planned Foldkit host.

## Read next

- [Updated specimens, Lens, and embedding direction](docs/concept/ADDENDUM-SPECIMENS-LENS-AND-EMBEDDING.md)
- [Narrative and learning design](docs/concept/NARRATIVE.md)
- [Architecture and composition](docs/concept/ARCHITECTURE.md)
- [Critical questions](docs/concept/CRITICAL-QUESTIONS.md)
- [Experiments and evaluation](docs/concept/EXPERIMENTS.md)
- [Conversation synthesis](docs/concept/CONVERSATION-SYNTHESIS.md)
- [Decisions](docs/DECISIONS.md)
- [Plan](docs/PLAN.md)
- [Handoff](docs/HANDOFF.md)
