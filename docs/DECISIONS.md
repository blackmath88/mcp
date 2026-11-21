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

## D08 — Simulation first; live MCP waits for real examples

Status: agreed direction from owner, 2026-11-21.

The lab does not need a live MCP connection yet. Browser chapters stay simulated on the shared engine, with MCP evidence shown as labelled recordings from the real server. Live connections are reconsidered when real-world examples are added. MCP work is planned now (see docs/PLAN.md).

## D09 — IDE-style layout

Status: agreed direction from owner, 2026-11-21. Implemented.

Journey (easy to complex) and kit stay visible in a left sidebar, the workbench sits in the middle, evidence is a bottom panel, the inspector is on the right. Later chapters are listed as planned so the whole path is visible.

## D10 — A route of twelve specimens, each with a bend

Status: agreed direction from owner, 2026-11-21. Data and navigation implemented; one station simulated.

The lab follows the owner-supplied route from Fetch to the network (see specimens/README.md). Every station gets an anchor, a diversion and a "bend it" experiment, starting with the basics. Stations are specimen folders, not integrations to install. Upstream claims stay unverified until an evidence record says otherwise.

## D11 — Less text on screen

Status: agreed direction from owner, 2026-11-21. First pass implemented.

Detail moves behind fold-outs; the workbench shows the question, the control and the result.

## D12 — One station becomes the pattern before more breadth

Status: decided by the assistant at the owner's request ("you decide"), 2026-11-21, after external review. Implemented for station 08.

Station 08 is the reference interaction: the specimen is in the centre and is moved directly; three readings of one state (person, model, tool result) sit beside it; evidence opens on demand. The other eleven stations keep their text-box benches until this pattern has been tried with a person. Navigation follows the three learner phases from docs/concept/LEARNER-JOURNEY.md. Browsing between stations keeps each station's state; reset is explicit and per station.

## D13 — A real MCP client and server run inside the page

Status: agreed direction from owner ("really do some stuff in the middle", pointing to lil-beavrs, where real programs run in the browser), 2026-11-21. Implemented.

Every run in the lab is now a real `tools/call` from the official SDK client to the lab's own MCP server, both in the tab, joined by the SDK's in-memory transport. The frames are captured and shown. The data stays made up and nothing crosses a network. This supersedes P06 (SDK kept out of the browser bundle) and narrows D08: "simulation" now describes the data and the stand-in models, not the protocol. The SDK is imported on demand, so it loads on the first run.

## D14 — Live session, server-listed kit, call console, and the dashboard look

Status: agreed direction from owner ("do it all"), 2026-11-21. Implemented.

The page keeps one MCP session open. The kit in the sidebar is the server's answer to `tools/list`; entering a station is a real `enter_domain` call, after which the server announces a changed tool list and the client lists again. A call console sends whatever JSON the person writes straight onto the wire. The look follows the approved design canvas: one neutral family, one accent, hairlines, the question as the headline, an evidence rail, and a light Backstage drawer.

## D15 — Every bench is touched directly; real Python where the program is the subject

Status: agreed direction from owner ("do it for all stations ... python stuff where it makes sense"), 2026-11-21. Implemented.

No station asks the person to pick a tool from a list and press Execute. The things on the bench are the controls. Station 09 runs real Python in the tab through a locally served Pyodide, and its writes are real MCP tool calls. Python is not added to stations where it would only decorate. The page opens on a home screen that shows the whole route.

## Still undecided

Audience; hosting; exact protocol revision; offline requirements; trace retention; workflow runtime; required extensions; implementation schedule; measured acceptance thresholds.

Future changes should record date, status, rationale, evidence, and what they supersede.
