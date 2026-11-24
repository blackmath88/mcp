# Real-world MCP curriculum: source-backed exhibit shortlist

Research date: **2026-11-18**. Status: research and proposed exhibit design; no third-party integration was installed or executed. Audience: technically curious newcomers. Subject: MCP generally, regardless of server location. Parent coordinates Lab Factory run `run-42eeac38-3e84-4ea1-9f70-d934c88f4b8a` and practice receipt `8a416833d269475653861964984cb8cfb6aa37c1` (prototype + discover, advisory).

Read the current `lab/README.md` and previous creative-practices research. Preserve the accepted IDE shell; replace its old project-specific specimens. The following interactions are proposals inspired by verified integrations, not claims that the lab already connects to those services.

## What “popular” can honestly mean here

This bounded search did **not** establish a global ranking of active MCP servers. Official vendor maintenance establishes provenance, not popularity. A GitHub registry article uses Playwright, Notion and GitHub as recognizable integration examples, but does not rank their active use. [GitHub registry guide](https://github.blog/ai-and-ml/generative-ai/how-to-find-install-and-manage-mcp-servers-with-the-github-mcp-registry/)

Read-only GitHub REST metadata returned these star counts on the research date: `microsoft/playwright-mcp` **39,848**; `github/github-mcp-server` **34,567**; `brave/brave-search-mcp-server` **1,584**. These are point-in-time repository-interest measurements from `GET /repos/{owner}/{repo}`, not users, installs, successful calls, or a representative ecosystem sample. They should not determine beginner teaching order.

GitHub called the earlier GitHub MCP implementation “one of the most popular” in its April 2025 announcement: vendor attribution, historical and unquantified. Its September 2026 CLI metrics explain that an MCP `interaction_count` increments on connection/reconnection attempts, illustrating why even a usage-looking number may not count tool execution. [Announcement](https://github.blog/changelog/2025-04-04-github-mcp-server-public-preview/) · [Metric definition](https://github.blog/changelog/2026-09-17-agentic-cli-customizations-now-in-the-usage-metrics-api/)

Recommendation: label this collection **“Real-world MCP uses”**. Optional evidence badges can say “official integration” or “repository interest, checked on date.” Reserve “most used” for a named population, measurement and period.

## Eight candidates, ordered by learning value

### 1. Find and update a note — Notion

**Verified:** Notion documents workspace search, page creation/editing, and database management through its MCP integration. [Official overview](https://developers.notion.com/guides/mcp/overview), mutable documentation read 2026-11-18.

**Proposed exhibit:** a fictional weekend-trip notebook with three pages. Ask where the hotel address is; reveal the selected search/read tools and the returned page. Then change a packing item and inspect the resulting document. Center: the notebook, not a JSON wall. Inspector: available tools, input, output and execution label.

**Concept:** the model does not inherently know the notebook; the application exposes operations and data. Reading an answer and changing a source are different actions.

**Edge:** access is absent, or two pages match. Show unavailable information and ambiguous results without inventing success. Live use needs a compatible host, account authorisation and accessible workspace; a fixture must be labelled a Notion-inspired simulation. Hosted integration is metadata, not the lesson title.

### 2. Search the web — Brave Search

**Verified:** Brave maintains a Search MCP server with API-key configuration and stdio/HTTP transport choices. [Official repository](https://github.com/brave/brave-search-mcp-server), default-branch README read 2026-11-18.

**Proposed exhibit:** search for a museum's opening hours. Place returned results alongside the assistant's proposed answer; change the query and inspect why the answer changes. Use synthetic museum results until real-service access is configured.

**Concept:** an MCP tool can retrieve current external information; retrieval and the model's interpretation remain separate.

**Edge:** conflicting snippets, stale results or an empty result set. A successful search is not proof that the final answer is correct. Actual calls require a Brave API key and applicable service allowance; no key or paid call was provisioned in this research. Do not call ordinary browser search performed by the lab “Brave MCP.”

### 3. Turn a bug report into an issue — GitHub

**Verified:** GitHub's official MCP server exposes repository and issue operations; remote hosting and a local alternative are documented. Host support, authentication and organisational policy affect availability. [Official server](https://github.com/github/github-mcp-server), default-branch README read 2026-11-18.

**Proposed exhibit:** inspect a fictional application's issue list, find an existing report, then draft a new issue only when necessary. Center: issue list and editable draft; confirm before the write in this learning interface.

**Concept:** tool schemas turn an intention into a specific action against a specific object; access and available toolsets matter.

**Edge:** read succeeds but write is unavailable, or retry would create a duplicate issue. Do not imply MCP itself supplies approvals or deduplication. Actual writes require appropriate account permissions and a selected repository. This is a strong developer-facing example, but less universal as the opening lesson than notes or search.

### 4. Operate a website — Playwright

**Verified:** Microsoft's Playwright MCP exposes browser automation using structured accessibility snapshots; its README distinguishes MCP from CLI-based alternatives. [Official repository](https://github.com/microsoft/playwright-mcp), read 2026-11-18.

**Proposed exhibit:** filter a fictional shop to show blue backpacks under a price limit. Center: the actual test webpage. Let visitors compare the visible controls with the structured snapshot and a sequence of browser actions.

**Concept:** MCP can expose a general-purpose instrument, not just an application API. The browser executes actions; the assistant chooses a sequence.

**Edge:** a button label changes, an element disappears, or the page navigates unexpectedly. No checkout or external purchase. Live execution requires the server, browser and compatible client; a local test page teaches a general browser capability without personal sessions. The documentation's preference for CLI in some coding workflows is a useful later comparison, not evidence that MCP is always the best interface.

### 5. Work with design structure — Figma

**Verified:** Figma documents design context and writing native content to its canvas. Remote canvas writing has account/seat constraints, including a Full seat for writes outside drafts at the time inspected. [Official introduction](https://developers.figma.com/docs/figma-mcp-server/), read 2026-11-18.

**Proposed exhibit:** select a familiar sign-up form; inspect its labels, layout and components; change a button label and observe the selected object. Contrast structured design access with merely viewing an image.

**Concept:** the assistant can receive an editable representation with identities and relationships, rather than pixels alone.

**Edge:** a selection is missing or refers to an older revision. A reconstructed canvas must not be presented as a live Figma connection. Feature access and evolving pricing require rechecking before integration. Avoid promising that every host exposes every Figma capability.

### 6. Draw together — tldraw MCP App

**Verified:** tldraw's March 2026 launch describes an interactive canvas in Cursor, three main shape-operation tools, and canvas-state feedback to chat. [Maintainer announcement](https://tldraw.dev/blog/tldraw-mcp-app), read 2026-11-18.

**Proposed exhibit:** ask for a simple journey diagram, move one box by hand, then request another change. Center: shared drawing; inspector: the state actually supplied to the assistant.

**Concept:** MCP Apps can bring an interactive surface into a supporting host. Human gestures can become new context.

**Edge:** the assistant sees stale state or undo would erase an unrelated human edit. Shared visibility does not prove conflict-safe editing. Requires an MCP Apps-capable host for a real integration; a standalone lab canvas demonstrates the interaction but not host compatibility. Tag **Weird** because the relationship changes, not because the task is complicated.

### 7. One tool contains a recipe — Cloudflare Code Mode

**Verified:** Cloudflare's implementation exposes `search` and `execute`, allowing code to discover API operations and compose them. [Maintainer account](https://blog.cloudflare.com/code-mode-mcp/), read 2026-11-18.

**Proposed exhibit:** inspect a bounded recipe that updates three fictional website settings; inject a failure halfway through and compare requested actions with actual effects. Do not execute arbitrary user code in the first version.

**Concept:** tool count does not determine capability breadth; one call can contain multiple operations.

**Edge:** partial effects and retries. Actual Cloudflare use requires appropriate account credentials and rights. A deterministic miniature recipe is a labelled conceptual model, not a Cloudflare benchmark or integration. Vendor efficiency claims remain untested here.

### 8. Acquire another tool — Docker Dynamic MCP

**Verified:** Docker documents experimental discovery/add/configure/remove capabilities. Its page explicitly says associated code mode is not yet reliable for general use. [Official documentation](https://docs.docker.com/ai/mcp-catalog-and-toolkit/dynamic-mcp/), read 2026-11-18.

**Proposed exhibit:** begin with a toolbox lacking a search capability, discover a candidate, inspect its requested access, enable it, then remove it and try a stale call.

**Concept:** tools can manage the available toolbox; discovery, activation and permission are separate events.

**Edge:** discovering a server does not authorise installation or forwarding data. Actual execution needs the supported Docker Toolkit environment and configuration. Initial lab interaction should be a labelled lifecycle model; no installation is authorised by this report. This is a later **Weird/Edges** exhibit, not an introductory prerequisite.

## Recommended first build and learning checks

Open with **“Find something in my notes”**, followed by **“Change the note.”** Use a fictional trip notebook: familiar context, visible source, short actions, immediate read/write contrast. Notion supplies the real-world reference; choosing it is a teaching judgment, not a popularity claim. A notes tool exposed by a lab-owned MCP server could provide actual protocol execution without pretending to be Notion. Alternatively a simulation can teach the flow, but must not claim an MCP exchange occurred.

Preserve the IDE: left navigation by **Basics / Possibilities / Edges**, optional **Weird** tag, center object, right explanatory inspector, bottom activity. Start with task and result; progressively reveal assistant → MCP client/server → application, tools versus returned data, and protocol versus model reasoning. Local/remote, version, host and authentication belong in the receipt.

Checks should ask whether visitors can identify where the information came from, distinguish a draft from an executed write, and explain what unavailable access prevents. Deterministic tests verify state and labels; neither those tests nor an agent judge proves that a person learned. Keep the first set small: notes, search and browser operation before expanding into all eight candidates.

This is a bounded documentation review. No full implementation audit, representative adoption survey, live service test or compatibility matrix was performed. Mutable sources must be rechecked or pinned before becoming implementation dependencies.
