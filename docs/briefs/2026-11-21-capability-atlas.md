# Brief: the capability atlas and the tool inventory

For: an agent continuing the MCP Lab in `blackmath88/mcp`.
From: the owner, with a review of the repository as it stands on 2026-11-21.

This brief says **what** we want and **why**. It does not say how. Read the code, then decide the how yourself. Where this brief and the code disagree about a fact, the code wins; say so in your handoff.

---

## 1. Where the work stands

- Branch `ccr-b2cae2d3-sz8xvr`, head `c051fa9` ("Quality pass…") when this was written. Check the branches and working tree first. Do not reset to an older commit and do not assume `main` is current.
- Read before you change anything: `AGENTS.md`, `docs/HANDOFF.md` (top three entries), `docs/DECISIONS.md` (D09 to D15), `docs/concept/`, `specimens/route.json`.
- Stack stays: Effect, Foldkit, the MCP SDK running in the tab. Do not replace the framework or rewrite the app to introduce a map.

What already exists and must keep working:

| Thing | Where | Why it matters here |
| --- | --- | --- |
| 28 capabilities with name, title, description, `affordance` (readable / queryable / operable / program), input kind, card facts | `src/domain/capabilities.ts` | This is the data the atlas and the icons hang on. One source. |
| 13 specimens, each with a direct-manipulation bench | `src/lab/benches.ts` | These are the "working objects" behind the map. Keep them. |
| A real MCP session in the tab: `enter_domain` → `notifications/tools/list_changed` → `tools/list` | `src/adapters/in-tab-mcp.ts`, `lab-server.ts` | This is real evidence of what a server **exposes**. |
| Sidebar "Handed to you here" list, built from the server's `tools/list` answer | `kitView` in `src/lab/view.ts` | The seed of the hotbar. Today a click only inspects. |
| Inspector: wire frames, capability card, five questions about the last run | `inspectorView` | The seed of "selected capability" and "which capability did this". |
| Backstage tabs with truthful mode labels (actual MCP, in-process engine, recorded, app messages) | `backstageView` | Do not blur these labels. |
| Home screen: stat tiles plus three columns of station cards | `homeView` | This is what the atlas replaces or absorbs. |
| Real Python in station 09 (Pyodide, each write a real `tools/call`) | `src/adapters/python-runner.ts` | The "programming capability" demo. |
| 148 tests: domain, adapters, Foldkit story and scene | `src/**/*.test.ts` | Scene tests assert on visible names and roles; expect to update them. |

---

## 2. The problem we are solving

"MCP" is a bucket word. It gives nobody a picture of what a connection hands over. One connection may hand over a file reader, a memory, a browser snapshot, an interactive map, a state-changing operation, a programming environment, a workflow, another intelligence, or a gateway to several of those.

The lab now shows each of these well **once you are inside a station**. What it does not do:

1. **Nothing tells the kinds apart at a glance.** The home screen is thirteen cards of the same shape. The kit in the sidebar is a text list with a small "ask / act / read / program" tag. A file reader and a workflow look alike until you read.
2. **The same tool looks different in every place.** A row in the kit, a button on the bench, a line in the frames, a title in the inspector. There is no one object the eye can follow.
3. **The navigation still implies a course.** Stations are numbered 00 to 12, grouped into three phases in a fixed order, the valley has seven steps with a "Next:" button, the home screen says "Start in the valley" and tags cards "visited / not yet". That was the right first shape. It is the wrong final one: someone who cares about memory should walk straight to memory.
4. **Who owns the list is unclear.** "Handed to you here" mixes three different statements: the server exposes this, this caller may use it, this run used it.

So the next iteration is one idea:

> A capability atlas with recognisable tool objects, tied to an inventory and a nine-slot hotbar.

The atlas answers "what kinds of thing exist". The inventory answers "what does this server expose, right now". The bench answers "what happens when I use it". The evidence answers "which of them did that".

