# MCP Basics: visual learning layers

Status: build recommendation, 2026-11-18. Learning-designer role; Lab Factory run `run-4260553e-dee4-41c0-a86b-16cbb5734702`. Read current `lab/index.html`, `app.js`, `notes.mjs`, `catalog.mjs`, existing state tests and newcomer design brief. Parent supplies Dynamic Practice receipt `8a416833d269475653861964984cb8cfb6aa37c1`, prototype + build, advisory. This is a pedagogical design proposal, not research evidence that users learned.

## The specific gap

The demo changes the right states, but explanations live in paragraphs and logs. Preserve the notebook and task buttons; add synchronized visual explanations rather than a separate lecture. At 1440×900 the first screen must show both a useful notebook and the compact lens diagram.

Four beginner questions determine the layers:

1. **Who does what?** A model can propose; a host/client invokes; a server exposes operations; an application reads or changes data.
2. **How does outside information reach the assistant?** A request goes out; a result comes back. Seeing the application yourself is not the same as supplying its content to the model.
3. **Why can reading work while changing fails?** Available capabilities differ. The lab's read-only scenario stops an edit before a write; this is one implementation choice, not a universal MCP permission algorithm.
4. **Why use MCP at all?** It provides a common communication interface between a host/client and different servers, rather than making every application connection the same. Keep this a short visible label on the connection, not a new protocol essay.

## Three lenses, one central specimen

Add a compact **Explain** control beside the task: **Who acts? / What travels? / What changes?** Default to Who acts. These are lenses on the same state, not new examples or replacement page tabs. Retain Try / Compare / Evidence and current navigation. A lens change never executes a task, resets the fixture, or silently changes access.

**Who acts?** Use a stable schematic above the notebook: a host container containing two labelled parts, **Model: proposes** and **Client: sends**, connected to **Server: exposes** and **Notes app: reads/writes**. Put **MCP** on the client↔server connection, never inside an actor box. The application should visually connect to the actual notebook below. A selected event lights the relevant actor or link and shows one sentence of at most roughly twelve words. The initial diagram is useful before any action: no active route and an empty assistant-context marker. Labels remain visible without hover.

**What travels?** Reuse the same positions but emphasize directional request/result arrows and small labelled payload chips: `Find packing list →`, `← note contents`. Beneath or beside the notebook, replace the long assistant paragraph with a **Received by assistant** tray. It begins empty. Retrieval fills it with three item chips; the app still owns its own list. A write adds Sunscreen only to the app list; the earlier received tray stays unchanged until another read. The diagram should make that contrast visible without requiring a paragraph.

**What changes?** Show two operation chips, **Read** and **Edit**, with available/unavailable icons plus text. Bind them to the existing scenario selector. Read-only lookup highlights Read and returns content; attempted edit stops at the unavailable Edit chip and shows **0 changes**. Editable retry highlights the app and adds **+ Sunscreen · 1 change**. Duplicate retry shows **Already present · 0 new changes**. These badges report fixture behavior, not MCP guarantees. Avoid claiming authority is represented by a literal wire gate.

## Guided encounter and replay

Initial invitation: **“Find a note. Watch what reaches the assistant.”** After a successful read, offer **“Now try changing it.”** After rejection, point to the scenario selector with **“Read and edit are different capabilities.”** Do not auto-switch access or steal keyboard focus. A compact four-stop progress strip can show **Ask → Request → Result → Answer** for the last lookup. Each stop selects its explanation and highlights the diagram, with Previous/Next buttons.

This is an explanatory replay of an already completed scripted action. Label it **Modelled sequence**; no fake thinking delay, inference trace or latency. The notebook remains labelled **Application now**. If the replay shows historical payload values, capture them with the run; do not derive an earlier event's payload from mutable current state. Default replay highlights actors/links with a clear historical-event caption; knowledge trays always show current state. Use explicit stage/operation metadata rather than matching human-readable event prose.

## Reduce prose, retain truth

Keep the execution badge and one short model disclaimer. Move provenance, live account requirements and longer actor descriptions into Evidence or expandable details. Replace repeated retrieved-item paragraphs with the received tray, the ordered actor list with the schematic, and default raw-event rows with the compact sequence. Full logs remain accessible. Mobile uses the same diagram vertically; the central task is never replaced by an inspector drawer. Reduced-motion users get identical state highlights without animated travel.

## Acceptance and learning evidence

Verify diagrams update from the same state as the notebook; no-access leaves the received tray empty; read-only edit shows zero changes; edit adds once without refreshing the prior read; changing lens does not mutate; replay cannot apply an edit; reset clears highlights and replay. Test keyboard lens/step controls, visible focus, text alternatives, non-color status cues and compact viewports. Keep the existing explicit rule that a scenario change starts a fresh simulated context—revocation alone does not erase knowledge.

A human check remains separate: ask the visitor to predict whether an assistant knows a note they merely opened, identify who changed the saved list, and explain why the read succeeded but the edit failed. Record their explanation or confusion; no automated “understood” badge.
