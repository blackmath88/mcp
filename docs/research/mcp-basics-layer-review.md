# Independent review: visual MCP Basics layers

Date: 2026-11-18. Expert role: educational UX and protocol reviewer. Lab Factory run `run-a60f08c9-4675-441f-a553-cd41d7684596`, native-codex. Read the learning-layer and visual-system briefs, final application source, state/visual modules, tests and stylesheet. Parent coordinates Dynamic Practice revision `8a416833d269475653861964984cb8cfb6aa37c1` (prototype + build, advisory).

## Verdict

**Scoped pass for the visual teaching implementation at the reviewed source hashes.** The three lenses explain different aspects of the existing notes model while preserving the central notebook. They are derived from application state and explicit event metadata, rather than decorative diagrams disconnected from the demo. No blocking causal or execution-truth problem was found after the targeted corrections below.

This is source and deterministic-state review. Browser geometry, screenshots, keyboard journeys and reduced-motion verification belong to the coordinator's separate evidence. This review does not certify human understanding, a complete accessibility audit, live MCP execution, or Notion compatibility.

## What is supported by inspection and tests

- **Who acts:** the visual host encloses Model and Client. MCP is labelled on the client/server link, not represented as a thinking actor. Server and Notes app remain distinct. Explicit event metadata identifies highlighted nodes and request/result direction; combined server/application events highlight their shared segment without inventing intermediate operations.
- **What travels:** application items and the last retrieved snapshot are independently cloned into visual trays. No access leaves the assistant tray empty. An editable addition changes only the application; the earlier snapshot remains unchanged. A subsequent read synchronizes both trays and clears the mismatch indicator. Both trays explicitly name the packing list, so looking at another fictional note does not misidentify the visual data.
- **What changes:** read/edit availability is derived from the selected lab scenario and has textual as well as visual indicators. Read-only rejection leaves the source unchanged. One accepted edit adds one item; duplicate retry yields zero new changes. The count is labelled **Latest action**, preventing a later read's zero-write outcome being mistaken for zero total edits. The UI expressly limits these gates to lab choices, not a universal MCP authorization rule.
- **Historical selection:** selecting a prior event changes explanatory highlights, not current application data. The sequence says it is inspecting history while the application and trays show latest state. No historical payload is fabricated from current data. Lens and event selection paths do not call read/write state transitions.
- **Progressive explanation:** default paragraphs have been replaced by a compact diagram, item chips, capability indicators and a modelled sequence. Longer actor descriptions, source provenance and scenario caveats remain in expandable details or Evidence. The interactive-model label and no-live-AI/Notion notice remain visible. The seven other catalog entries remain previews.
- **Interaction intent:** lens buttons expose pressed state; sequence controls have labels; current highlights use borders/symbols as well as color. Native HTML text labels provide an accessible explanation rather than relying on an inaccessible bitmap. CSS has no continuous motion and retains reduced-motion handling. These are source observations, not a full accessibility assessment.

## Findings raised and addressed before this verdict

1. **Data identity:** generic “Notes app now” could imply the tray followed whichever notebook page the visitor selected. Final code names the packing list in both tray headings.
2. **Outcome count:** “0 changes” needed a time scope because source content may retain a previous edit. Final UI labels it as the latest action.
3. **Drawer focus after disclosure controls:** the inspector now contains `summary` controls and links hidden inside closed details. The previous trap omitted summaries and could choose hidden endpoints. Final code includes summaries and filters the candidate list to rendered elements.
4. **Return focus after redraw:** Change scenario can open the inspector from a dynamically recreated button. Final Escape handling resolves a connected replacement by ID, with the persistent inspector toggle as fallback, instead of focusing a detached node.

The source implements these corrections. Their actual browser behavior must be checked separately by the coordinator; no source-only keyboard pass is claimed here.

## Executed independently

- `node --test lab/notes.test.mjs lab/visual.test.mjs`: **8 passed, 0 failed**, exit 0. Five existing state tests plus three visual-state tests cover no access, read-only rejection, exact-once addition, preserved old snapshot, fresh-context scenario change, isolated reset, mismatch/reread behavior, explicit history metadata and nonmutating derived views.
- `node --check lab/app.js`: exit 0.

Initial independent test output is retained under ignored `.lab/visual-review/state-tests.txt`. The final suite was rerun after code-ready and also passed. No third-party service, model provider, account, browser session or live MCP server was exercised by this reviewer.

## Source receipt

