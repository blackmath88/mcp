# MCP Basics: visual explanation system

Status: proposed implementation specification, 2026-11-18. Visual explanation specialist, Lab Factory run `run-9412734e-b2f9-4898-b69c-010e170f7fc5`. Read current `lab/index.html`, `lab/app.js`, `lab/notes.mjs` and the prior learning-workbench brief. Parent coordinates practice revision `8a416833d269475653861964984cb8cfb6aa37c1`, prototype + build, advisory.

## Keep the object; change the lens

The existing center demonstrates an effect, but explanation is mostly in paragraphs at the right. Add one compact visual explanation area directly above the notebook, inside the center workspace. It remains visible while the person uses Find / Add. It shares the demo state.

Use a labelled segmented control: **Connection · Data · Read & write**. Default to Connection. Changing a lens does not reset the task or change application state. Keep Try / Compare / Evidence as workspace views; lens controls exist inside Try, so browsing evidence remains distinct from choosing how the demo is explained.

Allocate at most 160 px above the notebook at desktop size. Central content retains priority. Remove the existing long simulated-context paragraph and repetitive capability explanations; replace them with a short state caption, visible object tokens, and optional inspector details. Retain the permanent Interactive model badge and one concise explanation of scripted behavior.

## Lens 1: Connection — who does what?

Render a horizontal native HTML/CSS diagram:

`You → [ AI application / host: Model → MCP client ] ⇄ MCP ⇄ [Server] → [Notes app]`

The host is a visibly enclosing group containing two smaller labelled components. MCP labels the communication link; it is never a box or a thinking agent. The Notes app component visually matches the notebook below and carries a small connector down to it. Server and application remain distinct. Use simple line/arrow shapes and six-word captions: Model “proposes an action”; Client “sends the request”; Server “exposes operations”; App “reads or changes data”. 

Choose a timeline event to highlight its actor or link. Use an outlined active shape plus a numbered marker, not color alone. Completed actions illuminate the corresponding route, not every component simultaneously. The current app combines server/application events; display their joint segment until events gain finer actual distinctions rather than inventing sub-events. On a successful read, show a labelled **result** arrow returning toward the client; the model then produces the answer. No animation of hidden thought.

## Lens 2: Data — who has seen what?

Show two aligned token trays:

- **Notes app now:** Water bottle · Jacket · Charger.
- **Retrieved for assistant:** empty outlined tray labelled “Not read yet”.

After Find, copy the three visible chips into the second tray; connect them with a read/result arrow. Keep the first tray unchanged. After an editable Add, append a **+ Sunscreen** chip only to the app tray. The retrieved tray remains the old snapshot until another Find. Mark the unequal trays with **Different versions**, not a failure symbol. The discrepancy is the lesson.

No-access leaves the assistant tray empty while the human can still see the notebook. A scenario change clears the simulated context, so show **Fresh run** beside the emptied tray. Keep the explicit caveat in accessible detail: actual access revocation does not erase previously obtained data. Source selection highlights the current app tray and notebook; Compare remains the place to inspect the older snapshot.

## Lens 3: Read & write — what can happen?

Display two labelled lanes, **Read → result** and **Write → changed note**, each with a capability gate. Read-only shows Read available and Write unavailable; No access closes both; Can edit opens both. A blocked action ends at its gate with an octagonal stop symbol and **Unavailable**, while the unchanged app tray remains visible. An allowed edit reaches the app and displays the added item. Label the gate **Lab scenario**, not “MCP security”; it does not reproduce Notion authorization or promise protocol-enforced permissions.

Duplicate Add shows **Already present · 0 changes**. That behavior is attributed to this example's application, not MCP. Keep the access selector adjacent to this lens when practical; otherwise use a visible “Change scenario” button that opens/focuses its inspector control.

## Synchronization and text budget

Derive diagrams from `access`, `retrieved`, `items`, `outcome` and `selectedEvent`; do not maintain competing visual state. Initial state explains the current relationship before any action. Clicking a timeline event changes a highlighted explanation, never rewinds the actual notebook. Label it **Inspecting step N; application shows latest state** when necessary. Reset restores initial visuals and data; switching lenses preserves them.

Use one caption of approximately 12–20 words beneath the lens. Inspector default becomes a concise event explanation plus expandable source/limitations; raw event JSON stays in Evidence. The visitor should identify read/write and data ownership without reading a paragraph.

## Accessibility and checks

Use buttons with selected state and visible focus. Give the diagram a concise accessible description; decorative arrows are hidden from accessibility APIs. Use text, arrow direction, symbols and border styles as well as restrained semantic colors. Avoid continuous motion. Optional short transitions respect reduced motion and must not delay state correctness.

On narrow screens, stack host/server/app vertically or use a compact two-row layout; never shrink labels below readable size. Data trays become vertically aligned; gate lanes remain full-width. The notebook stays in the same workspace and can scroll internally. Verify lens switching preserves edits, no-access never populates the retrieved tray, blocked writes leave source unchanged, successful writes create a visible mismatch, re-read synchronizes it, reset clears it, and keyboard focus survives every redraw. These checks verify the visual explanation's fidelity, not human learning.