This is not decoration. If the map does not explain something a list could not, it has failed.

---

## 3. Principles, each with its reason

### 3.1 The user chooses the entrance

No required order, no completion gates, no progress score, no funnel disguised as a map.

*Why:* people arrive with one question. Forcing a route in front of it loses them, and the specimens were built to stand alone anyway.

What this means for what exists: station numbers, phase order, "visited" tags, "Start in the valley" and the valley's seven steps all need a second look. Stable ids stay internally. A suggested route may remain as an optional aid. Prefer verbs like explore, open, inspect, try, compare, related.

### 3.2 Four things stay distinct

- **Capability family**: a broad kind of behaviour (reading, querying, perceiving, remembering, changing, composing, delegating). These are *our* teaching groups, not MCP protocol categories. Say so on screen.
- **Specific capability**: one recognisable operation (read a file, recall a fact, take a snapshot, write a ledger entry, run a program, ask an expert).
- **Implementation / specimen**: the concrete thing that demonstrates it. One can expose several capabilities; several can expose comparable ones.
- **Server**: exposes capabilities. A server is not a family and not a region.

*Why:* the commonest confusion about MCP is exactly the collapse of these. If the map draws "one server = one neighbourhood", it teaches the mistake. The same object must be explainable by family *or* by provider without becoming two objects.

The existing `affordance` field has four values. The families above are finer. Decide whether to extend, map, or add a field; keep one source of truth in the domain layer and keep `src/domain` free of DOM and Foldkit imports.

### 3.3 One icon per capability, everywhere

Original, slightly pixel-art tool icons. The pixel treatment lives in the tool objects only; text, panels and forms stay modern and quiet. No Minecraft assets, textures or branding.

Starting vocabulary, as guidance and not a spec:

| Behaviour | Motif |
| --- | --- |
| Read | book or loose sheet |
| Query | question / answer bubble |
| Perceive | glasses or viewfinder |
| Remember | notebook or index drawer |
| Change | lever, stamp, a concrete implement |
| Compose | workbench or program strip |
| Delegate | dispatch envelope with a return marker |
| Workflow | a small connected mechanism |
| Gateway | junction |
| Interactive application | a viewport holding an interface |

Within a family, capabilities need distinguishable variants: read file = loose sheet, fetch page = sheet with a globe tab, store fact = notebook with pencil, recall fact = a pulled index card, snapshot = viewfinder, write entry = stamp, run program = workbench with a code strip.

*Why:* "a book is something you read; glasses change what you can perceive." The picture should carry the difference before the word does. And the same picture in the atlas, the inventory, the hotbar, the inspector and the run evidence is what lets someone say "that one did it".

Rules: icons always come with a visible name and an accessible label. No icon-only puzzle. Details must survive the smallest size you render. Colour is never the only cue.

### 3.4 The atlas is a curated explanation, and says so

- Ground or neighbourhoods group related capabilities.
- Objects are specific capabilities.
- Provider boundaries appear when asked for.
- Connections are named relationships, shown on selection or in an explicit view, not all at once.
- Selecting reveals details and related objects. Entering opens the existing specimen. Returning keeps your place.

A first cut could be three neighbourhoods: read and perceive / remember and change / compose and delegate. Rename them if the real data suggests something clearer. Do not grow the taxonomy to fill space.

*Why:* position must mean something the user can be told in one sentence. It is a hand-arranged layout, not a similarity score, so nothing may suggest that distance is measured. Fixed positions, no self-arranging graph: stable places are what make a map learnable.

Reference for the *principle* only: `blackmath88/lil-beavrs`, `lessons/01-broken-access-control/index.html` and `05_recon_map.py`. Take: a continuous ground, a readable overview, entering an object without losing where it is, layers on demand. Leave: the linear machine rail, CRT frames, hacker-terminal look, decorative cables, seasonal effects, its tech.

### 3.5 Inventory and hotbar: nine is a belt, not a limit