| File | SHA-256 |
| --- | --- |
| `lab/app.js` | `2390980be97dfe94a2b4427d45bd1c333ee480a964a568ffcb61e29eab1cbad9` |
| `lab/notes.mjs` | `95acfb3acd4208b2097dfa0909c07cf942853d800c8af8dbd02e64bb84e28a6c` |
| `lab/visual.mjs` | `7a5e7e0154f2845b693039cfbc2d323ee82d6d4fda24d76e929ec7b1fd55239b` |
| `lab/style.css` | `3b433e3784470a126b49664ceb48ee9be01aa9d0dfe790da14892fc4244a8065` |
| `lab/index.html` | `5eb085bb4561664f25bb76b11fae2ec53485fb54f89392cd9199b88ff806e988` |
| `lab/notes.test.mjs` | `d590480ae5a36315a44ad8470fb8b759fec241ec5327a8afd292cb12c2356970` |
| `lab/visual.test.mjs` | `46ca625a67872f36ca42b0e65444e6a89f0ab9c512f7e82e268c415e4bb0e7a7` |

Any later layout or interaction fix requires its own receipt. A passing automated check cannot establish that a visitor understands why MCP is useful. The next human check remains: explain who knows the note contents, who performs the edit, and why a read can succeed while an edit is unavailable.

## Follow-up: containment and mobile flow

The coordinator's browser inspection found a real layout failure after the event sequence grew to 19 entries: the implicit editor grid track expanded beyond its allotted column and displaced the useful demo area. This was not detected by this review's earlier state/source checks. The builder made a narrow layout correction, which this reviewer inspected in source:

- The editor now explicitly uses `grid-template-columns: minmax(0, 1fr)`, and its children, timeline, diagram and notebook have zero minimum widths and bounded maximum widths. Sequence items retain their width within the already scrollable strip instead of expanding the editor track. Data/gate tracks likewise use zero-minimum fractional columns.
- The small-screen connection layout places You → host on one row, MCP request/result direction vertically between host and server, then Server → Notes app. Separate desktop/mobile arrow labels follow the same existing event-direction metadata; no state transition or protocol behavior changed.
- `node --check lab/app.js` passes after this change. No repeated state-suite claim is needed: `notes.mjs` and `visual.mjs` are unchanged. Browser geometry and the coordinator's pending rerun remain separate verification, not independently executed by this reviewer.

Updated reviewed hashes: `lab/app.js` **`af00fbb6b43e74020da3697f53c97fa23840625ba50896fc2abe42499ed9b36c`**; `lab/style.css` **`84e69227efcb3051b988abb4945dddd5c85168aa7f04d2f137485d17e0d50826`**. Other file receipts above remain unchanged. Source-level scoped pass stands; final containment and visible causal flow require the coordinator's actual browser results.

## Follow-up: closed-disclosure focus trap

A further coordinator keyboard check exposed a browser-specific gap in the earlier visibility filter: Chromium could retain geometry for links inside closed `details`, so `getClientRects()` alone did not identify usable tab stops. This is a real UI defect; the earlier source-level assessment was insufficient to establish the full drawer journey.

Reviewed the narrow `visibleTabStop` correction. It excludes disabled/negative-tabindex/nonrendered/visibility-hidden elements and explicitly walks closed `details` ancestors, admitting only elements within their first direct summary. Nested closed disclosures are checked independently. The trap now uses this predicate. The change affects focusable-element selection only; application, snapshot, event and diagram semantics remain unchanged. `node --check lab/app.js` passes.

Updated app hash: **`b70a51d1adb2fcbfc757ed083d873aeeb6cd7d49d91485504e278fa5c03272fb`**. The prior CSS and unchanged module receipts still apply. Source-level correction accepted; the coordinator's 11-check keyboard rerun is pending at this receipt.

The coordinator separately reports **34 visual checks passing** and desktop/mobile screenshot inspection after the containment correction. Its fixed-viewport measure counted default center/inspector paragraph words dropping from **83 to 21**. These are coordinator-reported UI observations, not independent browser execution by this reviewer, and the text measure is not a learning score.

## Coordinator completion receipt

After the final source fix, the coordinator reran `.lab/visual-qa/keyboard.mjs`: **11/11 passed**, exit0. Final visual containment/state checks: **34/34 passed**; existing interaction regression suite: **45/45 passed**. These are coordinator executions, not independent reviewer executions. Results and preserved failures are in `.lab/visual-qa/`. No human-learning result is inferred.
