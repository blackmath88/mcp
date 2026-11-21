# Decisions

Source of direction: owner-assistant conversation, 2026-11-21. See [conversation synthesis](concept/CONVERSATION-SYNTHESIS.md). Agreement on direction does not imply implementation approval or verified external behavior.

## D01 — Concept first

Status: agreed direction from owner request.

Document thoughts, reasoning, limitations, and open questions before enriching with concrete integrations. Reason: establish a coherent learning purpose before selecting technology and examples.

## D02 — Inventory and program-like item

Status: agreed direction from owner proposal.

Use entering a domain and discovering tools as the entry metaphor. The key reveal is an item that contains a program or map. A literal Minecraft implementation is not selected.

## D03 — CLI belongs in the main narrative

Status: agreed direction from owner affirmation.

Treat CLI/MCP overlap and fuzzy boundaries as instructive. Compare shared machinery rather than asserting human versus AI interfaces.

## D04 — Explore local/remote placement deeply

Status: agreed direction from owner request.

Investigate the location of adapters, execution, models, and state; do not reduce placement to one system-wide badge.

## D05 — Mixed capability network

Status: agreed conceptual direction from owner questions and framing.

Explore LLM-powered modules alongside algorithms, infrastructure, and databases. MCP is a connection mechanism within the network, not a mandate for every boundary.

## D06 — Authority outside prompts

Status: agreed architectural direction; educational scope assumption.

Treat enforceable identity and permissions as infrastructure rather than model instructions. This is not evidence that auth is implemented or solved by the protocol. Do not expand this lab into an identity platform.

## P01 — Inventory/network/trace interface

Status: proposed by assistant.

Synchronize three views with deployment and data-flow overlays. Validate through storyboards and learner feedback before treating as settled UI architecture.

## P02 — Synthetic shared-engine first slice

Status: proposed by assistant.

Start with one domain engine, CLI and MCP adapters, and inspectable artifacts. No live financial, infrastructure, or physical-device effects by default.

## P03 — Evidence-gated enrichment

Status: proposed process supporting concept-first direction.

Verify exact provider capabilities and protocol/client versions before adopting examples. Earlier conversational assertions are research leads, not acceptance evidence.

## D07 — Effect, Foldkit and Alchemy for the first build

Status: agreed direction from owner instruction, 2026-11-21. Implemented for the first slice.

Use the pinned versions and conventions of `blackmath88/effect-foldkit-alchemy-template` (inspected at 7b398a7). Alchemy stays an optional, gated declaration; nothing is deployed.

## P04 — Valley map as the synthetic domain

Status: chosen by the assistant under the owner's brief ("a fictional map/workshop domain is a suitable default"). Open to replacement.

Five places, paths with a span limit. One map is readable (`read_map`), queryable (`find_route`), operable (`build_path`) and carries a program (`connect_places`). The controlled failure is a lowered span limit.

## P05 — One run record across all entrances

Status: implemented proposal.

In-process, CLI and MCP adapters all return the same run record, including the engine's own events. Tests assert they are equal. The browser shows MCP frames only from a labelled recording.

## P06 — MCP SDK stays out of the browser bundle

Status: implemented proposal.

`@modelcontextprotocol/sdk` 1.32.2 is a dev dependency used only by the Node stdio server, the recorder and tests. It does not depend on Effect, so there is no second Effect runtime.

## Still undecided

Audience; hosting; exact protocol revision; offline requirements; trace retention; workflow runtime; required extensions; implementation schedule; measured acceptance thresholds.

Future changes should record date, status, rationale, evidence, and what they supersede.
