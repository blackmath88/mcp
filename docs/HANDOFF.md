# Handoff

## The heading over the drawing, and the deploy — 2026-11-27 (branch `lab/entry-canvas`)

Found while verifying the bench rail from the session that built it, and fixed there on the owner's go-ahead.

- **The heading did not follow the drawing.** With an example picked the canvas drew, say, LSD MCP, and the room label inside the SVG said so, but the `stepLabel` above it still read "What the Fetch server hands the AI · its tools/list answer". Wrong twice over: the wrong server, and a `tools/list` answer the lab never asked for — which the desk board in the same drawing already denies with `(no list read)`.
- Fixed in `e95dcba`. `mapRowView` called `pickedEntryHere` twice; it is now one `const` and the heading, the canvas and the detail panel all read from it. With a pick the heading is `What <name> says it does · as its own page describes it, drawn as the same workshop · click a lit slot for what it does there`.
- The new `scene.test.ts` assertion covers the toggle in both directions and, importantly, negative-asserts that the `tools/list` subtitle is gone — the regression that would otherwise pass unnoticed.
- **Deployed on owner's instruction.** `npm run build && npx --yes wrangler@4 deploy` from a clean `e95dcba`; version `55087ed2-8b0b-4cc9-a478-68194c398253`, live on `mcp-lab.bridge-work.ai`. Wrangler reported "No updated asset files to upload" because these exact bytes were already in the content-addressed asset store from an earlier upload; the deployment, not the upload, is what moved.
- **Verified by bytes, not by filename.** The SPA fallback returns `index.html` with 200 for any missing asset, so a filename check alone proves nothing. Live `assets/index-N-h8el6t.js` and the local build share sha256 `f5338694505b21b1…`, `content-type: text/javascript`, and `index.html` itself contains 0 occurrences of the new string. On the live host at 1680x1000 the heading tracked the pick and reverted on "Back to this step's server", with no console errors.
- The bubbles were checked on the live host in the same pass: LSD MCP's bubble shows its headline alone in the embedded canvas, and headline + six lines + source in the full window, where the HTML card correctly suppresses itself.
- **Two sessions deployed `e95dcba` 33 seconds apart** — `1602c33f` at 10:20:01Z and `55087ed2` at 10:20:34Z. Same bytes, so no harm, and the second one's "No updated asset files to upload" is explained by the first having just put them in the content-addressed store. Live is `55087ed2`. The lesson is the same one that kept the heading fix in one pair of hands: while two sessions are live on this checkout, deploying is a single-owner job, so say who is doing it before doing it. The earlier `4ce11f28` and `551666b2` entries below are separate, genuine deploys, not part of this pair.
- Production still carries `fdc9763`, the critter-shelf commit open as blackmath88/mcp#4, because this branch is stacked on it.

## Bubbles on the drawing — 2026-11-27 (branch `lab/entry-canvas`)

Owner, on the module notes: "i would love to have the information for the examples somewhat on the canvas … like bubbles or cards, going out from the modules that explain the speciality of the example specimen … this is great, because then we could have that in fullscreen view also."

- **Drawn in the SVG, not over it.** The previous note card was HTML floated on top, which would not scale in the full-window view. Bubbles are now SVG, so they scale with the drawing and full window carries the whole note for free.
- **Two registers, chosen from measurement.** The embedded canvas renders at scale 0.652 (808px for a 1240-unit viewBox); full window at 1.01. So 13-unit body text is 8.5px embedded and 13.1px full. The bubble therefore shows only its headline at 18 units (13px embedded) in place, and headline + note + source in the full window. 13 headlines authored from the existing notes, longest 33 characters.
- **Placement is proven, not eyeballed.** The room owns x 380–980, so bubbles only ever use the gutters: `LEFT_TOP`, `LEFT_FOOT` (x 10, w 320) and `RIGHT_TOP`, `RIGHT_FOOT` (x 985, w 245, because the right gutter is only 260 wide). Four berths for at most three bubbles — no card in the library declares more than three slots. A script checked all 8 annotated servers in both collapsed and expanded states for bubble overlap, room collision and running off the canvas: 0 problems. Slots sharing a berth (compute/sequence/share, invent/delegate/act, write/ask) never co-occur on any annotated card today; a ninth annotated server could break that, so re-run the check when one is added.
- An earlier placement put a berth at bottom-centre and it covered the room's own name. That is why the gutters rule exists.
- The leader is grey, dotted and has no head, because solid lines in this drawing already mean a call.
- Wrap widths derive from the berth width rather than being hardcoded, so the narrow right gutter wraps tighter. The bubble's source line is the first sentence of the evidence note only; the full caveats stay in the panel under the drawing.
- The HTML click-card is kept for the embedded canvas, where it is the only readable way to see a full note, and suppressed in the full window so it cannot duplicate the bubble.
- Checks: typecheck, lint, 250 tests (1 new, asserting the headline shows in place and the body only in the full window), build. Browser at 1680x1000: LSD MCP's single bubble, Seestar's three, embedded and full window.

## Examples on each step's bench, and a note on every module — 2026-11-27 (branch `lab/entry-canvas`)

Owner, after using the first version: "i found the function. its good! but i feel i needs to life in the same view as the escalating complexity phases … i almost feel this needs to sit on the right side … and the in the wire thing must be a little bit layered hidden somewhere else … i want to click lsd mcp and have the canvas mapped like now, but also have an explainer what happens and why its funny, special or dangerous, like maybe an info card on the modules in the canvas". Three ambiguities were put back to the owner as a question card; the answers were: into each step's page, "Where the picture simplifies" is the thing to hide, and nest the existing text while authoring the weird ones properly.

- **On each step's bench now.** `exampleRailView` puts that step's real servers beside the drawing and redraws **the canvas already on the bench** rather than adding a second one. `shelfView`, `cardView`, `extraCards` and `ownCardView` are gone with it. A pick is cleared by `SelectedStation`, so a server picked on Fetch never draws on Filesystem.
- **The rail is only to the right from 1500px up.** Measured: at 1340 the bench gets 764px, because the sidebar takes 236 and the inspector 300, and the effective `min-width` of `.ws-canvas` is 600 (styles.css:3922 overrides the 720 at :2430). Below 1500 the row stays a column and the rail follows the drawing. Keep `STACKED` in `scroll.ts` in step with the `.lib-stage` and `.tb-maprow` breakpoints.
- **Caveats folded away.** "Where the picture simplifies" is a `<details>` carrying the count: 34px closed against 94 open.
- **Every example draws now.** LSD MCP and Consciousness Bridge had no slots and sat unselectable. Sources read 2026-11-27: LSD's `app.py` opens a psycopg2 connection to `lsd.so:5432` and imports no HTTP library or browser driver, so `read -> web, program`, marked `checked`; Consciousness Bridge was README-only, so `read, delegate -> store, llm`, left at `research` with the gaps written into its note. `flatMiniView` is gone — a critter's own server is an `Entry` like any other, one code path for all 66.
- **Notes on the modules.** Clicking a lit slot of a drawn example pins a card to that slot. `specimens/module-notes.json` holds per-slot notes for the eight servers a critter stands for, each with the page it was read from, the date, and what stayed unverified. A slot with no note falls back to the card's own `what` and says "No note yet for this slot" rather than implying the text is slot-specific. A validation pass confirms all 8 notes match their card's declared slots exactly.
- **Why a research subagent wrote those notes and not the model:** they are claims about real third-party servers. Primary sources were read (Free Will's `server.py`, brain-mcp's `src/`, Seestar's `server.py` and `target_resolver.py`, LSD's `app.py`), and the gaps are recorded rather than filled: Free Will's `ask` slot has no tool behind it, Everything Wrong publishes no source so `run_command` may be simulated, Seestar's `emergency_stop` is unverified, and what Consciousness Bridge sends over its bridge is unknown.
- `.ws-stage` — which carries the 600px floor and anchors the card — is built **only** when a note is open. Verified that the landing, the five scroll-story canvases and the atlas still render `.ws-scroll > .ws-canvas` directly. On a phone `scrollToNoteOnOpen` brings the card into view, since the canvas is wider than the screen.
- **A pre-existing bug this surfaced:** the bench along the room's bottom wall spans x 710–950 and the room name starts at 396, and the furniture was painted *after* the name, so any name past ~35 characters was overdrawn. Visible on EscapeRoute in the owner's screenshot. Paint order swapped.
- Checks: typecheck, lint, 249 tests (9 new), build. Browser at 1680x1000, 1340x900 and 375x812: rail right of the drawing and stacked, pick and clear, keyboard Enter on a slot, note open and close, the fallback note, no console errors and no page-level sideways scroll at any width.
- `deploy/cloudflare-lab` deleted (was `e770ef4`, local-only, never pushed). It predated `main`'s own `wrangler.jsonc` and `main` had already decided the opposite in D23: serve `dist/`, not `lab/`. Its only unique file supported the abandoned approach.
- **Deployed on owner's instruction.** `npm run build && npx wrangler deploy` as `imbodi55@gmail.com` from `fce7554`; version `4ce11f28-5fb1-46ba-8ab7-726c7b8bd204`, 4 of 92 assets changed, live on `mcp-lab.bridge-work.ai`. Verified against the live host at 1680x1000: five cards in the step's rail, LSD MCP drawing in the bench canvas, the Read note open with its source line, the caveats collapsed, no old shelf. Production still carries `fdc9763`, the critter-shelf commit open as blackmath88/mcp#4, because this branch is stacked on it.
- Not done: The 12 same-station identical shapes are still identical; the kind caption tells them apart, the drawing does not.

## The library's real servers drawn in the workshop canvas — 2026-11-27 (branch `lab/entry-canvas`)

Owner: "any chance with the examples we get to the point they get mapped into the canvas? so you have maybe mini versions of the cards on the right side and then by clicking them they get explained in the canvas style".

- The library screen is now a stage: the workshop canvas on the left with a detail panel under it, a rail of mini cards on the right. Picking a card draws that server. The bench shelf (`shelfView` / `cardView`) is untouched.
- **Why the same building every time, not a drawing per server:** measured over `specimens/library.json`, the 64 entries hold 25 with one slot, 34 with two, 5 with three, and 13 with no reaches at all. A solo drawing would be nearly empty. Drawing all nine slots and lighting only the declared ones needed no new mechanism: `slotView` already marks a slot `lit` when a tool sits in it and `ghost` otherwise, so one `MapTool` per declared slot is the whole trick. `isActive` was *not* used for the dimming — it means a call in progress (`active`/`working`/`hot`), and nothing here is running.
- `entryMap(entry)` in `mcpmap.ts`, beside `foreignMap`, with a new `'entry'` mode. It takes slots and reaches through the new `isModuleId` / `isNeighbourId` guards in `domain/modules.ts` (lifted out of `library.ts`, which used private copies).
- **It does not use `sceneOf(entry.station, world)`.** That returns the lab's *simulated* scene, and stamping it on a real third-party server would lie: every fetch entry would get a `robots.txt, every hop` rule in the wall — including "The path that skips robots.txt" — Home Assistant's neighbour would read "crane at the dock (simulated)", and PAL MCP would carry "No model runs in this lab". The entry scene is neutral: plain neighbour names, no gates, a plain room.
- Three other places would have said false things in the new mode, each fixed with a mode conditional, no new drawing primitive: the slot badge showed `inside.length`, i.e. a fabricated "1" on every lit slot (hidden); the desk board listed tool labels, so it repeated the server's name once per slot (now `(no tools listed)`, because a card is not a `tools/list` answer); the "How to read the map" source line fell through to "placed by the lab from its own source" (own branch).
- `reaches` is one flat list per card and never says which tool reaches what, so every lit slot is drawn reaching everything the card names, and a note in "Where the picture simplifies" says exactly that. A card with no reaches gets a note instead.
- Model: `maybeExample: Schema.Option(Schema.String)` holding the `exampleId`; `Message.SelectedExample`. The chips row is hidden in entry mode — its icons are `Option<CapabilityName>` and a slot has no capability, and the mini cards already are the board.
- Mini cards are real `<button>`s with `aria-pressed` and a full `aria-label` carrying the shape; `fingerprintView`'s outer element became a `span`, since a `div` is not legal inside a button. A polite live region reads "Drawing X: described as …". The two critter-only servers (LSD MCP, Consciousness Bridge) have no slots on their cards, so they sit in the rail unselectable and say so.
- The full prose, the external link, the evidence note and the critter art and meters moved from 64 cards to the detail panel of the selected one.
- Layout: a `1fr / 380px` grid (756/380 at 1440) with the canvas column `position: sticky`. **The breakpoint is 1300 px, not 1100**, because the effective `min-width` of `.ws-canvas` is 600 px (the rule at styles.css:3922 overrides the 720 px one at :2430), and with the 236 px sidebar, the padding, the gap and the 380 px rail the canvas column only clears 600 px above about 1284 px. At 1280 the canvas was 6 px wider than its box before the change. Below 1300 the two stack and `scrollToCanvasOnPick` in `scroll.ts` brings the canvas back on a tap; it scrolls instantly, like the existing navigation reset, because a smooth scroll over 6500 px crawled for several seconds. `STACKED` there and the `.lib-stage` media query must stay in step.
- Hiding the chips left `.ws-under`'s `justify-content: space-between` with one child, which pushed the right-aligned "How to read the map" panel 20 px off the left edge of the window. `.mcpmap.mode-entry .ws-under` is `flex-end`; the panel now sits inside the canvas column (576–1016 at 1440).
- Checks: typecheck, lint, 244 tests (2 new), build. Browser at 1440x900 (light and dark), 1320x860, 1280x800 and 375x812: selection by mouse and by Enter, `aria-pressed` and the live region following it, the canvas retitled, the critter art and both meters in the detail panel, Full window covering the whole viewport from inside the sticky column and Esc closing it, no console errors, no page-level sideways scroll and no overflow inside `.ws-scroll` at any of those widths, and at both 1280 and 375 a tap at the foot of the rail lands the canvas at the top of the viewport.
- **The identical shapes, and what was done about them.** The 64 entries make 41 distinct (slots, reaches) shapes, and 12 groups are identical *within one station*, so the lookalikes sit next to each other in the rail: Playwright, Puppeteer, Chrome DevTools and WebMCP are a group of four; Fetch (reference server), Gopher and Gemini MCP and "The path that skips robots.txt" another. Owner asked for the kind in the caption, so the room label is now `NAME · THE MOST USED` / `· THE FIRST` / `· A WEIRD ONE` / `· ALMOST BREAKS IT` instead of `· ITS WORKSHOP`, and the live region says it too. It is the only free signal: the kind is already in the entry, and it is the axis the library is organised by. It had to go inside the SVG rather than beside it, because the full-window map shows no other text. `library.json` was not touched and should not gain data to force the shapes apart. The shapes themselves are still identical; the caption says why each one is in the library.
- `MapInput` gained a required `subtitle`, set to `'its workshop'` at the five non-library builders (`mcpmap.ts` ×4, `landing.ts`, `tell.ts` ×5) so no call site is implicit. Longest label measured in the browser: "The memory that lives in the package cache · almost breaks it" ends at x 923 against a room edge of 980.
- Reviewed before commit. Applied: `scrollToCanvasOnPick` matched `.lib-mini:not(.flat)` only, since tapping an undrawable critter-only card jumped the page to a canvas that did not change; the slot and neighbour `aria-label`s and the "How to read the map" legend say "named on the card" / "not named on the card" in entry mode, because "not offered" / "not on this server" asserts an absence a card cannot support; the desk board says `(no list read)` rather than `(no tools listed)`, which under a `tools/list` head read as a server answering zero tools; `.lib-mini` was added to the `is-critter-own` and `ex-flash` rules, since the walker marks by `exampleId` and that id now sits on a mini card.
- Also found by review and **confirmed in the browser**: `position: sticky` always makes a stacking context, so `.mcpmap.full`'s `z-index: 200` was trapped inside the canvas column and `.critter-layer` (`z-index: 60` on the body) painted three critters over the full-window map. `.lib-canvas-col:has(.mcpmap.full)` goes `position: static` while the map is full; all six visible critters now hit-test behind it, and the column returns to sticky on Esc. First `:has()` in this stylesheet; if a browser lacks it the old behaviour returns, nothing worse.
- Checked and **not** changed, with evidence: review suspected the library had lost its critters, because `crit-art` moved into `detailView` after prose and the 64 cards are gone. The library's working perch was already only the intro ground strip (D-note of 2026-11-25: no critter ever stood on a library card, as every card top sits under a heading or another card). Measured on the library screen scrolled to the foot: five critters in the layer, two on screen. Review also called the bare `.lib-grid` rules dead; they still style the bench shelf above 1320 px, so they stay.
- **Pushed and deployed on owner's instruction ("just push no pr and deploy").** `origin/lab/entry-canvas`, no PR opened. `npm run build && npx wrangler deploy` as `imbodi55@gmail.com`, version `551666b2-44e5-4007-ab24-75393325298a`, 4 of 92 assets changed, live on `mcp-lab.bridge-work.ai`. Verified against the live host: the stage renders, 66 mini cards, "WebMCP · almost breaks it" in the room, no console errors. Note `npm run infra:deploy` was **not** used: it is the template's Alchemy gate and demands a stack name other than `mcp-lab`, so it would raise a second stack rather than update this site.
- **This put `fdc9763` into production** — the critter-shelf commit that is still open for review as blackmath88/mcp#4 — because this branch is stacked on it. Expected, but the live site is now ahead of what has been reviewed.
- **Deploy collision to watch:** `deploy/cloudflare-lab` carries a `wrangler.jsonc` with the same Worker name `mcp-lab` but `assets.directory: ./lab` and no routes. Deploying that branch would replace this app with the old static prototype and drop the custom-domain route.
- Branch `lab/entry-canvas`, **stacked on `lab/critter-shelf`** (`fdc9763`), which is open as blackmath88/mcp#4 and awaiting review. Nothing pushed. The stack is deliberate: this work was authored against the post-`fdc9763` `src/lab/library.ts` and `src/styles.css`, so a branch cut from `main` would conflict for no good reason. A PR from here must be based on `lab/critter-shelf`, not `main`, or its diff will appear to contain the critter work; otherwise rebase onto `main` once #4 merges.
- Note: `npm run format` runs oxfmt over the whole repository, not the changed files. It reformatted 99 unrelated files here, `specimens/library.json` among them; they were restored and are not in this commit. Run oxfmt on changed paths, or check `git status` after it.

