# MCP Lab: newcomer workbench interaction brief

Status: proposed implementation brief, 2026-11-18. Author role: learning and interaction designer; Lab Factory run `run-ccf662a0-1af0-4582-a187-4d07039959ee`. Parent coordinates sources and final selection. Read `lab/index.html`, `lab/app.js`, `lab/style.css`, and `lab/README.md`. Dynamic Practice selection supplied by parent: `8a416833d269475653861964984cb8cfb6aa37c1`, prototype + discover, advisory draft.

## Goal and present gap

Help a technically curious newcomer explain what MCP connects, try recognizable uses, then investigate its range and boundaries. MCP generally is the subject; local versus remote deployment is secondary metadata. Retain the user-approved IDE shell. Remove Teams, rooms, Personas and the earlier PDF/Excel projects from the learner-facing navigation and content; preserve historical evidence outside this experience.

The current shell has usable navigation, central content, an inspector and activity history, but its three tabs are views of one old specimen. A newcomer can move it without discovering what MCP contributes. Recorded wire messages are too prominent before the visitor knows who sends them. The replacement must organize around user tasks and connect every explanation to a visible action or outcome.

Success is not that a learner clicks every item. They should be able to distinguish an assistant's proposed action from application execution, explain why a connection exposes only particular capabilities, and recognize that a completed call does not guarantee the larger task was achieved. Automated tests cannot establish that understanding.

## Navigation and visual hierarchy

Keep four regions: left example explorer, central task surface, right contextual inspector, bottom run timeline. Use the existing restrained styling and viewport-sized shell, not an editorial introduction or dashboard of cards.

Left navigation groups tasks under **Basics**, **Possibilities**, and **Edges**. **Weird** is a filter/tag across groups, not a mandatory difficulty level. Add a labelled search field matching task name, product and concept; a Weird toggle; and a clear-filters action in the empty state. Show integration names as subtitles, not as the primary navigation vocabulary. Labels should describe tasks: “Find a note”, “Change a page”, “Operate a website”, “Edit a design together”. Final integration availability and factual claims come from the ecosystem report. In the first delivery only the notes exhibit is playable. Other source-backed examples open clearly labelled **Preview** surfaces containing the real task, relevant capability, a compact interaction concept and official source link; they must not show a Run button or invented successful execution. A preview is selectable but never counted as a completed or runnable exhibit.

Default to the first runnable Basics example. The title row contains task name, one-sentence challenge, execution-mode badge and Reset example. No welcome essay. Central tabs are **Try**, **Compare**, and **Evidence** for the active example; hide Compare when no meaningful comparison exists. This separates choosing an example from choosing its representation. Selected navigation, tab and inspector panel must be visually and programmatically identifiable.

Store active example and tab in URL hash state; browser Back/Forward restore selection without deleting the example's in-memory edits. Filter changes do not close an active example. Keep each example's independent state when switching. Reset affects the current example only and restores its fixture, choices and timeline, leaving global navigation intact. Reload starts fresh and says so in the help text; no account or persistence promise.

Above 1100 px preserve three panes. Between 780 and 1100 px allow the inspector to collapse with a visible labelled button. Below 780 px use an Examples drawer and a separately toggled inspector rather than leaving a 145 px sidebar beside a narrow central surface. Only one supplementary pane overlays the workspace at a time; Escape closes it and restores focus. The center remains the primary workspace at every width.

All core actions must work with buttons and keyboard; drag is optional. Use visible focus, real labels, proper tab semantics, and restrained status announcements. Avoid moving focus after every state update or auto-scrolling the learner through instructions. Expand raw technical material on demand.

## Proposed first exhibit: find a note, then change it

**Real-world reference:** Notion documents searching workspace content and creating/editing pages through its MCP offering: <https://developers.notion.com/guides/mcp/overview>. This supports the use-case choice, not a claim of highest adoption. A note app is recognizable without coding experience; the first task can remain read-only and understandable within a minute.

**Learning question:** how does an assistant obtain information outside the conversation, and what extra capability is needed to change it?

**Fixture:** three plainly fictional notes: “Weekend packing list” containing “water bottle, jacket, charger”; “Weekend itinerary”; and “Books to read”. The central surface has a compact note list and readable note content. A short task bar offers “Find my packing list” and, after retrieval, “Add sunscreen”. No freeform chat box in the first implementation unless a real model is connected; the two explicit actions honestly expose the bounded interaction.

