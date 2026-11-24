# Handoff

## Landing page redesign — 24 November 2026

Owner feedback: the first version looked generic ("like every page Claude has done") and used a serif font. Rebuilt the landing page from the workbench's own interface: dark topbar, explorer as a scroll-spy table of contents, sage working surface with sticky toolbar crumb, inspector holding the live `tools/list` stage and an activity log of what crossed the wire, and the status bar. The "What's MCP?" diagram reuses the lab's connection-diagram language with a replayable request. The hero shows a real screenshot of the workbench (`site/img/workbench.jpg`, captured from `lab/` at this commit; refresh it when the lab UI changes). Fonts: Inter + JetBrains Mono (self-hosted, OFL); Fraunces and Plex Mono removed. Applied the ui-ux-pro-max skill for structure (product-demo hero, 150–300 ms micro-motion, exit faster than enter, 44 px targets, reduced motion); its suggested slate/indigo "Modern Dark" palette was rejected in favour of the lab's palette. Checked in headless Chromium at 1440, 1024 and 390 px: no console errors, no horizontal overflow, stage reaches step 08.

## Public landing page — 24 November 2026

Learned: the owner wants to publish on Cloudflare without hosting an MCP service, with a premium landing page explaining what MCP is and the hook "MCP is just a list of tools; who decides what a tool is?". Motion reference: Wardic on Foldkit (staggered entrances, layout/FLIP, presence exits, sliding tab ink, reduced-motion toggle).

Decided: the owner chose plain static for now; Foldkit/Effect remains the planned application stack and is not implemented. The landing page can be ported later.

Changed: added `site/` (landing page, self-hosted OFL fonts with licences, favicon, `_headers`) and `scripts/build-site.sh`, which copies only lab runtime files into `dist/` (ignored). Sections: what this is and why; what MCP is; the hook; an eight-step sticky escalation stage (list, choice, read/write hints, list_changed, elicitation, MCP Apps ui://, code mode, tool poisoning); who decides; exhibit list with filters linking into `lab/#id`.

Evidence: headless Chromium at 1440px and 390px, and with reduced motion. No console errors, no horizontal overflow, correct stage state at steps 2/4/5/8, exhibit deep link opens the right lab view. Foundation check and 12 lab tests pass. `_headers`/CSP not exercised (local server ignores it); verify after the first Cloudflare deploy. No human-learning evaluation.

Practice: development-practice source not resolved in this session (repository outside GitHub scope); local AGENTS.md followed. Limitation disclosed.

Next: first Cloudflare Pages deploy and header check; decide whether to add a public source link and a LICENSE; fix or retire `lab/concept.html` (missing charset, overstates exhibit status).

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