## Critters on a shelf in the landing's top corner — 2026-11-26 (branch `lab/critter-shelf`)

Owner: "i thought we had more than 3 pixsies? and they are out of the landingpage first view on my desktop. can we place them on the landingpage on the right side right upper corner?", then "pin all 5" and "space them".

- Why only three: the landing's single perch was `groundView(h, 'landing')` with `data-perch="3"`. The catalog has eight critters and `maxOut()` allows five on desktop (two on phones), so capacity, not the catalog, was the limit. The strip also sits low in a column taller than the window (1020 px of content at 1440x900), so on a shorter window it fell below the fold.
- `library.ts`: `terrainBlocks` and `groundClass` extracted; `groundSceneryView` is the same nine-block strip with no perch attributes; `critterShelfView` is the new perch (`data-perch="5"`, `perch-steps`, `data-magnet`).
- The landing now has exactly one perch. Above 1100 px the shelf is absolutely positioned in the empty top-right corner (`.landing` gained `position: relative`) and the left-column strip is scenery; at 1100 px and below the shelf returns to the flow under "Nine kinds of tool" and the scenery strip hides, so narrow layouts look and behave as before. Two elements, each visible in exactly one regime.
- The shelf hangs at `top: 124px`, not flush with the 40 px padding: `isOpen` rejects a perch without a critter's height (72 px) of clear space above it, so a higher ledge would never have counted as a perch at all.
- Bubbles: `positionAbove` flipped below the critter only for cards (`isCard && above < 8`), so a plain speech bubble from a high critter rendered at a negative `top` and was clipped by the window. Now any bubble flips, and `.crit-bubble.below::after` turns the tail upwards (it had no styling at all). This affects every page, not only the landing; it only changes bubbles that were previously drawn off-screen.
- Spacing: five critters on one perch overlapped (gaps of 1-20 px against 72 px sprites), so five read as three. `spawn` now spreads offsets evenly across perches with capacity > 1, and `crowdedAhead` turns a critter that walks within 0.8 x sprite of a neighbour ahead of it. Only the one walking into the other turns, or both flip every frame. Measured gaps went from 1-20 px to 54-69 px and held over 30 s with the critters still moving.
- Checks: typecheck, lint, 242 tests, build. Browser at 2560x1440, 1920x1080, 1440x900, 1440x740, 1440x620, 1150x800, 1000x800 and 375x812, light and dark: five on the shelf on every two-column size, the scenery strip empty, three (phone: two) in the flow below 1100 px, no sideways scroll, the critter toggle still works, and the library page's nine perches unaffected.
- Reviewed before commit. Two findings applied: `terrainBlocks` dropped its empty children array (FOLDKIT.md requires `h.keyed('span')(key, [attrs])`), and the redundant `.crit-bubble.injected.below::after` rule went, since `.crit-bubble.injected::after` already wins on cascade order (verified for all four bubble variants).
- Not applied, with evidence: the review suggested `pointer-events: none` on the shelf to stop it swallowing clicks. That would break it — `isOpen`'s probe is `document.elementFromPoint`, and with the property set the probe returns `.landing-slots` instead of the strip, so the shelf stops being a perch and no critters appear. The concern itself is not reachable: the shelf and the map are both laid out inside `.landing`, so their relative geometry is fixed by layout rather than scroll, and the measured clearance between the strip's bottom and the map's top is 89 px at 1440 (275 px at 2560), with only the shelf's own blocks under the strip.
- Open: `settle` and `hop` still pick a random offset, so spacing after a hop rests on the turn-around rather than the even spread; a critter that hops next to a neighbour near a perch edge can fidget between the edge flip and the crowd flip. Both are cosmetic and self-correcting, neither was visible in the browser checks.

## The menagerie: weird servers as pixel critters — 2026-11-25 (branch `lab/menagerie`, merged to main via PR #3 on 2026-11-26)

Owner: weird real MCP servers as pixel critters that walk over the lab, joke in speech bubbles and open a card with the facts; make it work on Android and iPhone; adopt it on the landing; let the card colouring add ornament to the UI without hurting clarity and without much orange (it must not read as Mistral). Concept: the "MCP Lab Menagerie" artifact; method write-up in blackmath88/buddy `studies/menagerie/`.

