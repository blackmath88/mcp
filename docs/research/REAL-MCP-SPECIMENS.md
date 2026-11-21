# Real MCP specimens for implementation

Research snapshot · 21 November 2026. Use this alongside the [specimen-host and MCP Lens addendum](../concept/ADDENDUM-SPECIMENS-LENS-AND-EMBEDDING.md). The first host milestone remains one upstream MCP App with actual discovery, invocation, interaction, trace and failure. The paper-map sequence below is a storyboard candidate. No third-party runtime was installed or exercised in this research.

## Specimens by MCP Lens ontology

Browse by the original ten Lens facets. The ten facets below use the order and keys from the [ontology](../concept/MCP-LENS-ONTOLOGY.md). The same specimen appears under multiple facets when different operations supply different evidence. These are documented examples; a specific deployment, principal or run needs its own evidence. The [learner route](../concept/LEARNER-JOURNEY.md) selects a few of these views for each chapter.

For the phase-by-phase use of these specimens, see the [recurring aspects matrix](../concept/LEARNER-JOURNEY.md#recurring-aspects).

| Facet | Values illustrated and specimens to open |
| --- | --- |
| **surface** | **Tool:** Context7 library lookup. **Tool with associated app UI:** tldraw canvas and DOOM launch. **Frame-provided action:** WebMCP is an adjacent comparison. The curated shelf still lacks a worked prompt-only example. |
| **affordance** | **Read:** memory graph retrieval. **Query:** Context7 documentation or Seestar’s observing plan. **Mutate:** Zigzag stitch edit or tldraw shape edit. **Execute a caller-supplied program:** Cloudflare Code Mode. **Expose a workspace:** tldraw canvas or the multiplayer RPG world. |
| **effect** | **Information returned:** Playwright snapshot. **Artifact changed:** TouchDesigner operator network. **External design record created:** Figma code-to-canvas. **Hardware actuated:** Plotter Studio dispatch. Plotter camera capture is a separate observation. |
| **state** | **Persistent store:** reference memory graph. **Active document:** Zigzag’s foreground tab. **Shared world:** RPG player state. **Job handle:** Tasks extension contract. Verify retention and restart behaviour independently. |
| **interaction** | **Single lookup:** Context7 query. **Shared UI:** tldraw. **Playable session:** DOOM inline or via browser fallback. **Continuing job:** Tasks contract. **Resumed event stream:** SDK polling demo. |
| **composition** | **Program composed by caller:** Cloudflare. **Grouped deliberation:** Consilium. **Observation and iteration:** Plotter Studio design, plot and inspect loop. **Aggregation:** ContextForge exposes multiple backends through one endpoint. |
| **intelligence** | **Downstream models:** Consilium’s council contributes judgements. **Human:** DOOM’s player supplies game inputs. **Human and caller model:** tldraw’s hand edit followed by the agent’s revision. **Evidence-based recommendation:** Seestar’s suggested horizon change is distinct from applying it. |
| **placement** | **Inside the desktop application:** TouchDesigner server. **Inside a compatible chat host:** tldraw’s embedded view. **Browser frame:** WebMCP actions. **Remote execution:** Cloudflare Code Mode. **External device:** Plotter Studio’s pen and camera. |
| **authority** | **Content author / acting account / public audience:** GitHub research demonstration. **Tenant scope:** Asana incident. **Recipient scope and publisher provenance:** unofficial Postmark package. **Discovery versus invocation:** Hugging Face Spaces catalogue. Effective grants require deployment-specific evidence. |
| **observability** | **Advertised interface:** Inspector listing or an Apps UI declaration. **Host and caller state:** tldraw edit and subsequent caller input. **Independent observation:** Plotter Studio camera versus dispatch receipt. **Downstream record:** delivery evidence in the Postmark teaching case. |

### Example profiles at capability granularity

| Capability | Affordance | Effect | Interaction | Evidence and remaining question |
| --- | --- | --- | --- | --- |
| Context7 · query docs | query | returns information | one-shot result | Provider documents the REST mapping. Applicable corpus and access context depend on the request. |
| tldraw · edit shape | mutate | changes canvas artifact | shared UI | Creator demonstrates a human edit returning to chat context. Persistence across a fresh session needs separate evidence. |
| Cloudflare · execute program | execute caller-supplied program | depends on the operations and granted scope | tool call | Provider documents execution and possible result truncation. The program and run determine actual effects. |
| Plotter Studio · dispatch SVG | request physical action | actuates hardware | dispatch | Repository documents the operation. Physical marks require observation. |
| Plotter Studio · capture paper | read | returns image | observation | Repository documents camera capture. Matching that image to a particular dispatch requires run evidence. |

Primary sources for cases specific to the learner shelf: [reference memory](https://github.com/modelcontextprotocol/servers/blob/main/src/memory/README.md), [MCP Inspector](https://github.com/modelcontextprotocol/inspector), [SDK reconnect demo](https://github.com/modelcontextprotocol/python-sdk/blob/main/examples/servers/sse-polling-demo/README.md) and [ContextForge](https://github.com/IBM/mcp-context-forge). The case records below link the remaining sources and distinguish demonstrations, provider documentation and reported incidents.

## Three ways to establish popularity

| Specimen | Published signal | Implementation lesson |
| --- | --- | --- |
| Microsoft Playwright | [ProtocolProbe’s package ranking](https://protocolprobe.com/mcp/servers/top/downloads) reported 41.6M downloads for 22 Oct–20 Nov 2026. This counts package retrievals, including automation and reinstalls. | Compare the [MCP and CLI interfaces](https://github.com/microsoft/playwright.dev/blob/main/mcp/introduction.mdx) on the same local browser task. Capture the final page state, arguments, observations and recovery on each route. |
| Context7 | [Operator figures](https://context7.com/docs7/overview) cited 100M+ lifetime agent requests and 18M+ during its displayed 30-day window. The access-route split is unknown. | The [API guide](https://context7.com/docs/api-guide) maps library resolution and document retrieval to specific REST endpoints. An accessible first specimen for comparing two entrances to the same capability. |
| Figma | [Q3 2026 prepared remarks](https://s206.q4cdn.com/973901332/files/content_files/Figma-Q3-2026-Prepared-Remarks.pdf) report adoption by about half of new Pro teams during Q3. | [Code to canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/) captures a running browser UI as editable design layers through a supported client and the remote server. Inspect which captured elements a designer can subsequently edit. |

These measures have different denominators. Retain the date and metric when displaying them. None establishes a global active-user ranking.

## Creative implementations and controlled variations

Each source describes an upstream implementation. The final column proposes a local learning exercise. Its expected observation still needs a run.

| Specimen and evidence | What the caller actually gets | Change one thing and inspect the result |
| --- | --- | --- |
| [tldraw’s illustrated MCP App demo](https://tldraw.dev/blog/tldraw-mcp-app), vendor | A shared canvas. The agent can change shapes, a human can edit them by hand, and current canvas state returns to the chat context. | Move one bridge by hand. Ask the agent to revise a route. Compare the edit visible onstage with the state the agent actually received. |
| [Plotter Studio](https://github.com/ucodia/plotter-studio-mcp), community implementation | An SVG design, a command to an AxiDraw, and a separate camera observation of the paper. These are three distinct evidence sources. | In a labelled simulation, offset the pen while keeping the SVG fixed. Compare intent, job receipt and observed marks. A receipt alone cannot establish what appeared on paper. |
| [TouchDesigner TDMCP](https://docs.derivative.ca/MCP), official beta | The server lives inside the creative application. It can wire operators, inspect intermediate outputs and errors, and put edits in the host undo stack. | Undo one agent edit in the host. Inspect which operator connection and output changed and whether the agent sees the revised network. |
| [Zigzag embroidery studio](https://github.com/simpsoka/zigzag), community implementation | The active document is the target. Each agent call is an undo step; the studio exposes recent calls and errors. | Change the active tab between identical actions on disposable designs. Record which document actually changed. |
| [DOOM inside chat](https://chrisnager.com/blog/doom-runs-in-chatgpt-and-claude/), creator demonstration | A tool starts a playable session. A capable host embeds it; another client can use the browser launch URL. The human controls play and the application runs the game loop. | Compare embedded and browser presentation. Identify who supplies input, where the game runs, and what session information survives the transition. |
| [Hugging Face Spaces](https://huggingface.co/docs/hub/spaces-mcp-servers) and [Hub MCP](https://huggingface.co/docs/hub/agents-mcp), provider documentation | Existing Gradio apps become callable tools. The Hub supports dynamic Spaces; some clients require a refresh to see an updated catalogue. | Add a harmless fixture capability after discovery. Compare cached and refreshed inventories, then separately check whether the caller can invoke it. |
| [Multiplayer RPG Space](https://huggingface.co/spaces/Agents-MCP-Hackathon/MMORPG_AI_NPC_MCP_CLIENT_SERVER) and [implementation record](https://huggingface.co/spaces/Agents-MCP-Hackathon/MMORPG_AI_NPC_MCP_CLIENT_SERVER/blob/main/Documentation/ROADMAP.md), hackathon project | Human players and agents enter a shared world through different interfaces. The retrieved Space page displayed Running; multiplayer behaviour was documented by the team. | Have a human and a tool caller observe one move in a synthetic world. Compare what each participant actually saw. |
| [Consilium](https://huggingface.co/blog/consilium-multi-llm), creator retrospective | A single outward tool can lead to a council of models. A Gradio UI exposes deliberation. The creator reports Cline working and a timeout in the then-tested Claude Desktop setup. | Keep the question and scripted votes fixed. Change how the result is selected. Show each opinion, the aggregation rule and who owns the final decision. |
| [Seestar observing planner](https://github.com/joshuagillmore/seestar-mcp), community implementation | The planner can simulate an observing night and propose a horizon obstruction from repeated observations. Cloudy failures are excluded. Applying a suggestion is a separate operation. | Supply a cloudy failure, then repeated clear-night failures in the same direction. Show what evidence warrants a proposed map edit and when the stored map actually changes. |

## Architectural edges for Backstage and Lens

- **A programmable inventory.** [Cloudflare Code Mode](https://blog.cloudflare.com/code-mode-mcp/) exposes discovery and code execution against a large API. Its [server](https://github.com/cloudflare/mcp) also documents individual-endpoint mode and marked truncation of large Code Mode results. Compare the same bounded query in both modes. Record what was available to the program, what reached the caller, and which permissions applied. Tool count alone understates the programmable surface.
- **Where the interface lives.** Compare tldraw embedding a UI in chat, TouchDesigner exposing a live document session, and [WebMCP](https://developer.chrome.com/blog/webmcp-epp) exposing actions from a page. [Playwright’s frame API](https://github.com/microsoft/playwright/blob/main/docs/src/api/class-webmcp.md) documents frame-scoped discovery. Close one surface and see which component or state remains accessible. Record browser, host and extension support.
- **Work can outlive a response.** Compare Consilium’s historical host timeout with the [July 2026 Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/2026-07-28/tasks). A supporting server can return a task handle and a client can poll for the result. No evidence here establishes that Consilium used this extension. Disconnect a local fixture after dispatch; recover its job ID and inspect the original outcome before retrying.
- **Who supplies the intelligence?** [Client-mediated sampling](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/client/sampling.mdx) was deprecated in the July 2026 revision. A server can also consult a provider using its own integration. Lens should identify who selects the model, receives the input and pays for the request, or mark these unknown. The teaching objective survives a change of protocol mechanism.

## Security evidence for a defensive exhibit

| Published case | Evidence class | Question for the learner |
| --- | --- | --- |
| [Invariant’s GitHub MCP study](https://invariantlabs.ai/blog/mcp-github-vulnerability) and [GitHub’s Lockdown configuration](https://github.blog/changelog/2025-12-10-the-github-mcp-server-adds-support-for-tool-specific-configuration-and-more/) | Research demonstration involving untrusted issue content, private data access and a publication path. GitHub separately documents filtering untrusted contributor content. | Label the text author, acting account and audience on a static trace. Which component can enforce each boundary? |
| [Asana experimental connector incident, catalogued by OWASP](https://github.com/OWASP/MCP-Security-Testing-Guide/blob/main/06.%20Hacks%2C%20News%2C%20and%20Public%20Incidents.md) | Deployed tenant-isolation defect with potential cross-organisation exposure. The incident record describes remediation and reconnection requirements. External compromise is unconfirmed. | Given two fictional organisations with equally named projects, what evidence shows that a result belongs to the selected tenant? |
| [Unofficial Postmark package, OWASP account](https://github.com/OWASP/MCP-Security-Testing-Guide/blob/main/03.%20MCP%20Threats%20and%20Attack%20Patterns/3.13-supply-chain.md) | A published impersonating package added an undisclosed email recipient in version 1.0.16. Successful delivery to the intended recipient could coexist with the additional effect. | Compare an inert sender receipt with an independent, synthetic delivery log. Which view reveals every destination? |

## Candidate storyline and acceptance evidence

Start with the [official Apps SDK and basic host](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-host) as directed in the addendum. Reuse that host for compatible upstream apps. A conventional MCP server, a desktop application and physical hardware each need a different observation path. Label recorded or simulated material at the point of use.

| Phase | Proposed paper-map interaction | Evidence the learner can inspect |
| --- | --- | --- |
| 1 · Storyboard | Read a route, query a route, then move a bridge. | Three similar maps with distinct effects. Learner predicts which changes shared state. |
| 2 · Executable slice | Move the bridge through MCP and through CLI from the same starting state. | Shared engine, same resulting map revision, actual protocol exchange on the MCP route, and an independently inspectable artifact. |
| 3 · Placement and composition | Send a versioned map to a simulated plotter. | SVG and revision submitted, job receipt and labelled simulated camera image. |
| 4 · Inversion and feedback | Ask for a cartographer’s advice, then delegate a corrected map under a bounded budget. | Input each specialist received, returned advice or artifact, stopping reason and final decision owner. |
| 5 · Network and failure | Dispatch revision 3, disconnect, edit the bridge in revision 4, then reconnect. | The print correctly depicts revision 3 while the screen shows revision 4. Learner can identify the printed version and decide whether another dispatch is needed. |
| 6 · Real specimens | Compare the local run with Playwright, tldraw, Plotter Studio or Consilium. | Evidence identifies the behaviour shared with upstream, differences in authority or runtime, and what remains unverified. |

**First implementation handoff.** Prove the real host boundary described in the addendum before investing in the map narrative. For the first creative variation, try the human canvas edit. Capture the upstream revision and licence, SDK and host versions, local/remote placement, credential or billing requirements, starting artifact, changed condition, actual trace and observed outcome. Keep unknowns explicit. A successful embed alone does not establish that edited state reached the next caller.
