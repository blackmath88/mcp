# Boundary-bending MCP specimens

Research intake, 21 November 2026. Use these as optional examples inside the [existing journey](../concept/LEARNER-JOURNEY.md). Station numbers refer to Claude’s twelve-station implementation. The entries describe source material and propose interactions. No provider, model, device or third-party server was run. Support, costs and tested revisions still need recording when an example moves into the host.

## Three exhibits to prioritise

| Phase and station | Specimen | Put this onstage | Reveal in Backstage |
| --- | --- | --- | --- |
| Inventory · 01 Fetch | [Gopher & Gemini MCP API](https://cameronrye.github.io/gopher-mcp/api-reference/) | Give the learner a Gopher menu and a Gemini document from saved fixtures. Follow one entry in each. | Show original content, protocol and the structured result available to the caller. The project also exposes local trust-store operations. Remote content retrieval and local state change have different effects. |
| Workshop · 08 Interactive app | [ComfyUI live-canvas bridge](https://github.com/Open-Bio/openbio-comfy-mcp) | In a labelled local or recorded specimen, edit one node after inspecting the workflow. Compare the graph seen by the agent with the graph queued for rendering. | The bridge documents inspection, editing and queuing of the open canvas. Capture exact graph revisions and the output artifact to establish which version ran. This extends station 08’s human-view versus model-context lesson into creative production. |
| Follow the work · 12 Network | [Meta Chess implementation](https://github.com/Aitem/metachess) and [hackathon organiser](https://www.metabase.com/blog/metabase-ai-hackathon-winners) | Replay one turn on a board. Select the same move as a player, referee or spectator. Keep the board position fixed while switching perspectives. | The agents read through Metabase MCP. A separate chess bridge validates and writes moves. Postgres stores state; the dashboard renders the spectator’s view. Label the documented architecture and any locally simulated events separately. |

## Additional specimens by phase

### Explore the inventory

- **Glinx · 01 Fetch.** Sensor declarations become discoverable tools. Its package documents a built-in mock and distinguishes implemented drivers from planned ones. Compare a raw reading with its labelled unit and timestamp. [Package documentation](https://pypi.org/project/glinx/)
- **Unconventional Thinking · 02 Memory / 03 Thinking.** The project describes compact metadata, filtering and deferred retrieval through resource links. Compare the same saved collection returned in full versus returned as references, then open one item. Measure bytes and tokens with a named tokenizer including follow-up reads. Its README cites 98.7% in discussing a pattern; a project-specific measured reduction is unverified. [Project](https://github.com/stagsz/Unconventional-thinking)
- **Dead Cowboy · 02 Memory, revisited in 12 Network.** Typed claims can wait at a coordinate for a later participant. Show two schema-valid observations that disagree. Compare author, time and corroboration. Restricting free text narrows one input channel; it cannot establish truth or guarantee safe downstream interpretation. [Project](https://github.com/terradev-cloud/deadcowboy-mcp)

### Open the workshop

- **DOOM · 08 Interactive app.** Retain the existing case. The creator documents inline and browser launch paths, a browser runtime and Freedoom content. Compare what the tool initiates, what the human controls and where frames are rendered. [Build notes](https://chrisnager.com/blog/doom-runs-in-chatgpt-and-claude/)
- **genart.dev · 06 CLI / 09 Programmability.** Compare one seed or parameter across two renders. The hosted tool reference lists 298 tools and the CLI repository describes 33 built-in MCP tools. Record the surface and version when quoting counts; the supplied 281/26 figures are unverified here. [Platform tool reference](https://docs.genart.dev/mcp-tools) · [CLI](https://github.com/genart-dev/cli)
- **NovelForge and StoryForge · 02 Memory / 09 Composition.** NovelForge documents a story bible, memory cards and chapter review. StoryForge’s package documents an illustrated-story workflow. Show what persists when a character description changes between drafts. Check the actual tool schemas before assigning named stages to either implementation. [NovelForge](https://novelforge.stackfield.org/) · [StoryForge](https://pypi.org/project/StoryForge/0.1.0/)
- **Halyn and OpenMHP · 04 Scope / 07 Placement.** Halyn documents enforcement rules and an audit chain; OpenMHP documents an instrument integration layer. Use a mock device to distinguish policy evaluation, permission and a device receipt. Enforcement applies to paths actually mediated by the component. Hardware coverage and bypass resistance require independent evidence. [Halyn release](https://pypi.org/project/halyn/2.2.2/) · [OpenMHP package](https://www.npmjs.com/package/openmhp-cli)

### Follow the work

- **Octopus Protocol · 09 Programmability / 12 Network.** The authors report a coding agent discovering OS-visible hardware and generating both typed tools and adapter code. This extends Cloudflare’s lesson: the callable interface itself becomes an output. Display a recorded device description, generated schema and resulting operation; a local mock can illustrate the distinction. The paper reports four hosts and an unattended repair failure. The supplied arm timing and generality of driver-free control are not established by the abstract. [Research paper](https://arxiv.org/abs/2605.09055)
- **Free Will MCP · 11 Iteration.** The author describes self-prompting, ignoring a request and resuming later. Trace which host or process supplies a subsequent turn and where text persists. A scheduling mechanism is observable; consciousness is an interpretation. [Project](https://github.com/gwbischof/free-will-mcp)
- **SynapBus, Okto Nexus, hummbl-bus and Fabric A2A · 12 Network.** Compare one fictional handoff across designs. SynapBus offers a human-facing activity view. Okto Nexus documents agent sessions and durable messages. The hummbl-bus package describes a signed TSV log and warns about implementation drift. Fabric A2A documents Redis Streams for queued tasks. Inspect sender, storage and acknowledgement separately. [SynapBus](https://synapbus.dev/) · [Okto Nexus](https://github.com/OktoLabsAI/okto-nexus) · [hummbl-bus 0.2.0](https://pypi.org/project/hummbl-bus/0.2.0/) · [Fabric A2A](https://github.com/AetharaAI/Fabric-A2A)

## Leads still needing attribution or stronger evidence

- **Multiplayer Quiz, session, Agent Bus:** exact project identities or specified tool contracts remain unresolved. Use Meta Chess for the shared-state lesson meanwhile.
- **Metacog and Velle:** the specific implementations and attributed outcomes need original sources. A future exhibit can compare a declared cognitive effect with an actually observed change of input or output. Host-injected input needs an origin label distinct from human-authored input.
- **Everything Wrong and Unicode metadata concealment:** keep these as defensive provenance and display-fidelity leads. Primary attribution, affected versions and scope remain open. A safe content example is a static comparison of what an approval view displayed with the complete metadata record; use a benign multilingual label. The reported number of affected implementations is unverified. [Existing boundary model](../concept/SECURITY-BOUNDARIES.md)

Keep the site’s inventory manageable. Surface one surprising neighbour next to the current station, preserve the learner’s selected artifact and let the source details open on demand.