- `specimens/critters.json`: eight critters. Six point at existing library entries (station + kind); LSD MCP (fetch) and Consciousness Bridge (memory) carry their own entry with evidence `research` (web search 2026-11-25). `library.json` is unchanged.
- `src/lab/critters/`: `sprites.ts` (16×16 text grids, pure), `catalog.ts` (joins critters to entries; hues; pure helpers for weighted perch choice and viewport clamping), `render.ts` (canvas: sticker / duotone / plain, shading only at the exterior edge, mosaic; installs the art as CSS custom properties so Foldkit views only carry class names), `walker.ts` (a DOM island beside the app: fixed layer, perches are `[data-perch]`, `[data-magnet]` pulls three times as hard; reads perch rects every frame because the workbench and library scroll in their own panes; tap opens the card above, or wherever it fits on a phone; Escape / outside tap closes; reduced motion = still; switch remembered in localStorage).
- A perch only counts when its top edge is on screen, uncovered, and no control (link, button, summary, input) sits where the critter would stand. The "Real servers" landing button is therefore not a perch: a critter there covered "Enter the lab".
- The walker's variety comes from a seeded generator and the frame timestamp, because the Foldkit lint bans ambient `Math.random` / `performance.now`.
- Station choice from a card goes back as a DOM event; `subscriptions.ts` `critterStation` turns it into `SelectedStation`.
- Landing: a stepped terrain row under "Nine kinds of tool" (one block per slot, the slot's tint with a hue cap), the critter switch, a pixel band at the foot. Library: critter cards get the mosaic art, a sticker by the name and Weirdness / Breaks pixel meters; the two own-entry servers appear as extra cards under their station; a pixel band above the intro. Station: a "Weird neighbours" chip row under the toolbench linking to the shelf (`#out-in-the-world`).
- Colours: hues are pale pink/blue/green/violet/cyan; the band uses sky, violet, blush, emerald. No orange-red ramp.
- Checks: typecheck, lint, 241 tests (11 new), build. Browser (vite preview): 1280×860 and 375×812 on landing, library and the Thinking station — no console errors, no sideways scroll, critters hit-testable, card inside the viewport with focus in it, close returns focus to the critter, "Open the step" reaches the station.
- Review fixes (second commit): chatter never replaces an open card and pauses while one is open; the perch probe ignores the critter layer; the landing terrain is one stepped perch holding three (feet follow the block under the critter); jumps skip arcs that cross a control and critters ignore the pointer mid-jump; bubbles are `pointer-events: none` and `aria-hidden`; the layer hides while a `details.pop` popover is open; closing a card returns focus to its critter and Tab stays in the card; resize across 600 px re-counts; a detached jump target re-settles; each frame reads all rects before writing; one critter per perch, and a perch needs a critter's height of empty space above it; terrain blocks one step brighter; "Open the step" opens at the top; own-entry evidence label from data; the LSD line paraphrased.
- Consequence of the empty-space rule: no critter stands on library cards (every card top sits under a heading or another card); the cards carry the art. The station's "Weird neighbours" row has an 80 px (62 px on phones) stage above its chips for critters.
- Not done / open: real-device check on Android and iPhone (only emulated). **D22 (2026-11-22) removed pixel sprites because they broke the workshop canvas.** This branch keeps pixels off the canvas and leaves the line icons, but it brings pixel art back as ornament. Owner confirmed on 2026-11-26, recorded as D25.

## "What is MCP?" as a five-scene scroll story; the two marks — 2026-11-25

Owner: the "What is MCP?" page needs a pedagogical journey for non-techies, "a scrolly tell that tells the story but just changes the canvas", 4–5 slides, using the technique of the bridge-work article "Maybe the agent shouldn't own the memory"; landing wording "only sees a list of tools"; the bridge·work logo in the project; an MCP Lab logo from the bridge-work design language.

- `src/lab/tell.ts`: five scenes (on its own · the front desk · behind the list · a call · why look behind it), each with its own workshop canvas. The canvases are stacked and cross-fade; the text scrolls beside them. Same canvas as the benches.
- `src/lab/tell-scroll.ts`: the article technique — a scene becomes current when its text crosses a line 45% down the visible scrolling area; sets `data-tell` on the section; numbered scene buttons scroll to a scene. Reduced motion: no fades, no smooth scroll.
- At ≤1100 px the page itself scrolls, so `.intro` no longer is a scroll box there; otherwise the drawing had nothing to stick to.
- The intro's old single map and three facts are folded into the story; the route list stays below it.
- Landing headline: "The AI only sees a list of tools. Open the workshop behind it."
- `src/lab/marks.ts`: bridge·work's Signal Mark (as on bridge-work.ai, in the credit) and the MCP Lab mark, its sibling: same grid and colours, the top-left square turned into three bars, a list. Sidebar, landing and favicon (`public/mark.svg`) use it; README shows it.
- Checks: typecheck, lint, 230 tests (one new scene test), build. Looked at all five scenes at 1440×900 and 390×844, and both marks light and dark.
- Not done: no newcomer has read the story yet; whether five scenes land for a non-technical reader is a claim to test.

## Public README, MIT licence, source link — 2026-11-25

Owner: "update readme and make sure we have a nice repo for public"; "do we want to hint to GitHub, because it's open?"

- README rewritten for visitors: the live address `https://mcp-lab.bridge-work.ai/`, two screenshots (`docs/media/`), what it is, what is real, run locally, layout, deploy, contributing, licence. The privacy section and "Also in this repository" are kept.
- `LICENSE`: MIT, © 2026 blackmath88, the same as Sharing is Caring. `package.json` gains license, description, homepage and repository.
- Credit row on every screen: "Built by bridge·work ↗" now opens the lab's own listing `https://bridge-work.ai/lab/tool/mcp-lab/`, and a new "Source on GitHub" link sits beside Imprint and Privacy. Scene test extended.
- Checks: typecheck, lint, 229 tests, build. Looked at the status bar.
- Not changed: deploys are still manual (`npm run build && npx wrangler deploy`). Pushing to main does not redeploy until Cloudflare Workers Builds is connected to the repository or a deploy workflow with an API token is added.

## Observatory switched off — 2026-11-25

Owner asked to stop the Observatory workflow rather than fix it. Disabled at GitHub with `gh workflow disable
observatory.yml`; `gh workflow list --all` now reports it `disabled_manually` while `Foundation checks` stays active.
The workflow file is untouched, so `gh workflow enable observatory.yml` reverses this.

Recorded as D24. The underlying failure is unfixed: four `.observstory/knowledge.json` entries hold statuses the pinned
producer rejects (`proposed` for `learning-design`, `basics-learning`, `basics-visual`; `draft` for `exhibit-review`).
Consequence to know about: no new Observatory snapshot will be produced, so START-HERE step 1 falls back to direct
repository inspection.

## bridge·work credit, legal links, self-hosted fonts, visual QA — 2026-11-25

- **Credit and legal** (`src/lab/credit.ts`), following `sharing-is-caring`: "Built by bridge·work ↗" (to https://bridge-work.ai/lab/, since MCP Lab is not listed there yet), Imprint (https://bridge-work.ai/en/imprint/), and a Privacy popover with an MCP Lab note plus the link to https://bridge-work.ai/en/privacy/. Shown on the landing page and at the right of every status bar. Page tags: author and og:site_name "bridge-work", title "MCP Lab — built by bridge·work". README has the credit line and a Privacy section. Operator facts came from the owner's ChatGPT project (Achim Imboden, Einzelunternehmung, Basel).
- **Fonts** are self-hosted (`@fontsource/inter`, `@fontsource/jetbrains-mono`, imported in `styles.css`); the Google Fonts request is gone, so the privacy note can say no third party is contacted unless the visitor asks a server by address.
- **Visual QA** at 1440, 1280, 900 and 390 px and in dark mode, every screen and open menus, with an automatic overlap scan (its flags on closed popovers, scrolled-away content and the full-window overlay are false alarms). Fixed: route cards on "What is MCP?" overlapped at tablet width (a 340 px minimum); the canvas was cut off beside the sidebar at tablet width; moving to another step kept the old scroll position on phones and inside the workbench (`src/lab/scroll.ts`); wall-rule labels touched neighbour names; stage headings in the old green.
- Open: Swiss postal address, UID and phone are unknown and not shown; the Imprint link covers them. A listing at bridge-work.ai/lab/tool/mcp-lab/ and the subdomain mcp-lab.bridge-work.ai are not set up.
- Checks: 229 tests, tooling tests, structure check, lint, typecheck, build.

## Public deployment of the workshop lab — 2026-11-25

Owner asked for the lab to be reachable on a public URL, then corrected a first attempt that had deployed the preserved
`lab/` prototype from a pre-merge checkout instead of the merged workshop app.

Learned: `origin/main` had advanced to `ddcf808` ("Merge the workshop lab"), which is what introduced the Vite/Foldkit
application at `src/`. Any deployment must come from a freshly pulled `main` and from `npm run build`, not from the
repository's static directories.

Decided: D23 — serve `dist/` as Cloudflare Workers static assets. Static assets only. The Alchemy declaration and its
deploy gate are untouched and still block the unrenamed `mcp-lab` stack; this deployment went around that gate rather
than through it, which is a deliberate choice to record, not an approval of `npm run infra:deploy`.

Changed: added `wrangler.jsonc` (Worker `mcp-lab`, assets `./dist`, SPA not-found handling, no `main`) and `.wrangler/`
to `.gitignore`. No application code, dependency or Alchemy file was modified.

Evidence, executed on 2026-11-25: `npm ci` (266 packages), `npm run build` (788 modules; `dist/` is 15 files and 16 MB,
including a 9.2 MB `pyodide.asm.wasm`, under Cloudflare's 25 MiB per-asset limit), then `npx wrangler deploy` uploading
all 15 assets. Verified in a browser: the landing screen shows "The AI only sees a list. Open the workshop behind it."
with "Enter the lab"; that button opens "What is MCP?" with the route sidebar; no console errors on either view; a
deep path returns `index.html`, confirming the SPA fallback. Repository checks rerun on this commit: `npm run
typecheck` clean, `npm test` 228 passing in 16 files, `npm run test:infra-guard` 4 passing (the deploy gate still
blocks), `npm run lint` with no reported findings.

Custom domain, same day: `wrangler.jsonc` now declares the route `mcp-lab.bridge-work.ai` as a Workers custom domain,
and the lab is served there. Declaring a route disables the generated `workers.dev` hostname, which is the point — it
carried the owner's account subdomain — so `mcp-lab.imbodi55.workers.dev` now returns 404 and the custom domain is the
only address. Certificate provisioning made that deploy's trigger step take about 26 minutes; the upload itself took
seconds. Verified afterwards: `https://mcp-lab.bridge-work.ai/` returns the landing page, its CSS, `pyodide.js` and a
deep path all return 200, and the page renders with no console errors.

Also verified on the deployed build, closing an earlier gap: the Python bench at step 09 ("One item, a language") ran
real Pyodide in the tab and printed `wrote clay / wrote timber / wrote iron / all done`, so the 9.2 MB wasm is served
correctly. Step 05 was exercised in both directions — a refused `build_path` (span 6 against a limit of 3, no state
change, revision unchanged) and a successful one (forge–archive, span 2.8, revision 0 → 1). The route navigation is
present at a 375px viewport, stacked below the content.

Limitations: nothing redeploys automatically — `npm run build` and `npx wrangler deploy` are manual, so the live site
is whatever was last deployed by hand. No screen-reader or newcomer evaluation was performed. The Observatory workflow
fails on this commit, but it has failed on every push since 2026-11-24 over `.observstory/knowledge.json` statuses and
is unrelated to deployment.

Next: decide whether pushes to `main` should redeploy, and whether Alchemy or wrangler owns the Worker long-term.

## A full-window landing page before the lab — 2026-11-24

Owner: "we want fullwindow landing page like an intro, then enter to the lab".

- New first screen `landing` (`src/lab/landing.ts`): no sidebar or title bar. Headline "The AI only sees a list. Open the workshop behind it.", one paragraph, "Enter the lab" (to "What is MCP?"), "Straight to step 01", "Real servers, out in the world", the nine slot icons, and a one-line note on what is real.
- On the right, the workshop drawn large with every call line moving: a showcase server of one tool from each of seven lab servers, labelled as a showcase under the drawing.
- The MCP Lab mark in the sidebar now returns to the landing page.
- Checks: 228 tests, lint, typecheck, build; looked at 1440×900 light and dark and 390 px (no horizontal overflow).

## Closing gaps — 2026-11-24

Owner: "close as many gaps as possible".

- **Keyboard:** Enter and Space open a lit slot on the workshop canvas (test).
- **Popovers** close on an outside click or Escape (`src/lab/popovers.ts`, wired in `src/entry.ts`).
- **Full window:** the selected tool's details open beside the canvas; the inline drawer is hidden while the overlay is open.
- **Backstage** shows one bar until opened; tabs appear when expanded (tests open it first).
- **Your server by address:** "Ask for its tools" sends initialize and tools/list to a Streamable HTTP URL from the browser, then closes; the listing goes through the same parser and workshop as a pasted one (`src/adapters/remote-listing.ts`). Only https or localhost. Tested against the lab's own server over real HTTP (`remote-listing.test.ts`): three tools listed, no tools/call sent. Real servers must allow the page's origin (CORS) and not need a login; failures say which.
- **Dead styles:** 161 rules from removed views pruned (styles.css 80 KB → 63 KB); screens re-checked.
- **Bench cells** are separate cards; a row that is not full no longer shows grey filler.
- **Library verified:** web searches on 2026-11-24 moved 59 of 64 cards to "checked". Replaced because the named project was not found: Metacog → brain-mcp's switchCognitiveMode; "Dead Cowboy" → sampling (research); joshuagillmore's planner → taco-ops seestar-mcp; Cloudflare "truncation" → "one approval, many requests" (from Cloudflare's build guide). Corrected: the fetch advisory ID was not found, the card now cites the May 2026 disclosure; Figma's capture is "flat layers" per its docs; Asana incident details (June 2025, ~1,000 customers). Five cards remain "research".
- Still open: screen-reader test; a tool in two slots; gateway as several rooms; library examples drawn on the full canvas; a newcomer test; deploy.
- Checks: 227 tests, lint, typecheck, build.

## Out in the world: the example library as a second narrative — 2026-11-22

Owner: "build the example library … real and popular for the specimens we have: most used, first, weird, and almost breaking the specimen … look in the repo for a catalogue … build this as second narrative".

- Data: `specimens/library.json`, 64 entries, four per station (popular, first, weird, breaking), for all 16 stations of the route. Each entry: name, by, url, what it is, why it is here, the slots it lights and the neighbours it reaches (as its README describes, not run), and evidence.
- Evidence labels: **checked** (confirmed in this session: npm or PyPI first-publish dates from the registries, or a web search that found the primary page), **research** (from `docs/research/REAL-MCP-SPECIMENS.md`, `2026-11-21-wild-examples.md` or `specimens/route.json`, not verified at source), **author** (named from knowledge, not checked; three entries).
- Sources used from the repo: REAL-MCP-SPECIMENS (popularity signals, creative implementations, security cases), wild-examples (boundary-breaking leads), route.json anchors and diversions.
- Not reachable here: GitHub API, npm download counts, PyPI download stats. So "most used" rests on the cited figures where they exist (Playwright 41.6M downloads, 22 Oct–20 Nov 2026, from the repo research) and is otherwise a judgement, said so in the note.
- Gaps said plainly: no widely used server built around elicitation was found (Ask, "most used"); several "first" entries are first for the station, not dated firsts.
- UI: `src/lab/library.ts`. Every bench ends with "Out in the world" (four cards). A new screen, "Out in the world" in the nav, walks the route again through real servers, each step with its idea and four cards and "Open this step". Each card has a slot fingerprint (nine icons lit where it has tools, then what it reaches).
- Checks: 223 tests (incl. four kinds per station and an evidence label on every entry), lint, typecheck, build; screenshots at 1440 and 390 px.

## One shell and one style across the platform — 2026-11-22

Owner: "implement this style all over the whole platform".

- Every screen now uses the same shell: title bar, the left route navigation, the main area, the status bar. The front page and All tools gained the left nav; the nav has two rows above the route, "What is MCP?" and "All tools and your server". The duplicate logo in the title bar is gone.
- All tools: the three primer cards and the glossary moved into an "MCP in three sentences" popover; the doors are now "Start the route at step 01" and "Straight to the wire: raw JSON-RPC" (the old "Open the Memory bench" predated the route). The "How to read this" panel describes the workshop, not the old atlas ground.
- "Thirteen questions" (the old 13-step ontology ladder) is replaced in the UI by "Nine slots": each slot's icon, what it means, and the tools that sit there. `src/domain/ladder.ts` remains as an authoring index and keeps its test.
- The pixel-era tool belt at the bottom of All tools is deleted (`beltView`). `beltOf` stays: the bench and the keyboard shortcuts use it.
- Kickers and eyebrows are muted ink instead of green; green remains for calls and success.
- Checks: 220 tests, lint, typecheck, build; screenshots of front door, All tools, Nine slots; no horizontal overflow at 390 px.

## Full-window map — 2026-11-22

- A "Full window" button on the workshop canvas (bench and All tools) opens it over the whole window; "Close · Esc" or the Escape key closes it. Model field `canvasFull`, message `ClickedCanvasFull`, subscription `canvasEscape`. Tool chips and "How to read the map" stay available inside.
- It is a CSS overlay, not the browser's Fullscreen API, so it also works inside the claude.ai viewer.
- Checks: 220 tests, lint, typecheck, build; looked at at 1440×900, Escape closes it.

## UI pass: a calmer route nav, secondary things behind popovers — 2026-11-22

Owner: "adjust the left navigation … general UI pass … still busy, trim some things and have stuff behind pop ups".

- Left nav (`journeyView` in `src/lab/view.ts`): grouped by the slot each step lights, each group headed by its line icon in place colours (Read, Ask, … Act, then Side trips and Your own server). Rows show only a small step number and the title; the current row has an ink bar and tint; visited rows get a green dot. Removed: tool counts, the dots column, the valley walk-through fold.
- Popovers (`details.pop` with `.pop-panel`): "About this specimen" (anchor, diversions, where it bends, sources) replaces three folds under the question; "How to read the map" holds the canvas legend; "Host: Never ask" holds the approval rule. Bend, reset and host now share one row.
- "About your last run" in the right column folds closed.
- Popovers are plain details elements: they close by clicking their button again, not by clicking outside.
- Checks: 219 tests, lint, typecheck, build; screenshots at 1440 and 390 px (no horizontal overflow).

## Pixel art removed; one line-icon family in ink and place colours — 2026-11-22

Owner: the pixel art breaks the workshop canvas; remove it all over, use SVG icons, soften the black, keep some of the pixel colour feel. Chose "ink on a soft tint" with violet ink, and asked for smoother icons.

- `src/lab/icons.ts` is now the icon family: line icons on a 24 grid (one stroke weight, round ends), one per tool (34), slot (9) and neighbour (7). `iconView(name, h)` keeps its signature, so every place that showed a sprite now shows the line icon.
- Colour by place in the workshop, softened from the pixel palette: shelf sky, workbench lemon, phone violet, loading dock orange, desk blush (`.place-*` classes, `--shelf`, `--shelf-t`, …). Colour says where, never success or permission.
- `--ink` (#2b2350, the pixel art's outline colour) replaces black for every dark block: buttons, story card, AI app, the tools/list board. Dark mode: light ink, story card on a deep violet ground.
- Deleted: `src/lab/sprites.ts`, `scripts/draw-sprites.mjs`, the `.px-*` paints and shading. Older entries below that mention sprites are history.
- Also: the route server's header no longer shows the old valley walk-through prompt.
- Checks: 219 tests, lint, typecheck, build; screenshots of the route bench and the inventory in light and dark.

## The workshop canvas is the centerpiece of every specimen — 2026-11-22

- `src/lab/mcpmap.ts` now draws the workshop: you and the AI app outside, MCP as the front desk with the tools/list board, the server's room with nine slots, neighbours outside. A call is desk → slot → neighbour; the last tool's line animates.
- `src/domain/modules.ts`: slots renamed to one word each (Read, Ask, Write, Compute, Sequence, Share, Invent, Delegate, Act), neighbours, `placeOf(tool, world)` (thinking and cart move with the build), `moduleOf` is now a function.
- `src/lab/scenes.ts`: per server, neighbour names, gates, desk traffic, building variant and the disclaimer notes ("Where the picture simplifies").
- On each bench: story card, then the canvas, then the tool chips and notes, then the bend and the host rule, then the drawer and the bench. The front door shows the empty building; All tools shows every tool; Your server shows a fogged room with guessed slots.
- Removed from the canvas: the inferred combination lines and the "behind the list" component strip (components remain in "How it happened").
- Checks: 219 tests, lint, typecheck, build; screenshots of front door, fetch, ask, network; no horizontal overflow on a phone (the canvas scrolls inside its own frame below 720 px).

## The map is back, and the route climbs the owner's ladder — 2026-11-22

Owner: "where did the map go … keep the map … every MCP you see, you know exactly: these modules are on, these are off … why is the first one called the Valley … fetch a page first". Plus a nine-rung ladder (read → physical action). Decisions: rung 9 may be a simulated arm; garden: only real specimens.

- **The map** (`src/lab/mcpmap.ts`, model in `src/domain/modules.ts`): nine slots in fixed places. Lit from the server's `tools/list` answer, ghosted where empty, lines for combinations (inferred). Shows the chain You → host → MCP → server → list → behind, and the parts behind the list lit along the last call. On the front door it is empty; on a bench it is section 1 under the story card; in All tools it holds all 34 tools; in Your server it places pasted tools by guesses and says the "interaction" slot cannot be seen in a list.
- **The route** (`src/lab/story.ts`) follows the ladder and starts at fetch. Sidebar and front page are grouped by rung. Steps are numbered 01–16.
- **Cart server** (`ask`, rung 2): `reserve_cart` makes the lab's MCP server send `elicitation/create` mid-call; the page shows the question, the answer goes back (`answerServer` in `src/adapters/in-tab-mcp.ts`, a DOM event to a Foldkit subscription). Bend: a build that picks itself with the same tool list.
- **Crane server** (`arm`, rung 9): simulated controller, arm, sensor. With something in the way, "Moved." comes back while the crate hangs halfway; a build that checks the sensor fails honestly.
- Removed: the authored "not offered" ghosts (the map's empty slots do this structurally) and the old family atlas layout.
- Checks: 217 tests, lint, typecheck, build; screenshots of front door, fetch, ask (question and answer), arm, all tools, your server, phone (no horizontal overflow).
- Open: a tool in two slots; the summary block in the map's empty corner could crowd on a server with many combinations.

## The story is the front door again: "What is MCP?" and the agreed route — 2026-11-22

Owner: "it doesn't tell the story … what is an MCP is the main question … the specimens should be in order from easy to complex … remember the order we agreed".

- The lab opens on **What is MCP?** (`src/lab/intro.ts`): one definition, a picture (you → AI app, the host → MCP → server → tools → what is behind them), three facts, and the route listed in order with one idea per step. "Start at step 00" or "Or explore all tools freely" (the atlas).
- **The agreed route** is data (`src/lab/story.ts`): the valley first, then the specimens in their `specimens/route.json` numbers, the inspector last. A test checks the order against `route.json`.
- Every station shows a **story card**: "Step NN of 13", progress dots, the MCP idea, *Try this* (a real button on that bench), *What to notice*, Back / Next.
- Sidebar is "The route · easy to strange" with step numbers again. Breadcrumb: ← What is MCP? / All tools / NN · station. The MCP Lab mark returns to the front door.
- Note: this reverses part of D16 ("no course"). The atlas stays as the free way in; the route is the default way in.
- Checks: 199 tests, lint, typecheck, build; browser screenshots of the front door and steps 00 and 02; no horizontal overflow on a phone.

## Pin a pasted listing and compare it later — 2026-11-21

- "Your server" can pin a listing (name, fingerprint, description per tool). A later paste marks each tool same / changed / new, shows the old description struck through above the new one, and lists tools that are gone. "The same example, later" loads a changed version of the invented server: `save_note` gains an instruction to email notes to an outside address, `get_weather` disappears, `delete_notes` appears.
- Observed: Lens's wording rules do **not** flag the new `save_note` instruction ("Before saving, also call send_email …"); the comparison does. The screen says so. That is a real limit of L09, kept visible on purpose.
- `typecheck`, `lint`, `test` (197 passed), `build` pass; scene test for pin → later → "1 changed, 1 new, 1 gone (get_weather)"; checked in headless Chromium without page errors (`docs/reports/toolbench/your-server-drift.png`).

## Call path, "Your server", glossary — 2026-11-21

Owner: "90 minutes go".

### Changed

- **The path a call took** (`src/lab/flow.ts`): the tray draws tool → each component reached, in order → result or error, read from the run's engine events. During "Watch it again" only components reached so far are lit; changes amber, failures red. Nothing on it is authored.
- **Your server** (atlas view, `src/domain/foreign.ts`): paste any `tools/list` answer (`{"tools": [...]}`, a JSON-RPC response, or a plain array). Each tool gets a card with all four hints, absent ones shown as absent with the spec's default reading; Lens claims; a hidden-character check; a guessed family that names the rule it rests on; and a dashed "what it works on: not known from the list". Combination warnings (C01) and a "read these before approving" list sit on top. Nothing is sent or run. A load-an-example button fills an invented listing with one poisoned description and one hidden payload.
- Lens L03 also reads `recipient` and `email` parameters as destinations.
- Atlas primer has a seven-word glossary (server, host, client, tool, tools/list, tools/call, hint).

### Evidence

- `typecheck`, `lint`, `test` (196 passed), `build` pass. New tests: the call path from real runs (order, partial replay, failure marked); the parser's three accepted shapes and its error messages; absent hints stay absent; the example triggers L09, L10 and C01; the family guess names its basis; a scene test for the Your server view.
- Headless Chromium: example listing rendered with the warnings; Valley `connect_places` replay with the path lit to "World store" at event 5 of 20; no page errors. Screenshots `docs/reports/toolbench/your-server.png`, `call-path-replay.png`.

### Limits

- The family guess is a heuristic over this lab's ten Lens rules; it will often be wrong for real servers, and says what it rests on.
- Pasted listings are not pinned, so a later change to the same server is not diffed here (the in-tab Lens tab does that for the lab's own servers).

## Every station is a toolbench; the host can ask first — 2026-11-21

Owner: "take 100 minutes … build out the whole repo, test and judge … a place where somebody learns about MCP the first time but also the nerds get into the nitty gritty". Built from board F of the architecture canvas (white background, as asked) and the external review in `docs/research/2026-11-21-visualisation-research.md`.

### Changed

- **Toolbench on every station** (`src/lab/toolbench.ts`). Four numbered parts, the same on all 14 stations:
  1. *Handed to you*: the server's tools as instrument cards with sprite, signature, `readOnlyHint`, a "called n×" badge and a "contains a workshop" mark for tools whose one call runs a whole process. Dashed cards show what the server does **not** give you (authored per station, e.g. `undo_entry()`: there is no undo).
  2. *What they work on*: the existing touchable bench, labelled as drawn from the lab's own source.
  3. *Comes back*: the result, the approval prompt, and "How it happened", the run's engine events with "Watch it again" (the existing replay cursor drives it).
  4. *Stays changed*: a stamp listing state changes up to the replay cursor; "It failed after this. Nothing was rolled back." when that applies.
- **Host approval** (`src/lab/approval.ts`): never ask / ask unless read-only / always ask. A waiting call sends nothing; Deny leaves the world untouched and says so; Allow sends it. A Python program is approved once for all its writes, and the screen says that. The inspector's "Was anyone asked?" now answers from what actually happened.
- **Under the hood** for each instrument: the raw `tools/list` entry as received (kept now as JSON in the session), the exact `tools/call` that "Use it" would send, Lens claims, a hidden-character check of the description, what is known about it, and the three hints that are not sent with their spec defaults.
- **Two doors on the atlas**: three sentences for a first-timer and "First time? Open the Memory bench"; "Straight to the wire: raw JSON-RPC" opens the call console.
- The belt is shown on the atlas only; on a bench the instrument row replaces it. The inspector no longer repeats the selected instrument's card. A failed run no longer forces Backstage open.

### Evidence (observed in this session)

- `typecheck`, `lint`, `test` (187 passed), `build` pass. New tests: a write waits under "ask unless read-only" and sends no command; Deny leaves the world equal to before; Allow sends `RunCapability` and records it; read-only runs at once; the rule table; scene tests for ghosts, the approval prompt, Deny, the program prompt and both doors.
- Headless Chromium 1440 wide: the first instrument used on all 14 stations without a page error; Memory write asked, allowed, replayed step by step; Ledger `run_as_program` with "third write fails": asked once, failed, two entries stayed, the stamp and the tray said so. iPhone 13: no horizontal overflow on the Memory bench.
- Screenshots: `docs/reports/toolbench/`.

### Limits

- Ghost instruments and "contains a workshop" are authored by the lab, not read from any server.
- The work area is still each station's existing bench; the instruments are not yet drawn as lines into it the way board F does.
- "How it happened" lists engine events in text; the bench does not animate them yet.
- Approval is a model of a host, not any real product's behaviour.

## Segment 13 built; all thirteen ladder steps have a running tool — 2026-11-21

Owner: "go on and make sure all segments are built". Read as the thirteen steps of the learning ladder in `docs/concept/MCP-LENS-ONTOLOGY.md`. Twelve had a specimen; step 13 existed only as a Backstage tab.

### Changed

- New specimen **Inspect the inspector** (station `inspector`, 14th server): tools `profile_server` and `profile_self`, reachable from the browser, the CLI (`npm run lab -- profile_server --name memory --set subject=changed`) and the stdio server. Bend: the inspected listing is as pinned, or changed since. Self-inspection is one snapshot; there is no tool that profiles a profile, and it names its own blind spot.
- `src/domain/ladder.ts`: the thirteen distinctions with the capabilities that cover each. Shown under **Atlas → Thirteen questions**, labelled as an index and not an order.
- Catalogue is now 30 capabilities on 14 servers; two new sprites.
- Lens rule L05 tightened: it fired on "stored" in a read-only tool.
- `specimens/route.json` entry 13 and `specimens/13-inspector/README.md` with an evidence record. `docs/PLAN.md` has a coverage table and names two thin spots.

### Evidence (observed in this session)

- `typecheck`, `lint`, `test` (179 passed), `build` pass. One test runs every capability listed on every rung; another checks no capability is left off the ladder.
- CLI: `profile_self` and `profile_server --name memory --set subject=changed` printed their engine events (2 tools; 1 definition differs from the one pinned).
- Headless Chromium: thirteen rows in the questions view; inspector bench with the changed listing showed `remember … changed since pinned` and `recall … matches its pin`; self-inspection showed the supported claim and "It read its own declaration, which is the claim in question". No page error.

### Limits

- Inside the inspector bench the inspected server is the lab's catalogue read in the engine; no second connection is made. The Backstage Lens tab is the place where a real `tools/list` answer is read.
- The inspector's anchor, `modelcontextprotocol/inspector`, was not read. Nothing is attributed to it.
- Step 11 (Resume) and step 2 (Query) are thin; see `docs/PLAN.md`.
- Screenshots: `docs/reports/atlas/thirteen-questions.png`, `inspector-changed.png`, `inspector-self.png`, `atlas-30-tools.png`. The phone layout and dark mode were not re-checked after this change.

## Lens, first working cut — 2026-11-21

Owner note: "mcp recon does what we need for lens", with a text on how bounty hunters read MCP servers. The text is stored in `docs/research/2026-11-21-mcp-recon-and-bounty.md`, marked unverified, with a table of what the lab took from it.

### Changed

- `src/domain/lens.ts`: a pure classifier over a tool listing (name, title, description, read-only hint, parameter names). Ten rules L01 to L10, each claim carrying its rule id, the field it rests on, and whether it is declared by the server or inferred from wording. One combination rule C01 (a stored-data reader plus a destination-taking tool). A fingerprint per definition and pins that keep the first one seen.
- Backstage has a **Lens** tab. On a bench it reads the server's real `tools/list` answer and says so; without a connection it reads the catalogue and says that instead.
- **Bend: the server changes a description after you saw it.** The in-tab server appends an instruction-like sentence to one tool, sends `notifications/tools/list_changed`, the client lists again, and Lens shows a new fingerprint, "changed since you first saw it" and rule L09.
- The full inventory shows Lens across all thirteen servers. C01 matches there (recall, read_file, fetch_page) and on no single server.
- The session's tool listing now carries parameter names.

### Evidence (observed in this session)

- `typecheck`, `lint`, `test` (172 passed), `build` pass.
- By test, over a real client and server on the in-memory transport: toggling the bend yields exactly `list_changed → tools/list → result`; the pinned tool drifts to "changed" and back to "unchanged" on restore; L09 fires on the changed listing. By test on fixtures: identical output for the same listing twice; invisible characters flagged; none of the lab's own descriptions is flagged.
- Headless Chromium, Memory bench: fingerprint `9313a41a` → `f1aa5f86` with the red tag and L09, the wire rail ending in `notifications/tools/list_changed`, `tools/list`, `result`; restore not captured in output (the script ended before printing it). Screenshot `docs/reports/atlas/lens-changed-description.png`.

### Limits, stated plainly

- Lens is a teaching instrument over the lab's own simulated servers. It is not a scanner and connects to nothing else.
- The wording rules are a handful of regular expressions written for this catalogue. They will miss most real poisoning and will misfire on innocent text elsewhere.
- The fingerprint is a 32-bit hash for noticing change, not a signature.
- Not built: behavioural checks (calling a tool repeatedly and inspecting replies), schema-aware fuzzing, any supply-chain check, a CLI or MCP entrance to Lens, pointing Lens at itself.
- While the bend is on, the inspector card still shows the catalogue's description, not the changed one the server now lists.
- In `npm run dev`, state restored from before a model change can lack new fields; restart the dev server after pulling.

## Follow-up fixes after the atlas — 2026-11-21

- Fetch: a URL chip fetches at once (`ClickedFetch`); the separate Fetch button is gone.
- Backstage open now takes one third of the column instead of about 43% (observed: workbench 509 px, drawer 253 px at 900 px height).
- Belt slot numbers sit outside the sprite plate so they stay visible in dark mode; atlas labels get a background so a link line does not run through the text.
- Sidebar counts read "2 tools" instead of a bare number.
- Screenshots in `docs/reports/atlas/` re-taken with the 24×24 sprites.

Observed: typecheck, lint, 157 tests, build pass. Headless Chromium re-drive of atlas, belt keys, typing guard, inventory, dark and phone: no page error, no horizontal overflow; Fetch `/notice` in one click produced two hop cards. Not looked at: the phone screenshot of the bench was taken scrolled to the page end, so the belt's position on phones is unverified. Still open: valley map circles are mouse-only; selecting on the atlas does not ask the server.

## Sprites at 24×24, vivid palette, drawn by a script — 2026-11-21

Owner asked to go further and for "less brown, more vivid anime-style colours". All 28 sprites are now 24×24, built from shapes by `scripts/draw-sprites.mjs`, which writes `src/lab/sprites.ts` (generated; edit the script). The palette is 15 saturated paints with an indigo outline; shading is two overlay paths (white highlight upper-left, violet-tinted shadow lower-right). Atlas objects render at 48 px. Observed: typecheck, lint, 157 tests and build pass; atlas looked at in headless Chromium in light and dark (`docs/reports/atlas/sprites-24-light.png`, `sprites-24-dark.png`). Not looked at after this change: belt, inspector chips (20 px) and phone. Screenshots of the earlier 12×12 and 16×16 sprites in that folder are out of date.

## Sprites redrawn at 16×16 with shading — 2026-11-21

Owner asked for higher-fidelity pixel art. All 28 sprites were redrawn on a 16×16 grid (was 12×12) with more detail, and `iconView` adds a highlight path and a shadow path computed from each sprite (light from above). Observed: typecheck, lint, 157 tests, build pass; the atlas was looked at in headless Chromium in light mode (`docs/reports/atlas/sprites-16.png`). The dark-mode render was captured but not looked at. The earlier screenshots in `docs/reports/atlas/` still show the 12×12 sprites. The earlier rough edge about the four Compose sprites is reduced: each bench now carries a distinct 8-row object.

## Capability atlas, pixel tool icons, tool belt — 2026-11-21

Brief: `docs/briefs/2026-11-21-capability-atlas.md`. Owner: "Ok implement it".

### Changed

- **Atlas replaces the home screen.** 28 capabilities as objects on three hand-arranged grounds (Read and perceive / Remember and change / Compose and delegate), grouped into ten families. Selecting one shows its details and draws lines to what else the same server exposes. A second lens names the server under every object. `src/lab/atlas.ts`.
- **One pixel sprite per capability** (12×12, original), used on the atlas, the belt, the inventory, the inspector, the wire rail and "Produced by". `src/lab/icons.ts`. Sprite colours are materials (paper, wood, metal); they do not encode family, success or permission.
- **Tool belt** at the bottom of both screens: up to nine slots, keys 1–9, always labelled with whose tools they are and where the list came from ("its answer to tools/list, just now" versus "per the lab's catalogue · the server has not been asked"). It replaces the sidebar kit. `src/lab/belt.ts`, `src/lab/subscriptions.ts`.
- **Full inventory**: all 28 tools grouped by server, as the conventional non-map route.
- **Families** are a new field on each capability in `src/domain/capabilities.ts`, declared there as this lab's teaching groups, not protocol categories.
- **No course.** Station numbers, the three ordered phases, "Start in the valley" and the visited tags are gone. The sidebar is "Specimens · any order". The valley's seven steps remain as a collapsed "Optional walk-through".
- Research leads supplied by the owner are stored in `docs/research/2026-11-21-wild-examples.md`, marked unverified.

### Why this visual model

A list cannot show that a server's tools sit in different families, or that two servers offer the same kind of thing. Fixed positions plus on-selection links show both without a self-arranging graph. The belt is where "exposes / has access to / used" would most easily blur, so it carries the ownership and source label and can only select.

### Preserved

All 13 benches and their direct actions, the real in-tab MCP session, Backstage tabs and their mode labels, real Python in station 09, CLI and stdio entrances. No dependency added.

### Evidence (observed in this session)

- `typecheck`, `lint`, `test` (157 passed), `build` pass.
- Headless Chromium 1440×900: selected Recall on the atlas; belt showed the Memory server's two tools from the catalogue; opened the specimen; belt source changed to the tools/list answer; pressed `1` (slot selected, frame count unchanged at 10, pill stayed Idle); ran Remember and Recall from the bench; wire rail and "Produced by" showed the Recall sprite; returned to the atlas with Recall still selected and marked "called". Typing `1` in the Python editor left the belt selection alone. Focus plus Enter selected an atlas object. Full inventory listed 28. Dark mode looked at. No page or console error.
- iPhone 13 emulation: atlas falls back to grouped lists, no horizontal overflow on atlas or bench.
- Screenshots: `docs/reports/atlas/`.
- By test: slot key and slot click issue no command and change no world state; keys ignored while typing or with a modifier; belt source; called tools read from frames; every capability has a 12×12 sprite and a family; Remember and Recall sprites differ.

### Left unknown on purpose

"Caller authorised" and "Call approved" are shown as unknown for every capability: the simulation has no identity or approval step.

### Rough edges

- No single server exposes more than four tools, so the belt's "+N more" overflow is implemented but never appears with real data. More than nine is shown only by the full inventory.
- The four Compose sprites share a workbench and differ in a 5×3 pixel detail; at belt size they are hard to tell apart without the name.
- Family assignment is a judgement (for example Step planner under Compose, Click under Change). Not reviewed by anyone else.
- Selecting an object on the atlas does not ask its server; "advertised" stays "not asked yet" until the specimen is opened.
- In dark mode sprites sit on a light plate, which hides the slot number on the belt.
- The selected link line can cross a neighbouring label.
- Not re-checked in a browser after the last layout tweak: the server lens. Not checked at all: a screen reader.
- Earlier items still open: Backstage takes half the workbench when open; Fetch needs two clicks; valley map circles are mouse-only.

## Quality pass on the touchable benches — 2026-11-21

Owner request: a quality check and a small UI/UX analysis, with fixes and a report.

### Changed

- The result of a run now sits directly under the Bend row, above the bench, with a dashed placeholder before the first run. Measured before: on 8 of 12 stations with the Backstage drawer open, and on the valley with it closed, the result was partly or fully below the fold.
- Valley: place chips and the four action buttons moved above the map.
- Station 09: a Python run now shows in the status pill, selects "Write one entry" in the inspector and opens the MCP frames tab. The error shows the last line; the full traceback is folded. Reset clears Python output.
- Wording that still said "Execute" now says what the bench does. The goal line on the CLI station is left-aligned.

### Evidence (observed in this session)

- `typecheck`, `lint`, `test` (148 passed), `build` pass.
- Headless Chromium, 1440×900, light: all 13 stations driven from a reset with two or three actions each, no page or console error; result top edge between 119 and 171 px inside the workbench on stations 01 to 12. Dark: home, valley, perception and station 09 looked at.
- Station 09 with "Third write fails": Python printed two lines, the ledger held clay and timber, the third frame was `isError: true`.
- Not re-run after the last two edits (valley reorder, traceback prefix): the browser drive. Tests pass on them.

### Open UX items, not fixed

See the session report: Backstage takes half the workbench when open; Fetch needs two clicks; the valley's seven steps are not tied to the new buttons; the map's circles are mouse-only; the kit list in the sidebar only inspects; phone order puts the journey below the bench.

## Touchable benches on every station, real Python, home screen — 2026-11-21

Owner request: "Do it for all station finish the nice ui with python stuff where it makes sense".

### Changed

- Every station's bench is now direct manipulation instead of a select plus an Execute button: files, page controls, places, tools and contracts are the buttons. All thirteen benches live in `src/lab/benches.ts`; `view.ts` shrank from about 3000 to about 1900 lines.
- Station 09 holds an editable Python program. It runs in the tab through Pyodide, and each `await ledger.write(...)` is a real `tools/call write_entry` over the in-tab MCP session (`src/adapters/python-runner.ts`). A new capability `write_entry` backs it and is also reachable from the CLI (`--load`) and stdio server.
- The page opens on a home screen: four stat tiles and the thirteen stations in the three phases. The brand mark returns to it.
- Station names are friendlier ("A generated CLI", "An interactive map", "A loop that refines"); `specimens/route.json` keeps the research titles.
- Pyodide is a dev dependency copied to `public/pyodide` by `scripts/copy-pyodide.mjs` before `dev` and `build`; nothing is fetched from a CDN.

### Evidence (observed in this session)

- `npm run typecheck`, `npm run lint`, `npm test` (147 passed), `npm run build`: all pass.
- Headless Chromium at 1440×900: each of the 13 stations opened and its main action clicked without a page or console error. On station 09 the default program printed "wrote clay / timber / iron / all done", the ledger showed three entries, and the frames tab listed the `tools/call` frames.
- iPhone 13 emulation: home and the Memory station have no horizontal overflow.
- Screenshots: `docs/reports/first-slice/home-route.png`, `python-in-tab.png`, `touchable-fetch.png`.

### Limitations

- Python was only added where the program is the subject (station 09). Fetch has no Python "second reader".
- Not observed in a browser: the Python path with the "third write fails" bend, an edited program, and the production build served from a sub-path. The reducer and view for a Python error are covered by tests only.
- The Pyodide files add about 12 MB to `dist`. They load only when a program is first run.
- In `npm run dev`, Foldkit's dev tools restore the previous state on reload, so the home screen does not reappear after a refresh there.
- "Visited" on the home screen means a run was recorded on that station in this tab; a Python run alone does not count.
- Still no upstream revision pinned, and nobody other than the author has used the page.

## Live session, server-listed kit, call console, redesign — 2026-11-21

Changed:

- `src/adapters/in-tab-mcp.ts`: one long-lived session per page (the only mutable state outside the Foldkit model). `enterDomain`, `runOverMcp` and `sendRaw` each return the frames, tool list and world that resulted.
- `src/adapters/lab-server.ts`: when a domain is set, `tools/list` returns only that domain's tools plus `enter_domain`; calling it switches domain and sends `notifications/tools/list_changed`. The stdio entry point sets no domain and still lists everything.
- Lab: on load and on every station change an `EnterDomain` command runs; the sidebar kit shows what the server listed (falling back to the lab's own catalogue when offline, and saying so). Frames accumulate for the session (last 80).
- Call console (Backstage tab): six presets and a free text box. Not-JSON text is refused in the page and never sent; anything that parses goes onto the wire past the SDK client's checks. A reply that ran a tool updates the lab state.
- Redesign: new stylesheet written from scratch on the approved tokens; sidebar lists all thirteen stations under the three phases; breadcrumb bar; the question is the headline; right rail shows the last frames, the item and the run summary; Backstage is a light drawer. Inter and JetBrains Mono replace IBM Plex. Dark mode follows the system.

Observed with SDK 1.32.2 through the console (real behaviour, covered by tests): an unknown method returns error -32601; `tools/call` without a tool name returns -32603, an internal error, not -32602; a message without `id` or without `jsonrpc` gets no reply; wrong arguments reach the tool and come back as a result with `isError: true`.

Evidence: typecheck, lint, build pass; 139 tests pass. Headless Chromium on the production build at 1440, 1000 and 390 px: kit changes from four valley tools to two memory tools after a real `enter_domain`, with `list_changed` and `tools/list` visible; three console sends (unknown method, not JSON, valid call) behave as described; no console errors, no overflow. Screenshots: `docs/reports/first-slice/redesign-station-08.png`, `redesign-console.png`.

Limits: `enter_domain` is the lab's own device for making kits change; it is not part of MCP. Station titles still come from the research route, not the friendlier names on the design canvas. Only station 08 has a direct-manipulation specimen. The home dashboard board from the canvas is not built. Resources, sampling and elicitation are still not on the wire. No light/dark toggle. Nobody has tried it.


## Real MCP in the page — 2026-11-21

Owner pointed to `blackmath88/lil-beavrs` (public; the name given was "lil-weavr", which does not exist) as the model: its lessons run real Python in the browser through Pyodide against an in-page mock, loaded lazily. The equivalent here is a real MCP client and server in the tab (D13).

Changed:

- `src/adapters/lab-server.ts`: the one MCP server of the lab, extracted from the stdio entry point. `src/adapters/mcp-server.ts` now only parses flags and connects it to stdio.
- `src/adapters/in-tab-mcp.ts`: creates the server and an SDK `Client`, links them with `InMemoryTransport`, performs the handshake and one `tools/call`, and records every frame in both directions. The SDK and the server are dynamically imported.
- The lab's run command uses that connection. If it fails to load, it falls back to calling the engine directly and the page says there was no MCP connection for that run.
- Backstage has a new first tab, "MCP frames", labelled "Actual MCP connection" with what that means. The engine-events label now says those events come from inside the server handler and are not protocol messages. Header tag reads "Real MCP · made-up data".
- `@modelcontextprotocol/sdk` moved from devDependencies to dependencies.

Evidence: typecheck, lint, build pass; 127 tests pass, including four that drive the in-memory connection in Node and assert frame order (initialize, result, notifications/initialized, tools/call, result), equality with the direct engine, and `isError` on a domain failure. Headless Chromium on the production build: the frames appear after a click, a failing run ends in "result · isError: true", zero requests left the page other than fonts, no console errors. Screenshot: `docs/reports/first-slice/real-mcp-in-tab.png`.

Limits: each run opens a fresh connection, so every run shows a handshake; there is no long-lived session, `tools/list` is not called by the page (the kit still comes from the shared catalogue), and resources, list-changed notifications, sampling and elicitation are not exercised. The client is the SDK's, not a real host: there is still no model and no approval step. The main bundle is now about 500 kB before gzip plus a 250 kB lazy chunk. A separate design canvas with the proposed new look exists outside the repository and is not yet ported.


## Compact styling pass — 2026-11-21

Owner feedback: everything looks bulky. CSS-only change at the end of `src/styles.css`: one type size down, tighter padding, the phases as slim tabs in a single-row title bar, narrower sidebar and inspector, the specimen's three folds on one line, the run status moved beside the title, and a collapsed Backstage reduced to one slim row. No behaviour changed; 121 tests pass; no overflow at 1440, 1000 and 390 px. Screenshot: `docs/reports/first-slice/compact-08.png`.

The owner pointed to a clean dashboard in the Effect/Foldkit template repository as the look to aim for. It was not found: that repository contains only the counter example, and nothing named "takt" or "dashboard" appears in it, its reference catalog, or the linked starters that were checked. The exact reference is still needed.


## Orientation and station 08 as the pattern — 2026-11-21

Input: an external review supplied by the owner, who left the decision to the assistant. It proposed perfecting station 08 before more breadth, three jobs for navigation, and two fixes. Also merged: the owner's nine commits on `main` (learner journey, Lens ontology, real-specimen research, registry example). Draft PR #2 (phase navigation) was based on an older state of this branch; its navigation is re-implemented here on top of all twelve stations, so that PR is superseded.

Changed:

- Header: current location ("phase › station"), a visible simulation tag, and the three phases as permanent buttons. Sidebar: a source picker reaching every station, then the stations of the current phase. The valley's steps sit in a fold. The valley step "Open the workshop" is renamed "Run a program" so it no longer collides with the phase name.
- Station 08: the map is the specimen. Click a place (or use the keyboard chips) to move it. Beside it, three readings of the same state: on your screen, the model's last view, the tool result. Selecting a reading highlights its marker on the map and explains it. One primary button: open the map, then ask the app where it is looking.
- Every result has "What changed?" (from the run's state-changed events) and "Inspect run" (opens Backstage on the engine events). Backstage starts collapsed and opens on a failure.
- "Bend it" and "Reset experiment" moved from the title bar onto the bench.
- Inspector: "Who authorised it?" became "Was anyone asked?", answered from the run (no prompt in this simulation; names the component that applied a rule, if any). The contradiction with the state answer is gone.
- Browsing no longer wipes anything. Each station keeps its world state and its last run; "Reset experiment" resets only the current station.

Regression found and fixed: since the previous change, the Fetch station's policy switch no longer reached the engine, so every fetch ran with "check every hop". A test now asserts that policy, weather and file-server build each change the engine world.

Evidence: typecheck, lint, build pass; 121 tests pass. Headless Chromium on desktop (1440 px) and an emulated iPhone 13: open the map, move it, see the model's view go out of date, leave to another station and return with the state intact, ask the app, inspect the run, reset. No console errors, no overflow. Screenshot: `docs/reports/first-slice/station-08-pattern.png`.

Not done: only station 08 has the direct-manipulation pattern. The owner's single-map thread (route, moved bridge, print job) from LEARNER-JOURNEY.md is not implemented; stations still have separate small worlds. The phase grouping of stations follows PR #2 and has not been checked against the ontology keys. No person has tried it.


## Stations 08 to 12 — 2026-11-21

Owner direction: continue through 08 to 12 with stand-ins. All twelve stations on the route are now simulated.

Sources read (fetch tool, 2026-11-21, not pinned): the ext-apps map-server README; cloudflare/mcp README; sammcj/mcp-llm README; mcp-agent `evaluator_optimizer.py` and the Temporal example README; IBM/mcp-context-forge README (truncated at about half). What each said is recorded per station in `specimens/route.json` under `checked`.

Changed:

- `src/domain/later.ts`: 08 `show_map`, `get_current_view` (tool result, screen and what the model was told can differ); 09 `run_as_calls`, `run_as_program` (same partial failure, three results versus one); 10 `ask_expert`, `review_plan`, `deliver_plan` (one stand-in, three contracts, map sent or left out); 11 `refine_plan`, `crash_and_resume` (loop rule as read in the reference code; in-memory versus durable); 12 `list_inventory`, `call_tool` (two backends behind one entrance; name collision; backend down).
- `src/domain/settings.ts`: one `key=value` setting per bend for these stations; `carrySettings` keeps every bend across a reset. CLI `--set`, `--name`; MCP server `--set=`.
- The capability dispatch is now a typed table of 27 entries.

Evidence: typecheck, lint, build pass; 115 tests pass. Headless Chromium at 1440 and 400 px, no console errors, no overflow. Screenshots: `docs/reports/first-slice/station-08.png`, `-10`, `-11`, `-12`.

Limits, stated plainly: every "model" in stations 03, 10 and 11 is fixed text or a fixed sequence of ratings; these stations show structure, not model behaviour. Station 08 has no real app or iframe. Station 09's sandbox runs nothing; the "program" is a fixed sequence. Station 12 has no repair bench: no malformed messages and no fuzzing, and context-forge's collision rule was not found in what was read, so both naming rules are the lab's own. The ext-apps README did not describe how a moved view reaches the model; the station's "nothing reported it" is the lab's framing of that gap, not a finding about the example.


## CLI and gateway stations — 2026-11-21

Sources read (fetch tool, 2026-11-21, not pinned): mcporter `docs/cli-generator.md` and README; supergateway README and issues 35, 126, 160.

As read: mcporter says a generated CLI "embeds the resolved server definition and always targets that snapshot", and provides `inspect-cli` and `generate-cli --from` to refresh an artifact. Those pages do not settle whether tool schemas are fixed at generation time, so station 06 simulates that case as its question and says so. Supergateway's README says each SSE and each WebSocket connection gets its own server process; issue 35 (one child shared across connections) is reported fixed in v4.1.0 with the note that a reconnect gets a fresh child; issue 160 (children leaked after an ungraceful disconnect) is reported fixed in v4.1.0 with pings; issue 126 is reported fixed in v4.0.0. Release notes were not checked.

Changed:

- `src/domain/cli-snapshot.ts`: `generate_cli`, `call_generated`, `call_live` against a crate server whose schema can change from v1 to v2 (adds a required field). The artifact validates against its embedded schema without asking the server.
- `src/domain/gateway.ts` and transforms in `world.ts`: `go_to` and `where_am_i` for clients A and B through a gateway that either shares one stateful process or spawns one per connection; reconnect, vanish and session timeout.
- CLI flags `--server-schema`, `--gateway`, `--client`, `--place`; MCP server flag `--gateway=per-connection`.

Evidence: typecheck, lint, build pass; 96 tests pass. Headless Chromium at 1440 and 400 px, no console errors, no overflow. Screenshots: `docs/reports/first-slice/cli-station.png`, `gateway-station.png`.

Limits: the "clients" are a field in the request, not separate connections; the gateway and its child processes are records in the simulated world, not processes. Issue 126 (conflict error killing the child) is described in the specimen but not simulated. Seven of twelve stations are now simulated; none has a pinned upstream revision.


## Filesystem and Perception stations — 2026-11-21

Sources read this time (through a fetch tool, 2026-11-21, not pinned to a commit): the filesystem server README, issues 3602 and 5094 in modelcontextprotocol/servers, and the playwright-mcp README (truncated; tool descriptions rest on a summary). modelcontextprotocol.io did not resolve from the session, so nothing was checked against the specification.

What those sources say, as read: for 2025-era clients, client Roots replace the command-line directories unless `--confine-roots` is set, in which case they can only narrow them; an update with no valid roots keeps the command-line list if no root was ever in force and revokes access otherwise; issue 3602 was closed as working as designed; issue 5094 (previous list kept after an empty update) is recorded as fixed; the README calls Roots deprecated as of protocol version 2026-07-28. Playwright MCP describes structured accessibility snapshots as the default and coordinate tools as opt-in through a vision capability.

Changed:

- `src/domain/files.ts` and `applyRootsUpdate` in `world.ts`: `read_file` over three made-up files, a launch directory, client roots, and three server builds (roots replace, roots only narrow, before the fix). The workbench shows launch list, client roots, the effective list with the reason, and which files are readable now.
- `src/domain/perception.ts`: `take_snapshot` and `click` over a made-up page with four controls (two labelled buttons, an unlabelled picture, a canvas drawing). References go stale after every click. Bend: coordinates on.
- CLI flags `--path`, `--roots`, `--fs-build`, `--target`, `--perception`; MCP server flags `--fs-build=`, `--perception=`.
- A failed run no longer prints the valley's "nothing was built" line for other stations.

Evidence: typecheck, lint, build pass; 84 tests pass. Headless Chromium at 1440 and 400 px, no console errors, no overflow. Screenshots: `docs/reports/first-slice/filesystem-station.png`, `perception-station.png`.

Limits: roots updates are page-level events in the browser and a CLI flag; the MCP server does not exchange real Roots messages with its client. The "before the fix" build models the issue's description, not the old code. The perception page is four fixed controls, not a browser. Pull requests 5095 and 5096 were not opened, so their merge state is unverified.


## Memory and Thinking stations — 2026-11-21

Changed:

- `src/domain/memory.ts`: simulated knowledge-graph memory. `remember` appends a statement, `recall` returns everything about an entity. Facts live in one of two made-up folders (package cache, home). The workbench shows four places: the conversation, the server process, and both folders. Bend: storage path. Lifecycle buttons: restart client, restart server, reinstall package.
- `src/domain/thinking.ts`: one tool, `plan_steps`, with three builds: records the caller's thoughts, computes from the map, or passes on a reply from a scripted stand-in model that was never sent the map. Bend: which build is inside.
- Both are in the catalogue, so the CLI and the MCP server expose them (`--memory-path`, `--reinstall`, `--thinking`, `--thought`).
- Backstage can be collapsed and the workbench gets more height. The "what state changed" answer is now read from the run's state-changed events.

Evidence: typecheck, lint, build pass; 67 tests pass, including memory surviving across calls on one MCP connection and being gone on the next, and one `plan_steps` schema returning different authorship per build. Headless Chromium at 1440 and 400 px, no console errors, no overflow. Screenshots: `docs/reports/first-slice/memory-station.png`, `thinking-station.png`.

Limits: restart client, restart server and reinstall are app-level events in the browser, not engine operations, so they appear under App messages and not in the engine trace. The MCP server keeps memory in process, so "restart" there really loses it regardless of path; only the CLI with `--state` shows the path difference outside the browser. The stand-in model is fixed text. Relations between entities are not modelled. Upstream claims for both stations remain unverified.


## Specimen route and Fetch station — 2026-11-21

Owner supplied a research drop: twelve stations with anchor, diversion and experiment, and the direction that every chapter gets a bend (D10). Also: less text on screen (D11).

Changed:

- `specimens/route.json` (single source), `specimens/README.md` and one README per station with an empty evidence record; `docs/research/2026-11-21-specimen-route.md` as an editorial capture of the drop.
- `src/domain/fetch.ts`: the lab's own simulation of a page fetcher on a four-page synthetic site, with three robots policies (every hop, first URL only, never), a redirect to a disallowed page and a redirect loop. New capability `fetch_page`, available in the browser, the CLI (`--url`, `--policy`) and the MCP server (`--policy=first-hop`).
- Lab: sidebar lists the valley and the twelve stations; reference stations show their question with folded detail and sources; the Fetch station runs. The titlebar bend switches with the station. Item facts, five questions and the honesty note are fold-outs.
- Recording refreshed, because the tool list grew to five.

Evidence: typecheck, lint and build pass; 51 tests pass, including the same URL giving different results under different policies through the CLI and through MCP. Headless Chromium at 1440, 1000 and 400 px: no console errors, no overflow. Screenshot: `docs/reports/first-slice/fetch-station.png`.

Not done: no upstream repository was opened, pinned or run; every claim in the route is the owner's research lead. The Fetch simulation models documented behaviour as described in the drop, not upstream code. The model-initiated versus user-initiated distinction in the reference server is not simulated. Stations 02 to 12 have no simulation.

Caught during this work: `fetch_page` was executable but missing from the catalogue, so it had no kit entry and was not listed as an MCP tool. A test now asserts every executable capability has a catalogue entry.


## IDE layout and MCP plan — 2026-11-21

Owner direction: simulation is enough for now, plan the MCP work, and use an IDE-style layout with the workbench in the middle and the easy-to-complex navigation always visible (D08, D09).

Changed: `src/lab/view.ts` and `src/styles.css` only, plus a `network` Backstage tab. Left sidebar holds the journey (seven working chapters, five listed as planned) and the kit; the workbench is centred with a "Next" button; the inspector on the right holds the item card and the five questions; Backstage is a bottom panel with four tabs; a status bar states the mode. The engine, adapters and state logic are unchanged.

Evidence: typecheck, lint, build and 39 tests pass. Headless Chromium at 1440, 1000 and 400 px: no console errors, no horizontal overflow.

Known UX gaps: panes are not resizable; the bottom panel is short on small laptop screens; planned chapters are not clickable; no light/dark toggle.

Next: see "MCP work plan" in docs/PLAN.md.


## First executable slice — 2026-11-21

Status: implemented and checked locally. Not deployed. No learner evaluation.

### Changed

- Foundation from `blackmath88/effect-foldkit-alchemy-template` at 7b398a7: pinned dependencies, Vite, Vitest, oxlint/oxfmt config, `FOLDKIT.md`, gated `alchemy.run.ts` and its deploy guard. Governance files, reference catalog and Git history were not copied.
- `src/domain`: valley map engine in Effect with typed errors and three services (world store, trace, pace). Operations emit their own events.
- `src/adapters`: in-process (browser, slowed 350 ms per stage so a run can be cancelled), CLI (`npm run lab`), MCP stdio server (`npm run mcp:server`, low-level SDK `Server`, four tools and the map as a resource).
- `src/lab`: Foldkit app. Chapter ladder, kit, Onstage/Backstage, replay (from start, step, play, pause, show all), weather as the one mutation, five questions and a network table derived from the last run's events.
- `scripts/record-entrances.ts` and `src/recordings/entrances.json`: a real CLI run and real MCP frames (handshake, tools/list, tools/call) for calm and storm.

### Evidence (executed in this session)

- `npm run typecheck`, `npm run lint`, `npm run build`: pass.
- `npm test`: 39 tests in 4 files pass. They cover valid and invalid domain operations, state transitions, reset and cancel with late results, replay, the UI path inventory → execution → trace, evidence labels, CLI execution, and MCP over stdio through the SDK client. CLI, MCP and in-process records are asserted equal.
- `npm run test:infra-guard`, `python3 scripts/check.py`, `pytest tests`: pass.
- Headless Chromium against the production build at 1280 px and 400 px: full journey, cancel, reset while running, keyboard selection of a kit item, no console errors, no horizontal overflow. Screenshot: `docs/reports/first-slice/storm-failure.png`.
- The SDK negotiated protocol version 2025-11-25 in the recording. That is an observation of SDK 1.32.2, not a reviewed protocol choice.

### Migrated from `lab/concept.html`

Chapter ladder, kit bar with item cards, Onstage/Backstage split, step/play/reset, one "bend it" switch, five questions, visual tokens.

### Left in the reference HTML

The scripted model and its chat bubbles, and the exhibits on tool descriptions, changed tool definitions, sampling, elicitation, MCP Apps and the tool-list maze. Their protocol details remain unverified.

### Limitations

- The browser never speaks MCP. Live browser-to-MCP was left out to keep the SDK and a subprocess bridge out of the bundle; the MCP path is proven by tests and shown as a recording.
- No model, approval or identity layer. The five questions say so.
- Replay shows a finished run; events are not streamed while the engine works.
- The network view is a table, not a graph. The app follows the system colour scheme only.
- The starter's `package-lock.json` was out of sync with its `package.json` (TypeScript), so `npm ci` failed and `npm install` regenerated the lock. `npm audit` reports 3 advisories in dev tooling; not triaged.
- No Node job was added to CI. `foundation-checks.yml` still runs only the Python checks.
- Cancel and reset discard an in-flight result in the browser. The CLI and MCP adapters have no cancel.

### Practice receipt

`blackmath88/development-practice` is outside this session's repository access, so the live practice source was not read. Work followed local `AGENTS.md`, `FOLDKIT.md` and the starter's `AGENTS.md`.

### Next

1. Run the slice with one learner and record what they can explain.
2. Decide the next slice: a live MCP path from the browser, or the local/remote placement chapter.
3. Add a Node job to CI if this stack stays.

## Concept documentation — 2026-11-21
## Recurring aspects across phases · 2026-11-21

## Linuc synchronization — 24 November 2026

Preserved the local `lab/` workbench, `tooling/` factory and selected synthetic evidence alongside all 22 newer GitHub commits. Resolved four documentation conflicts by retaining the newer direction and appending the dated local records. Original working checkout and its staging remain intact. No services, model calls or deployments were started.

Practice source: `blackmath88/development-practice` at `8a416833d269475653861964984cb8cfb6aa37c1`, freshly resolved from GitHub. Read baseline, decision ledger and prototype profile; applied preservation of existing work, explicit provenance and bounded verification. No optional method selected. This remains advisory draft guidance.

Verification for this synchronization: foundation structure check passed; Python contracts passed with 3 optional producer checks skipped; all three local lab test files and all 9 tooling tests passed. The tooling stdio test passed when rerun outside the restricted sandbox. No browser or human-learning evaluation was performed in this synchronization.

## Gateway exhibit · 2026-11-21

Added the [proxy concept](concept/MCP-PROXY.md) and its Papercut module mapping. The proposed fixture compares proxy and backend denials using separate receipts. No runtime experiment was executed. Development Practice draft at `8a416833d269475653861964984cb8cfb6aa37c1`, baseline, decision ledger and prototype profile, informed the choice of a disposable fixture. The next design check is whether a learner can identify which component denied each edit.

## Creative specimen intake · 2026-11-21

Added the [boundary-bending specimen shelf](research/BOUNDARY-BENDING-SPECIMENS.md). The first proposed exhibits are retro-protocol browsing, a shared ComfyUI canvas and one Meta Chess turn. Primary documents and project records support the research; experiments have not been run. Unresolved attributions are marked in the shelf. Next, select one fixture or recorded interaction for the existing stations.

## Security boundaries — 2026-11-21

Learned: the owner asked where the hacking happens. Answer recorded: at boundaries where information becomes authority, across discovery, descriptions, model and host, gateway identity, server scope, embedded-app bridge, observation, and Lens itself.

Changed: added [docs/concept/SECURITY-BOUNDARIES.md](concept/SECURITY-BOUNDARIES.md) with a boundary table, safe-lab rules, and a proposed local stolen-diamond exhibit (injected document, synthetic secret, local sink, three variants, six-field scoreboard). Added a security section and link in CONCEPT.md and corrected the earlier framing that authentication is encapsulated in the MCP layer.

Evidence: public MCP security guidance was read; no upstream runtime, scan, exploit, or security test was executed. No finding against any named specimen is claimed. The proposal grants no permission to test any system. The newer handoff entries below were re-read immediately before this change and preserved unchanged.

Next: build the stolen-diamond exhibit locally with a scripted caller, owned synthetic data, and an observed enforcement component; add a real-model variant only as a separately labelled run. Consider where security belongs among the recurring aspects in the learner journey.

Practice: the latest practice source revision was not freshly resolved for this change; the prior recorded selection below remains the basis. Limitation disclosed rather than claiming current verification.

## Recurring aspects across phases — 2026-11-21

The original ten-facet ontology remains the background classifier. The [learner journey](concept/LEARNER-JOURNEY.md#recurring-aspects) now carries interface, behaviour, architecture and evidence through each phase of one progressively more complex specimen. This supersedes the category-first presentation below. Design update only.

## Capability profile summary · 2026-11-21

The ontology and specimen index now group detailed facets under Interface, Behaviour and Architecture. Observability supplies evidence for each classification. This changes the presentation of the proposed classifier and preserves the ten facet keys.

## Ontology index · 2026-11-21

The [specimen index](research/REAL-MCP-SPECIMENS.md#specimens-by-mcp-lens-ontology) groups the research by all ten Lens facets. Five worked profiles distinguish specific operations, including dispatch and camera capture in the same project. This is a documentation change using the existing research and prototype practice selection. No runtime was exercised.

## Learner journey and specimen shelf · 2026-11-21

The [three-chapter journey](concept/LEARNER-JOURNEY.md) keeps the thirteen ontology keys as optional authoring references. Each has an upstream source and a proposed observable variation. Design only. Next walkthrough: one upstream UI, one human edit and its evidence. No runtime or learner evaluation performed. Continues the prototype practice selection below.

## Learning ladder and URL classifier · 2026-11-21

Added the [proposed MCP Lens ontology](concept/MCP-LENS-ONTOLOGY.md). It defines 13 teaching steps, per-capability facets, typed relationships and evidence rules. Next classifier slice: classify saved metadata for one upstream specimen and show declared UI alongside unknown runtime behaviour. This is a design deliverable; the classifier has not been implemented. Continued the prototype practice selection recorded below.

## Real-world specimen research · 2026-11-21

Added the [implementation research](research/REAL-MCP-SPECIMENS.md) and linked it from the plan. It covers measured adoption, creative implementations, protocol edges, published security cases and a candidate map storyline. The host milestone in the concept addendum takes precedence. Next, verify one pinned upstream app through the local host, then inspect whether a human edit reaches the next caller. Public sources were reviewed; no upstream runtime, security test or hardware experiment was executed.

Practice source: blackmath88/development-practice at 8a416833d269475653861964984cb8cfb6aa37c1. Read PRACTICE.md, docs/DECISIONS.md and profiles/prototype.md. Applied the advisory prototype guidance to scope each proposed variation to observable evidence. No optional method selected.

## Concept addendum — 2026-11-21

Status: documentation update only. Added docs/concept/ADDENDUM-SPECIMENS-LENS-AND-EMBEDDING.md and linked it from CONCEPT.md. No specimen-host, Lens, application, test, or deployment implementation is claimed.

Captures the follow-up conversation: Effect/Foldkit/Alchemy, interesting anchors and diversions at every level, controlled experiments, real upstream embedding, registry-versus-gateway distinctions, MCP Lens inspection/evidence model, and the proposed next Claude milestone. Clarifies that the committed registry example is untested REST integration code, not a live MCP or Apps implementation.

Inspected current CONCEPT.md and HANDOFF.md through GitHub before drafting. Current implementation baseline is the existing-registry example commit f4e22cb429409713a9b98bcc7fb1d7698c4df2cb. External references are carried forward research leads, not newly verified runtime claims. No automated checks or external execution were performed for this documentation update.

Practice: advisory prototype baseline previously inspected at blackmath88/development-practice 8a416833d269475653861964984cb8cfb6aa37c1; not freshly resolved here. Applied explicit status labels, bounded scope, and preservation of unrelated work. No private practice text copied.

Next: Claude should inspect the actual working tree and starter, adapt the official Apps basic-host/AppBridge boundary into the Effect/Foldkit application, and prove one real upstream tool/view plus actual trace and truthful failure. Add richer specimens through that same boundary, not another catalogue or a separate custom host per example.

## Existing-tool integration exhibit — 2026-11-21

Status: code and embedding instructions authored; not executed or end-to-end verified. No deployment, installation, hosted search, or MCP session was performed by authoring these files.

### Changed

Added examples/registry-discovery/serve.py, index.html, and README.md. The local exhibit integrates existing official-registry and LastMile search REST endpoints, exposes raw evidence, and labels both paths REST rather than MCP. It does not connect to discovered servers. The guide describes real MCP-client and official MCP Apps host-bridge integration as next work, not completed features.

The Effect/Foldkit/Alchemy direction remains unchanged. The standalone example demonstrates adapter behavior for later migration, not a new production frontend stack.

### Evidence and checks

Repository root re-inspected at 8215ea5d2f0e1abe600e0810ed1f927b183ad673. Primary documentation fetched for modelcontextprotocol/registry official API, lastmile-ai/mcp-registry-search README, and modelcontextprotocol/ext-apps. Hosted endpoint availability, syntax, browser behavior, and compatibility were not tested. No automated checks were run; tests to add are listed in the example README.

Practice selection remains the advisory prototype baseline previously inspected at blackmath88/development-practice 8a416833d269475653861964984cb8cfb6aa37c1. It was not freshly resolved for this follow-up. Applied bounded synthetic/read-only scope and explicit evidence labels. Limitation disclosed rather than claiming current practice verification.

### Next

Run the example and deterministic tests locally, migrate into the Effect/Foldkit application, then add the same existing search service through a real MCP client. Integrate one official MCP App using app-bridge, not an arbitrary iframe. Preserve provider provenance and separate observed data from Lens classifications.

## Previous concept handoff — retained summary

The concept commit established inventory discovery, program-like items, CLI overlap, placement, workflows, inversion, and mixed module networks. Owner direction and proposals are separated in docs/DECISIONS.md and docs/concept/CONVERSATION-SYNTHESIS.md. Identity/authorization are architectural assumptions, not protocol guarantees.

Prior repository baseline: b120b9e7c84366fc55010a77b296689057d5aab8. Direct inspection covered root, AGENTS.md, START-HERE.md, concept, decisions, plan, handoff, development-practice instructions, practice source configuration, and branches. No Observatory snapshot was inspected. The earlier change modified nine documentation files: four existing scaffolds and five new concept files. Earlier prose referring to ten files was incorrect.

Prior practice receipt: blackmath88/development-practice at 8a416833d269475653861964984cb8cfb6aa37c1; baseline, decision ledger, prototype profile; no optional method. No private source text was vendored. Prior checks were read-only repository inspection; no runtime or learner evaluation was performed. The conversation is preserved as a synthesis, not a verbatim transcript. Protocol/provider claims still require version-specific verification.
## Preserved local implementation record — 18 November 2026

The following record was recovered from Linuc during Git synchronization on 24 November 2026. It describes the earlier local prototype and its historical decisions; the newer concept and specimen-host direction above remain current. Historical verification claims below have not been re-certified by this preservation step.

# Handoff — 18 November 2026

Status: local MCP factory built and first exhibit executed on linuc. Working-tree changes are uncommitted; nothing was published. Start with README.md and `.lab/report.html`.

## What exists

- `tooling/src/core.mjs`: SQLite mission/run/event/artifact store, CAS revisions, source-dependent evidence freshness, independent transformation audit, advisory judgments.
- `tooling/src/server.mjs`: real stdio MCP tools and artifact resources. `tooling/src/cli.mjs`: local inspection/reporting fallback.
- `tooling/src/personas.mjs`: composition of the existing Personas MCP, validated moves, serialized renderer access, atomic render persistence.
- `.agents/skills/lab-factory/SKILL.md`: reusable supervised inquiry workflow; independently forward-reviewed for a PDF request.
- Project-local `.codex/config.toml` installed; exact repository trust approved and `codex mcp get lab_factory` succeeds. A fresh host session should load it; current chat hot loading was not demonstrated. Happier CLI only offered all-machine binding, so no such binding was created.

## Executed evidence

Latest mission: `mission-13ead2da-7233-435e-a8ff-5a902dc00f9d`.
Report: `.lab/report.html`; portable text: `.lab/report.md`; store: `.lab/lab.sqlite`; all ignored by Git.

The actual path was SDK client → Lab MCP → Personas MCP → validator/Chromium renderer. It produced four images, exact-diff and integrity evidence, and a stale-write rejection. All four exported images were inspected by the coordinator: expected relocation and readable labels. Deterministic checks and advisory explanation are satisfied; human learning remains unverified.

Original-layout mission `mission-787c79ee-93ba-4da6-8aff-8476387e1686` failed after-move rendering: `Folie 2: Inhalt passt nicht (Arbeitsbereich: Häuser passen nicht auf die Folie)`. The failed run was explicitly recovered into the ledger after the first pilot did not yet log errors automatically. The pilot now records errors and terminal failure. Successful variant uses workspace-scene for the preview in BOTH baseline and candidate; overview remains houses. First compact mission `mission-ecadd267-9378-4d8c-accf-5c692d078ecc` is also retained; latest rerun adds corrected atomic persistence and source dependencies.

Real Happier-managed Codex runs:
- Scout: `run_d982d18c-171f-4061-85ca-912e2c3eb334`.
- Independent review: `run_9862128d-aa35-4620-b3e6-78fedb21e561`.
- Final review: `run_a23d3725-b998-4087-af7a-a1445ebda714`.

Structured deliverables and execution timestamps were imported after completion, explicitly labeled; these local registration timestamps are not dispatch times. No worker conversations were imported. Reviewer exposed wrong timeout position, partial render persistence, duplicate IDs, and an overbroad PNG claim. All four addressed; final review accepted fixes and supplied the recorded advisory explanation. Costs and tokens remain unknown; elapsed durations are known. Workers' own write-dependent tests failed with EROFS, not implementation regressions; coordinator ran the writable checks below.

## Verification

- `npm --prefix tooling test`: 9 passed, 0 failed, including real MCP stdio, shared-store CAS/capacity, freshness, judge boundaries, independent move audit, renderer retrieval/hash faults and late-insert transaction rollback.
- `python3 -m unittest discover -s tests`: 13 total, 10 passed, 3 skipped because optional pinned Observatory producer not configured.
- `python3 scripts/check.py`: Foundation structure OK.
- Skill `quick_validate.py`: Skill is valid.
- `LAB_COMPACT_VIEW=1 PERSONAS_ROOT=/home/nuc/projects/msteams-personas npm --prefix tooling run pilot`: passed actual rendering. Later changes only strengthen test assertions/tool descriptions/reporting, not rendering behavior.
- Source-file hashes for the final implementation and test receipt are stored as `verification.json` in the latest mission.

## Provenance and remaining boundaries

Repo base: `026b866f4e95213da2f69dfaf927acd594390dc9`. Personas source: `/home/nuc/projects/msteams-personas`, feature branch `feat/workspace-house-views`, revision `4a9b9ae3285c9acba78d5ec1a74cb717aae96b99`. Personas source was not edited. Direct inspection used because no current Observatory snapshot existed.

Dynamic Practice: exact resolved revision `8a416833d269475653861964984cb8cfb6aa37c1`, prototype profile + build method, advisory working draft. Applied bounded runnable slice, existing deterministic capabilities and truthful verification. Initial sandbox retrieval failed; coordinator's approved retrieval succeeded. Read-only workers separately disclosed unavailable live practice reads.

Single trusted local account; consistency guards are not multi-user authorization. Events are not a signed tamper-proof audit log. PNG checks cover headers only. Shared-canvas editing, guarded undo, automatic module installation, provider usage accounting and screenshot-only agent comparisons remain unimplemented. PDF native evidence storage needs a bounded media-type extension before that module. SQLite's WAL bookkeeping can require write permission for readers; `.lab/report.md` is a read-only fallback. Interrupted rendering can leave a lock: confirm no renderer is running before manual recovery. No unattended scheduler exists.

Next useful action: inspect the report with the user, capture what they notice, and select the next bounded experiment. Do not claim universal lab generation or learning from a passing tool call.


## Tooling organization follow-up

User requested all orchestration tooling in a repository subfolder, with concept, idea and implementation history, followed by a first-experiment walkthrough. Moved the Node package, implementation, tests, scripts and canonical skill to `tooling/`; `.agents/skills/lab-factory` is a relative discovery link. Updated the installed MCP entry to the moved server. Default runtime location is now independent of shell cwd and still points at root `.lab/`; all three historical missions remain accessible. The live database and historical receipts were not rewritten.

Read the selected knowledge, implementation, installer and source evidence directly. No current Observatory snapshot was available. Resolved Dynamic Practice once again to `8a416833d269475653861964984cb8cfb6aa37c1`; read baseline, decision ledger, prototype profile and build method (advisory draft). Applied preservation of working behavior and bounded verification; no new dependencies or workers were needed.

New documents: `tooling/README.md`, `tooling/docs/CONCEPT.md`, `tooling/docs/IMPLEMENTATION.md`, and `tooling/docs/experiments/01-move-one-room/README.md`. The exhibit includes original/before/after JSON, recipe, four real PNGs and a hash/provenance index. Only fictional specimen artifacts were exported; no transcripts, credentials or complete worker receipts were copied into repository content. The three detailed documents are explicitly selected in the knowledge manifest.

Migration verification: nine Node tests pass, including actual stdio MCP discovery/calls/resource reads; Codex configuration resolves the moved path; CLI still lists the original three missions. Exported specimen hashes and independent move audit verified. Python foundation tests: 10 passed, 3 optional producer tests skipped; structure and skill checks pass. Actual rendering was already verified in the prior build; this move did not rerun rendering or create a new mission.

Start the walkthrough at `tooling/docs/experiments/01-move-one-room/README.md`. Changes remain local and uncommitted; no remote publication occurred.


## Scrollytelling mini-task

User requested a subagent-built visual explainer, using Scrollies as precedent and the lab framework for coordination. Read `not-everything-is-an-agent` README/HTML and `learn-in-missions` README/concept at Scrollies revision `3936182d01a9931be1402956e53919f0ebd369b9`. Transferred the continuity object and sticky/inline narrative pattern; no source implementation was copied. Dynamic Practice resolved again to `8a416833d269475653861964984cb8cfb6aa37c1` (prototype + build, advisory), applied as a bounded buildless page with real evidence.

Deliverable: `tooling/explainers/one-room/index.html`, CSS, JS and README. Native worker `/root/scrolly_builder` built it under local mission `mission-8a670814-5a3d-47fd-a6c3-4ab7baa3f0f1`; parent reviewed and made two CSS fixes. Existing generic-subagent preference was respected: native execution, not a Happier run. Skill now documents native runtime attribution alongside the existing Happier workflow. No new dependencies, inference service, deployment or remote writes.

44 automated assertions passed in disposable local Chromium: 1440px desktop, 390px mobile, reduced motion, and JS-disabled fallback. Covered all seven scene states, inline visuals, horizontal overflow, focusability, before/after state, and loaded evidence images. Source syntax, duplicate IDs, relative links and anchors verified. Desktop tools/result and mobile screenshots visually inspected. Browser/CUA host unavailable; local Chromium QA used. Initial CLI virtual-time scroll probe failed due to frame scheduling and produced blank screenshots; a real-time isolated-browser test resolved it, all assertions passed. This was a harness issue, not accepted evidence of page correctness. Local QA script/results/screenshots remain in `.lab/scrolly-qa/`; selected outputs are recorded in the mission. No human understanding or complete accessibility audit claimed.

Open the file directly; all links are relative and no server is required. Runtime record: `.lab/scrolly-task.json`. The first experiment's `.lab/report.html` remains intact; this task's ledger report is `.lab/scrolly-report.html`. Changes remain local and uncommitted.


## Private scrolly link

User requested access from Blackbird over Tailscale. Served a minimal static copy (HTML/CSS/JS + fictional evidence only) at `http://100.97.81.120:8788/`, bound exclusively to linuc's Tailscale address. User transient service `mcp-scrolly.service` survives this chat, not reboot; stop with `systemctl --user stop mcp-scrolly.service`. Main page, CSS, JS, two images and evidence JSON returned HTTP 200 from linuc. Blackbird connectivity remains for user verification. Static copy: `.lab/scrolly-site`; refresh after source edits.

HTTPS Serve registration failed with `Access denied: serve config denied`; sudo required a password. Pending pkexec was cancelled before any change. Existing Serve/Funnel configuration preserved. Direct HTTP uses the Tailscale connection; no public Funnel exposure added. MagicDNS name lookup on linuc returned public IPv6 addresses and timed out, so the verified link uses its Tailscale IP. Metadata: `.lab/scrolly-hosting.json`.

## MCP Lab research mission: first bounded round (2026-11-18)

User authorised starting the larger experiment. Read START-HERE, selected knowledge, lab-factory skill, current implementation/status, and direct prior-lab sources (no current Observatory used as authority). Dynamic Practice resolved once for this task to `8a416833d269475653861964984cb8cfb6aa37c1`; baseline, decision ledger, prototype profile and discover method read, advisory draft. Applied controlled comparison, bounded research and explicit evidence/interpretation. No extra stack or paid inference.

Mission `mission-345cb04d-2451-4583-b93e-f6e37ef95fa7`: native scout `/root/mcp_creative_research` mapped seven creative practices; native auditor `/root/mcp_prior_lab_audit` inspected PDF/XL and later independently reviewed the new experiment. Provider attribution is native-codex, not Happier. Coordinator built the exhibit. Reports are under `docs/research/`; mission direction is `docs/MCP-LAB-MISSION.md`.

PDF inspected at `f61b470dd7574cfd9eb9ec6ba68325b1508ec559`, XL at `324fe21a54087ea0540f4eb6b647f05a8afd9d1b`. They demonstrate real unusual artifacts and consumer-dependent meaning; the inspected sources do not establish implemented MCP servers (XL adapter is future work). Method transferred: specimen, instrument, controlled variation, visible evidence. For MCP add protocol/version/capability/runtime receipts. Source research corrects earlier sampling proposal: 2026-07-28 deprecates it. Mutable web claims remain distinct from tested SDK behavior.

New `tooling/experiments/02-tool-asks-back`: real stdio SDK pair, seven synthetic-host conditions over two protocol setups. All 14 assertions-based cases pass; independent reviewer reproduced 14/14. Pinned modern uses input_required/retry; legacy default actually initializes 2025-11-25 and sends reverse elicitation. Only accepted confirm=true moves once; all other cases write zero. Strict form schema rejection is retained as deliberate failure specimen. Initial coding errors (assertion signature and capability field) corrected before accepting results. Independent review prompted wire assertions and automatic installed-version/source-hash receipts; coordinator reran those later changes. Review document is explicit about its earlier source hash.

`lab/` adds a buildless evidence replay and research map. It labels synthetic fixtures, recorded playback, no live AI and unresolved host/consent/concurrency limits. 30 isolated Chromium assertions pass at desktop/mobile widths, covering every case selection and overflow; mobile screenshot inspected. QA evidence stays in `.lab/mcp-lab-qa/`. Private static subset copied to existing Tailscale server `/lab/`; no service configuration or public exposure changes. Blackbird access and human learning remain user-verifiable, not claimed. Repository changes remain local/uncommitted. Next proposed experiment: stale shared-state edits preserving unrelated human changes.

## Workbench correction after user rejection

User rejected the editorial scrolldown page and explicitly requested an IDE-like application whose central content hosts different use cases. This supersedes the prior UI direction; automated correctness of the old page did not establish product fit. Inspected START-HERE, concept, decisions, plan, handoff, existing HTML/CSS/JS and the actual room artifacts. No current Observatory snapshot used; direct source inspection. Read Sites skill and local-preview guidance, preserving local-only Tailscale delivery without hosted registration or a new stack.

Replaced `lab/` UI with a viewport-sized shell: explorer, workspace tabs, central canvas, inspector and activity console. Three working views: browser-local editable room with move/drag, rename, undo and JSON export; recorded MCP message stepper with protocol/case controls; before/after real Personas render viewer with house/Teams selection and source JSON downloads. Local state persists across tabs; reset/reload are explicit. This is not a live MCP host or model integration, and saved renders do not regenerate from local edits. Labels state those boundaries. Existing protocol research/runtime preserved; only selected fictional artifacts copied into static delivery.

Practice read invoked with prototype + build (advisory draft); source baseline and decision packet returned by scripts/practice.py. Same reference revision as prior task; source receipt retained below where available. UI acceptance is still user-owned: this implementation addresses their specified interaction model, not a claim that they now approve it.

Practice receipt: `blackmath88/development-practice@8a416833d269475653861964984cb8cfb6aa37c1`, `PRACTICE.md`, `docs/DECISIONS.md`, `profiles/prototype.md`, `skills/build/SKILL.md`. Applied explicit state boundaries, synthetic interactions and no new dependencies. Source remains advisory; existing authorisation covers refreshing the private preview. Verification: JS syntax and diff whitespace pass; 30 automated Chromium assertions pass over 1440×1000, 1024×768 and 390×844 (viewport containment, move, rename, undo, tab state, replay step/case, real image load, reset). Desktop canvas screenshot visually inspected. QA script/results/screenshots in `.lab/workbench-qa/`. Drag-and-drop and export implementations exist but were not separately automated in this pass. Private `/lab/` refreshed; no service configuration changes. Full accessibility and human product acceptance remain unverified.

## Newcomer curriculum: research, design and first build

User authorised the proposed Lab Factory workflow after clarifying audience and content: MCP generally, technically curious newcomers, recognizable real integrations, then broader possibilities and edges. IDE layout stays; prior-project examples leave the learner experience. Read current source directly (no current Observatory snapshot available), selected direction and existing mission list before creating `mission-a58d0c16-d151-4b31-98a0-8cad4dda2a23`.

Practice source resolved once: `blackmath88/development-practice@8a416833d269475653861964984cb8cfb6aa37c1`; baseline, decision ledger, prototype profile and discover method read as advisory. Applied task-first exploration, source/interpretation separation, explicit state and bounded implementation. Advisory discover 'no automatic dispatch' does not override the user's explicit instruction to execute the coordinated workflow.

Native workers `/root/ecosystem_curriculum` and `/root/learning_workbench` produced sourced research and a build-ready interaction brief. Both independently recommended a notes retrieval/edit opening. Eight real integration candidates; no defensible universal usage ranking. Public GitHub star figures in the report are repository interest, not active usage. Reports are selected in knowledge manifest; original source claims remain separate from proposed exhibits.

Builder `/root/curriculum_builder` owns `lab/`; independent reviewer `/root/curriculum_review` owns review findings. Two active local worker runs maintained, linked before execution outcomes. New reusable review rubric `tooling/docs/EXHIBIT-REVIEW.md` separates source correctness, functionality, usability and learning. No new service, inference credentials, installed integration or cost claim. Validation and outcomes appended after completion below.

Outcome: one playable Notion-inspired notes model plus seven labelled source-backed previews, in the preserved IDE layout. Search, Weird filter, hash Back/Forward, Try/Compare/Evidence views, responsive drawers and contextual actor explanations implemented. All prior-project content removed from active navigation and source loading; historical files retained. Private static `/lab/` refreshed using existing Tailscale service; no service configuration changes. The app makes no external calls and never claims live Notion, live AI or actual MCP traffic.

Verification: 5 pure-state tests pass (independently rerun); 45 browser functional checks across 1440×1000, 1024×768 and 390×844 pass; 15 further real-keyboard/history/drawer checks pass. Desktop/mobile screenshots inspected. Independent reviewer found replacement controls losing focus and ambiguous current-source/snapshot link wording; builder fixed both, then targeted checks verified source highlighting, focus retention, tab keys, Back/Forward and mobile focus trapping/Escape. Earlier keyboard harness failed because Enter events lacked virtual key/text metadata and a numeric CSS attribute selector was unquoted. Failed initial output retained at `.lab/curriculum-qa/keyboard-first-attempt.json`; later corrected harness throws evaluation exceptions instead of silently cascading. These harness failures are separate from the real focus findings. QA source/results/screenshots remain in `.lab/curriculum-qa/`.

Execution usage/cost unknown; no new provider credentials or paid-service calls. Human understanding and product acceptance remain unverified. Next action: user tries retrieval, read-only edit rejection and editable retry, then explains who provided the information and who changed the note. Further runnable integrations should follow that feedback; previews are not completed experiments.

Final run receipt: all four native role runs completed. Source snapshot, research, design, initial failed keyboard evidence, final 45 functional and 15 keyboard checks, and independent review stored as artifacts in the mission. Final browser rerun covers app hash `c4e544aedd492a8310693fe94f143547e7e1c39e8d9d5fb5d039bbc17e7c7279`. Artifact integrity and advisory brief review satisfied with current heads; learning unverified. Local report: `.lab/curriculum-report.html`; run IDs/artifact refs: `.lab/curriculum-mission.json`. Changes remain local and uncommitted; no remote repository publication. User preview: `http://100.97.81.120:8788/lab/`.

## Visual educational layers: four-specialist improvement

User says the newcomer workbench is substantially better, but Basics still under-explains MCP. Requested four expert agents and visual information layers around the central demo, with less text. Using Lab Factory mission `mission-67768567-38cc-4393-bd4c-8a12082acc47`, preserve baseline source and exact user-feedback scope without inferring learning acceptance.

Four native specialists in two pairs: `/root/basics_learning_expert` (learning sequence), `/root/basics_visual_expert` (visual explanation), `/root/basics_interaction_expert` (interaction implementation), `/root/basics_review_expert` (independent review). Two active workers per mission maintained. First pair wrote bounded build briefs; second pair implements and challenges causal fidelity. No model/provider switches, additional inference service or external integration.

Read current source, state tests, existing direction and handoff directly; no current Observatory snapshot used. Dynamic Practice resolved once to `8a416833d269475653861964984cb8cfb6aa37c1`: baseline, decision ledger, prototype + build, advisory. Applied small coherent extension, explicit state, visual task orientation and evidence-based review. Existing private Tailscale delivery retained.

Chosen design: three views of the same task—Who acts? (host contains model/client; MCP labels link to server), What travels? (app state versus retrieved snapshot chips), What changes? (lab read/edit availability and actual change count). Historical event selection highlights explanation; it cannot rewind or mutate live specimen state. Optional detail carries caveats; core visual state does not depend on motion or color alone. Checks and final evidence follow below.

Completed visual-layer slice: `lab/visual.mjs` derives lenses from current specimen plus explicit historical actor/stage metadata; no state replay or fabricated historical payload. Connection diagram nests model/client in host and labels MCP as common interface. Data trays distinguish current packing list from last read. Capability lanes state lab scenario and latest-action change count. Guided prompt, Previous/Next modelled-event inspection and compact sequence replace default log wall; full logs, limitations and sources remain available in details/Evidence. Core state and all eight catalog entries retained.

Four-specialist contributions and corrections recorded in `docs/research/mcp-basics-layer-review.md`. Independent reviewer reran 8 state/visual tests and inspected source. Parent ran 34 visual/state/viewport checks, 11 targeted real-keyboard checks and 45 existing interaction regressions. All pass. Desktop1440×900, laptop1024×768 and mobile390×844 screenshots inspected; reduced-motion state verified. Default visible paragraph prose in center/inspector measured83→21 words at1440×900, a limited presentation measure, not a learning score.

Failures preserved: initial27 checks missed ancestor grid expansion after19 events; screenshot and measured906px container/1390.36px implicit track revealed it. Explicit constrained column and sequence-only scrolling fix verified by added checks. Geometry-only keyboard filtering included closed-disclosure links; explicit details-ancestor filtering fixed the11th keyboard check. Diagnostic harness also encountered a missing control before page readiness; final waits for actual lens control. Evidence, screenshot comparisons, failure summary and tests under `.lab/visual-qa/`; no false clean-first-pass claim.

Private preview refreshed at `http://100.97.81.120:8788/lab/` using existing Tailscale service. No new hosting, external calls, accounts, model costs or source-control publication. Actual human comprehension remains unverified; next user task is to inspect Who acts / What travels / What changes during retrieval, blocked write and editable retry.

Final mission receipt: all four specialist runs complete. Baseline, two briefs, final source, checks, failure findings and review stored with hashes. Integrity and advisory visual review satisfied/current; human-learning criterion remains unverified. Mission report `.lab/visual-learning-report.html`; exact run/artifact IDs `.lab/visual-learning-mission.json`. Changes remain local/uncommitted.

## Workbench visual polish and explanatory motion — 2026-11-18

User likes the visual center and requested better UI and animation, suggesting React/TanStack. Read current START-HERE, plan, handoff and lab source directly. Dynamic Practice resolved once to `8a416833d269475653861964984cb8cfb6aa37c1`; baseline, ledger, prototype profile + build method read as advisory. Applied bounded presentation change preserving the specimen and working IDE. React/TanStack/MDN official documentation consulted; framework decision and sources recorded in lab README. No migration: native modules suffice for this slice. No new agent dispatch or independent-review claim for this pass.

Implemented local actor SVGs, improved stage hierarchy/cards/controls, direction-colored request and returned-result packets, actor pulses, and opt-in Play/Pause replay with three speeds. Presentation-only controller cannot call domain operations. Historical selection remains separate from current data. Reset, route/scenario/manual step/lens changes and hidden page stop playback. Reduced-motion disables visual animation, leaving manual explanatory steps available. No live AI, MCP exchange, external dependencies, new service or paid inference added.

Verification executed: 12 module tests; 11 targeted browser checks (replay start/advance/pause/end, unchanged specimen and event count, reset cancellation, 1440/1024/390 width overflow and reduced motion); all 11 existing keyboard/drawer/lens checks. All pass. Desktop and mobile screenshots visually inspected. New browser source, results and screenshots in `.lab/polish-qa/`; keyboard rerun in `.lab/visual-qa/keyboard-results.json`. Existing Tailscale static directory refreshed. Changes remain local/uncommitted. Human learning and visual acceptance remain unverified. Next user action: Find my packing list → Replay, then use the three explanatory lenses.

## Composition redesign after visual rejection — 2026-11-18

User rejected the previous cosmetic polish and requested professional-quality design. Read START-HERE, current selected concept/decisions/plan/handoff, workbench source and previous screenshot evidence directly; no current Observatory used. Practice source resolved once to `blackmath88/development-practice@8a416833d269475653861964984cb8cfb6aa37c1`, baseline + ledger + prototype/build (advisory draft). Applied intentional composition, preserved specimen semantics and existing local delivery; no framework migration or new dependencies. Sites local-only workflow retained. No worker dispatch or independent review claimed this pass.

Implemented a substantive presentation redesign: charcoal IDE chrome and light canvas, quieter explorer, a question entering an application window containing model/client, explicit protocol wire and distinct server/application cards. Three lenses share an updated visual system. Saved notes and received assistant context now sit side by side on desktop; mobile stacks them. Replaced emoji brand mark with local SVG. Timeline height adapts to empty/populated history. Primary task actions now immediately start bounded explanatory playback, with Pause/Replay/speed/manual steps and reduced-motion suppression of autoplay. State changes still happen deterministically once before the presentation sequence; current data versus historical explanation remains explicitly labelled.

Screenshot review caught excessive stage height, small actor labels, inherited white-on-light active wire labels and a narrow mobile question chip. Corrected those before final handoff. Desktop now shows both data panels with the diagram at 1440×900 and 1024×900; mobile provides scrollable central content with retained shell controls. No claim that the user has accepted the new design.

Executed: syntax check, all 12 module tests, 10 targeted redesign browser checks, 45 existing interaction regressions across three viewports, 11 keyboard checks. All passed. Keyboard harness now manually selects the final event before checking Previous, reflecting the newly automatic explanation start. Targeted screenshots/results/script and prior CSS/app snapshot are in `.lab/redesign-qa/`; interaction rerun results in `.lab/curriculum-qa/`. Final CSS adjustment to data/permission views followed by targeted browser rerun. No publication beyond the authorised existing private Tailscale static preview; no credentials or live services. Changes remain local/uncommitted. Next: user reviews the new composition and runs the opening task at `http://100.97.81.120:8788/lab/#notes/try`.
## 2026-11-26 — Pi MCP consumer observation

- Learned: Pi 1.6.1 has native MCP; private Project Knowledge discovery/retrieval succeeded while a separate sciCORE profile had no MCP servers.
- Changed: added a bounded observation note covering provider/tool separation, denied restricted retrieval and credential boundaries.
- Evidence: live stdio `tools/list`, permitted `weavr` brief from `linuc`, and denied restricted `weavr2` brief; no sciCORE inference occurred.
- Practice source: live private Development Practice was not resolved in this task; project-local baseline and security-boundary rules were applied.
- Next: retain an actual tool-call receipt when the synthetic sciCORE credential/fixture acceptance is authorised.
