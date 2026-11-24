# MCP Lab workbench

Buildless HTML/CSS/JavaScript modules. Serve `lab/` over HTTP; no dependencies or build step. Preserve the IDE interaction model: task explorer, central working surface, contextual inspector and activity timeline.

The first playable example is a **Notion-inspired interactive model**: find a fictional packing list, attempt a read-only edit, change the lab access scenario, then add sunscreen. Decisions are scripted. No Notion account, live model or MCP server is connected. Human application preview and simulated retrieved context are distinct; scenario changes explicitly start a fresh context. A retrieved snapshot does not auto-refresh when the application changes. Duplicate avoidance is lab behavior, not an MCP guarantee.

Seven other source-backed examples are **previews**, with concrete tasks, capabilities, proposed surfaces, limitations and official sources. They have no Run action. Navigation groups Basics / Possibilities / Edges, with search and Weird filtering. Hash routes retain example/tab selection through browser Back/Forward; per-example edits remain in memory until reset or reload. Mobile supplementary panes are drawers with keyboard focus handling.

Code boundaries: `catalog.mjs` supplies source-backed exhibit metadata; `notes.mjs` owns deterministic specimen transitions; `app.js` owns shell, view selection and controls. Historical data files remain preserved but are not fetched or linked by the new learner UI.

Checks: `node --check lab/app.js` and `node --test lab/notes.test.mjs`. Browser acceptance covers no-access retrieval, read-only rejection, exact-once change, source highlight, comparison snapshot, navigation/filter state, reset, mobile drawers and visible execution labels.

Private preview remains the existing Tailscale static service. Parent coordinator refreshes `.lab/scrolly-site/lab/`; this source change does not alter service configuration or publish to an external host.

Basics now includes synchronized **Who acts? / What travels? / What changes?** visual lenses. The host nests model and client; MCP labels their common interface to the server. Data chips distinguish the current packing list from the last retrieved snapshot. Read/edit lanes represent lab capability scenarios, with latest-action change counts. Manual Previous/Next controls inspect completed illustrative events without replaying writes or rewinding current data. Longer explanations and full logs are optional details. No animated inference or live MCP traffic is implied.

Visual derivation is isolated in `visual.mjs`; events carry explicit actor/stage/direction metadata. Run `node --test lab/notes.test.mjs lab/visual.test.mjs` for eight state/visual invariant checks. Browser QA separately covers layout, lenses, history selection and focus.

## Visual Basics lenses

The notes Try view now includes **Who acts?**, **What travels?**, and **What changes?**. The same specimen state drives diagrams, data chips and read/edit capability lanes. `visual.mjs` derives current visual state without mutation; event metadata identifies historical actors/stages. Previous/Next selects an explanation from the modelled sequence, never re-executes a write or rewinds the notebook. Full history and explanatory detail remain expandable.

Run `node --test lab/notes.test.mjs lab/visual.test.mjs` from repository root. Changing access starts a fresh simulated context; permissions and duplicate avoidance remain illustrative lab choices, not protocol guarantees.

## Motion and presentation

`polish.css` styles the existing IDE shell; `icons.mjs` supplies local SVG actor icons. `motion.mjs` owns presentation-only playback and native Web Animations. Running a task starts its explanatory sequence unless reduced motion is enabled. Pause it, inspect a step manually, choose **Replay**, or select 0.5× / 1× / 2×. At the end of history, Replay starts at the latest ask. Manual step selection, route changes, scenario changes, reset, hidden page and reduced-motion preference changes cancel playback. Replay never invokes specimen operations. Data trays and application remain current, explicitly labelled as such.

System reduced-motion preference suppresses pulses and moving packets. With reduced motion enabled, replay is opt-in and manual step inspection remains available. All twelve module tests run with `node --test lab/*.test.mjs`.

Framework decision for this slice: keep native modules and the established static preview. React state/components may help when multiple interactive exhibits need shared lifecycle management, but this bounded visual change does not require a migration. TanStack Router's routing/loading functionality is not required for the existing three hash views. References: [React interactivity](https://react.dev/learn/adding-interactivity), [TanStack Router overview](https://tanstack.com/router/latest/docs/overview), [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API). Revisit based on exhibit complexity, not animation alone.


The revised presentation uses a light working canvas within dark IDE chrome. A question feeds the host window, the MCP link connects client and server, and the notes application stays distinct. Current source and received context sit beside each other on desktop and stack on narrow screens. The timeline expands when events exist. Explanatory playback follows an already completed deterministic action; it does not progressively execute operations or alter the data panels. Screenshot and browser evidence for this design pass is retained in `.lab/redesign-qa/`.


## Light theme

`light.css` loads after `polish.css` and gives the workbench the same white, neutral-grey, single-green-accent theme as the public landing page and guide. It overrides colours only; layout and behaviour are unchanged.