**Initial state:** show the notes as the underlying application view, but mark that the assistant has not retrieved them. The visitor can inspect the notes; that does not put their contents into the assistant context. The task action produces a visible search result, then retrieval of the chosen note, then an answer with a clickable reference to the retrieved content. Selecting the source highlights the corresponding note text. Do not invent a direct content-search capability if the chosen server only supports a narrower query; validate exact operations against its current interface before implementation.

**Progressive reveal:** the default presentation is the result, not JSON. The bottom timeline narrates “Task requested → tool selected → search result → note read → answer shown”. Selecting an event opens its details on the right. An optional “Step through” mode advances those same transitions manually; running normally may complete immediately. Do not manufacture thinking delays. Explain that any synthetic tool choice and answer are scripted, while a genuine recorded choice belongs to its recorded run.

**Meaningful variable and failure:** expose **No access / Read only / Can edit** as a lab scenario control in the inspector. Read-only is the default. No access makes the scripted lookup fail without revealing a note to the assistant or altering application data; the underlying application preview remains visible to the human. Restoring Read only permits retrieval on retry. “Add sunscreen” in that mode shows an unavailable-edit result and leaves the note unchanged. Switching to Can edit and retrying appends one checklist item, highlights it, and shows a before/after diff. This is a controlled capability scenario, not a simulation of Notion's precise authorization UI. If actual-server evidence differs, preserve the distinction rather than claiming every host returns the same error. Reset restores the original list. Repeated add should not duplicate the item in the lab fixture; label this as application behavior, not an MCP guarantee.

**Compare:** show retrieved source, answer and changed application content together. Ask one optional prompt: “Which part changed the note?” Reveal an explanation after the visitor chooses, without a pass/fail learning badge.

## Explain the actors only when they matter

The inspector starts with **What happened**, offering two or three sentences linked to the selected event. **Connection** reveals a compact chain: person → AI application/host containing model and MCP client → MCP server → underlying application/data. Explain that the model can propose a tool call, the host/client manages the connection and invocation, and the server exposes capabilities and bridges to application behavior. Permission and confirmation behavior depend on implementation; MCP is not the model or the application itself.

Do not draw “MCP” as an intelligent middle agent. The protocol labels the relevant communication link. Host and client are related but distinct; server and underlying service can be colocated or remote. Keep transport and protocol versions under Connection details. **Raw messages** is the last panel, with actual captured messages or explicitly identified illustrative envelopes. Tools, resources and prompts can be introduced in later exhibits; do not falsely teach that all application content is necessarily exposed as an MCP resource.

## Execution truth and example interface

Use one of three permanent badges: **Interactive model** (browser behavior, no MCP call); **Recorded run** (captured execution, replay only); **Live connection** (actual current integration). Modes are per example/run, never inferred from visual polish. A verified source link does not turn a model into a live integration. A service account or model requirement is disclosed before connecting; no connection or inference is implied by this brief.

Each example module supplies: stable ID, title, integration label, group/tags, one learning question, source receipts, execution mode, fixture or run evidence, controls, state transition logic, central surface, inspector details, reset behavior, and acceptance scenarios. Timeline events include actor, action, outcome and evidence reference. Modelled and captured events cannot silently share the same provenance. The shell owns navigation, selection, focus and timeline presentation; the module owns its content and task state. This prevents each exhibit inventing its own navigation or misleading execution labels.

## Verification and next expansion

Before expanding, test the first whole journey: open task, fail lookup in No access, restore access and retrieve correct note, inspect source, reject read-only edit with unchanged state, enable editing, inspect exact diff, retry without duplicate, switch example and return, reset. Verify Back/Forward, search empty state, keyboard-only operation, inspector focus recovery, small viewport, and evidence-load failure. Check user-controlled strings render as text. Validate any live-server claim against captured execution, not mock success.

Ask a person to try the example without narrated assistance, then explain where the note content came from, which component changed it, and why the first write failed. Record confusion and observed behavior separately from their explanation. A model reviewer may identify misleading copy; it cannot certify human learning.

Then extend to a browser operation, multi-application composition, a shared visual surface, and a surprising capability. Attach edges to familiar tasks: revoked access, stale data, partial effects, misleading retrieved instructions. This establishes the spectrum through different actions and relationships rather than through a longer catalog of logos.