Discrete slots, tool sprites, clear selection, optional `1`–`9` keys, the selected item's name and one line of explanation, and a way to the full inventory.

- A server with fewer tools shows fewer. No filler.
- More than nine must be reachable and visibly "more".

A fact about the current data you need to handle honestly: each simulated server exposes one to four tools. No single one exceeds nine. The whole catalogue is 28. So the "more than nine" case exists for an all-servers view (or the network/gateway specimen), not for any one server. Demonstrate overflow where it is true; do not pad a server to prove the point.

**Ownership is always labelled.** "Tools exposed by the Memory server", "Available to this caller", "Your bench". Never "tools handed to the model" unless a model is really part of that experiment; today every model is a scripted stand-in and the status bar says so.

**Three verbs, never merged:** a server *exposes*; a caller *has access to*; a run *used*.

**Selecting is not executing.** A slot click or a number key selects and inspects. It must never write, fetch, run code or delegate.

*Why:* the hotbar is the most game-like element, so it is where a wrong habit would form fastest. If pressing `3` could write to a ledger, the lab would teach that tools fire by accident. The benches already own execution through understandable direct actions; the hotbar connects to them and does not add a second generic "run" path. This also settles an open inconsistency from the last review: the sidebar kit only inspects while the bench runs. Make "inspect" the declared, visible meaning of the belt.

Do not intercept `1`–`9` while focus is in the Python editor, the call console, or any other editable field.

### 3.6 Map, belt, inspector and evidence move together

This is the most important interaction requirement.

- Select on the map → the matching belt entry highlights if present.
- Select on the belt → the same capability is located on the map.
- Open a server → the tools it actually exposes appear.
- Select a tool → description, input, effects, implementation context.
- Run something on the bench → the real operation is marked in the evidence.
- Select an observed operation → the responsible capability highlights.
- Return to the atlas → context is kept.

*Why:* each surface alone is something the lab already has in rough form. The value is that they are visibly the same object. Make that understandable in a still frame; do not rely on animation to carry it.

Not everything on screen at once. The bench needs room: the last review measured the Backstage drawer taking half the workbench at 900 px height, and benches like Memory and Python already scroll. The atlas is a way in and a way to explain, not a permanent layer over the experiment.

### 3.7 Authority and evidence stay honest

Keep apart: discovered, available, authorised, approved for this invocation. Show a state only when the app has evidence for it. "Unknown" is a fine answer.

What the app can actually know today:

| Statement | Evidence |
| --- | --- |
| This capability is in the lab's catalogue | curated, from `capabilities.ts` |
| This server advertises this tool now | observed, from the real `tools/list` reply |
| This tool was called and answered | observed, from frames and the run record |
| This caller is authorised / this call was approved | **none**. The simulation has no approval step. |

So the last row is shown as unknown or not shown, never implied.

Do not let the picture carry meanings it has no evidence for: height is not authority, an open path is not access, green is not safe, discovered is not verified, a simulated boundary (station 04) is not an operating-system sandbox. And do not let one colour mean family, selection, success, authorisation and trust at once. The current palette already assigns meaning (emerald accent, amber for model/stale, sky for server, rose for failure); extend it deliberately or use shape, outline and label instead.

*Why:* the lab's whole claim is that it tells the truth about what happened. A pretty map that hints at permission would undo that.

### 3.8 What is real stays labelled

Keep the existing distinctions visible: actual MCP messages over an in-memory transport, synthetic data, scripted stand-in intelligence, recorded evidence, real in-browser execution (Python). The atlas topology is a configured explanation. A run highlight is observed execution. Two layers; never animate an invented run as if it were traffic.

Out of scope for this iteration: live model inference, installing or connecting to servers the lab does not ship, any deployment or cloud provisioning (`npm run infra:deploy` stays untouched without separate owner approval).

### 3.9 Look

Want: a spacious, legible atlas; recognisable pixel tools; quiet chrome; stable positions; contextual inspection; restrained motion that respects reduced-motion; colour with a job.

