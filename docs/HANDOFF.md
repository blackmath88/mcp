# Handoff

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
