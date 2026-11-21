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
- **Velle:** the specific implementation and attributed outcomes need original sources. Metacog is identified in the second intake below. A future exhibit can compare a declared cognitive effect with an actually observed change of input or output. Host-injected input needs an origin label distinct from human-authored input.
- **Everything Wrong and Unicode metadata concealment:** keep these as defensive provenance and display-fidelity leads. Primary attribution, affected versions and scope remain open. A safe content example is a static comparison of what an approval view displayed with the complete metadata record; use a benign multilingual label. The reported number of affected implementations is unverified. [Existing boundary model](../concept/SECURITY-BOUNDARIES.md)

Keep the site’s inventory manageable. Surface one surprising neighbour next to the current station, preserve the learner’s selected artifact and let the source details open on demand.

## Second intake · What happens on the other side of a call

The same interface can return a score, change a running performance, hire a person or replay yesterday’s response. Keep the three phases visible. Let one object travel across them. The activities below are exhibit designs based on documented projects.

### Four additional finds

| Specimen | Inventory | Workshop | Follow the work |
| --- | --- | --- | --- |
| [Moontide](https://github.com/konni-arcadia/moontide) | Open a saved four-beat pattern and highlight a note. | Let the learner point at a beat and request a change there. | Show the cycle, beat, version and sounding notes supplied by the timeline. Compare the selected version with the one now playing. A gesture on the canvas supplies context that “change this” alone cannot convey. |
| [RustyNES](https://doublegate.github.io/RustyNES/docs/mcp-server/) | Display a frame and its controller input. | Branch from a saved game state and try a different move in a rights-cleared homebrew fixture. | Replay the input movie and compare end states. The documented verifier uses a fresh emulator and compares memory, framebuffer and frame counter. The movie preserves inputs within its segment. A claim about the agent’s reasoning requires other evidence. |
| [MCP-Human](https://github.com/olalonde/mcp-human) | Inspect a request for a caption for a fictional image. | Preview the task a person would receive, including reward and content. | Walk a simulated task from pending to answered. The implementation delegates via Mechanical Turk. Show the worker as the answer’s author and the service as the delivery channel. A demo fixture needs no paid task or external recipient. |
| [mcprec](https://github.com/erphq/mcprec) | Inspect a short, synthetic stdio exchange. | Replay it with the original server offline. | Show the transcript that supplied the result and the time the original exchange occurred. A replay can demonstrate the protocol while current permissions and backend state remain unknown. Evaluate this as a fixture format for the lab itself. |

### Leads from the drop, grouped by the thing the learner can inspect

| Phase | Specimen | Evidence and proposed exhibit |
| --- | --- | --- |
| Inventory | [Metacog](https://github.com/inanna-malick/metacog) | The repository resolves the earlier attribution. Show the description, returned text and subsequent prose as separate artifacts in a benign writing example. A change in prose alone cannot establish activation steering, an internal state change or a classifier bypass. |
| Inventory | [Not Obvious](https://glama.ai/mcp/servers/devladpopov/not-obvious/tree) | The published project text describes generating a baseline of common ideas and scoring candidates against it. Keep the candidate fixed and switch between two saved baselines. Label the score with its comparator and scoring method. Global originality and market novelty remain open. |
| Inventory | [Gopher and Gemini](https://cameronrye.github.io/gopher-mcp/api-reference/) | Already represented at 01 Fetch. Link directly to the existing specimen when filtering by retro protocols. |
| Workshop | [Exomem](https://pypi.org/project/exomem/0.134.2/) | Show one source note and two successive conclusions. Keep the superseded conclusion navigable. Distinguish append-only evidence operations from editable compiled notes and from the filesystem owner’s ability to edit the vault directly. |
| Workshop | [Hyperlight](https://pypi.org/project/mcp-server-hyperlight/) | Draw the host and guest file views for the same toy calculation. Reveal which fixture file is mounted. Package docs scope the roughly 40 ms readiness figure to Linux/KVM. First-call setup and image download are separate costs. |
| Workshop | [Sidedoor](https://glama.ai/mcp/servers/kemal-arslan/sidedoor) | The project listing describes deriving tools from observed browser requests and reusing a logged-in session. Use an invented local app and a static trace to show where identity comes from. Verify enforcement in a pinned release before teaching a read-only guarantee. |
| Workshop | [Sorrell Engine](https://socket.dev/npm/package/sorrell-engine-mcp) | Package metadata identifies a runner and a browser-based project. Retain as a placement lead. Obtain a tool declaration and an interaction trace before labelling which work runs in the page, the runner and the model. Challenge participation remains unconfirmed here. |
| Follow the work | [FirstAGI Arena](https://pypi.org/project/firstagi-arena/0.1.0/) | A published package exposes challenge briefs and claim status. Follow one archived brief, submission and score when a complete record is available. Attribute the score to its evaluator. Treat wider cognitive claims as the authors’ interpretation. |
| Follow the work | [AJAR paper](https://arxiv.org/abs/2601.10971) | Research example of separating an evaluation service from its execution loop. A defensive exhibit can use a static diagram showing which component proposes, runs and records an evaluation. |
| Follow the work | [A2M paper](https://aclanthology.org/2026.aacl-long.206/) | Render tool selection and observed consequence as separate events. On LiveMCPBench the authors report 93.6% macro-average malicious invocation in four scenarios on the optimized GLM-4.6 setting, and 63.6% in transfer. Neither figure measures the proportion of real-world servers compromised. |
| Follow the work | [NeuralTrust AgentCore demonstration](https://neuraltrust.ai/blog/mcp-prompt-injection) | The research team documents tool-description influence in its own multi-agent setup on AgentCore. Show the metadata author, receiving agent and authorization decision on a benign, prewritten trace. Scope the finding to the demonstrated configuration. |

**For the URL classifier.** Save the source passage behind each classification. For these examples the decisive facts are who performed the work, where state lived, and what produced the result (live action, replay, model judgment or human response). A tool name alone leaves those facts unknown. Keep that uncertainty visible when the source only supplies a package tagline.