Avoid: block textures on every panel; pixel fonts for body text; a generic AI dashboard; a force-directed hairball; a big empty canvas with decorative islands; thirteen identical cards renamed "landmarks"; an avatar or mini-game between the user and the tool.

The metaphor must remove explanation, not add it.

### 3.10 Access

The map must not be the only way in. Provide a conventional list or tree reaching the same capabilities.

Keyboard selection and activation, visible focus, meaningful names, touch, reduced motion, readable labels at each zoom or detail level, an obvious way back. Nothing essential behind hover or precise dragging.

On narrow screens use a different presentation if needed; keep the relationships, do not shrink the canvas. Known issue to resolve on the way: on phones today the journey list sits below the bench, so moving between stations means a long scroll.

---

## 4. Known rough edges that this work touches

From the last quality pass. Fix those that fall naturally inside this work; list the rest in your handoff.

1. Backstage open takes half the workbench.
2. Fetch needs two clicks (pick a URL, then press Fetch) while Memory chips act directly.
3. The valley's seven steps are a linear tutorial with a "Next:" button and are not tied to the new bench buttons. Decide whether they become an optional guided layer or go.
4. The sidebar kit only inspects (resolved by 3.5 if you make that explicit).
5. The valley map's circles are mouse-only and only set "To".
6. Phone order puts navigation below the bench.
7. "Visited" ignores Python runs; "What state changed?" does not cover a Python run.
8. Under `npm run dev`, Foldkit dev tools restore the last state on reload, so the opening screen does not reappear. Not a production issue; do not "fix" it by breaking state restore.

---

## 5. Your freedom

You decide: rendering approach (the app already draws SVG through Foldkit's `h`), layout mechanics, overview-to-focus transition, asset format and tooling for icons, state shape, how icon identity attaches to a capability, how much atlas stays visible during a specimen, what to reuse or simplify.

Choose the smallest maintainable solution. No graph engine, game engine, or new state framework without a concrete need; if you add one, state the need and the trade-off. Do not build for hundreds of integrations before one coherent atlas works.

---

## 6. Done means

A person can:

1. Open the lab and pick something interesting without following a sequence.
2. Tell several kinds of capability apart by form and name.
3. Select a capability on the atlas.
4. See its inventory item and its details.
5. Enter the existing specimen.
6. Do something meaningful there.
7. Identify which capability produced the effect they saw.
8. Return to the atlas without losing their place.
9. Reach the same content without the map.
10. Tell whose tools the belt shows, and whether a run is real, recorded or simulated.

Demonstrate at least: read file, store fact, recall fact, one state-changing operation, one programming capability. The two memory tools must be visibly different despite sharing a family.

Confirm by test, not by reading the code: selecting a belt slot (click and number key) issues no run command; number keys do nothing while typing in an editor; more than nine tools are representable where that is true, without hiding any.

---

## 7. Verification and handoff

- Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`. Report exactly what ran and the counts.
- Drive the result in a browser (Chromium and Playwright are available in the cloud environment): overview, a selected item, an executed specimen, a narrow viewport, keyboard-only use. Do not claim visual verification from source.
- Label every statement in your handoff as observed, inferred or proposed (`AGENTS.md`).
- Add a top entry to `docs/HANDOFF.md`: what changed; why this visual model; what was preserved; checks and browser interactions performed; screenshots under `docs/reports/` of the atlas, a selected inventory item and an executed specimen; remaining rough edges; evidence or permission states left unknown on purpose.
- Record the decision in `docs/DECISIONS.md` (next free id is D16), including what happens to phases, numbers and the valley steps.
- Keep the work reviewable; keep unrelated changes. Work on the branch you are assigned and do not open a pull request unless the owner asks.

The target is not a prettier station menu.

> The target is a visible vocabulary for what MCP can expose: a map of capabilities, recognisable items in an inventory, and real working specimens behind them.
