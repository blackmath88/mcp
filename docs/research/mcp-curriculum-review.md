# Independent review: newcomer curriculum first slice

Date: 2026-11-18. Reviewer run: `run-bff4189f-0eb5-480e-a5f9-815dfec786fd`, native-codex. This review covers the research/design contract and the completed first source revision. It does not certify human understanding or live-service compatibility.

## Verdict

**Scoped pass for one introductory interactive model and seven source-backed previews, with keyboard-focus and source-link wording fixes requested.** The central notes interaction teaches the difference between obtaining external information and changing the source. It does not execute MCP, call Notion, or invoke a model. The application says so prominently; previews have no fabricated Run action or success trace. The user has not yet validated learning or the revised content.

The research and design agree on a task-first, IDE-based learning sequence. The selected examples cover recognizable retrieval/writes, browser operation, structured design, shared canvas, composed execution and dynamic tooling. These are not claims about a global adoption ranking. One playable example is an intentionally bounded first delivery; the seven previews do not satisfy a future requirement for seven executable exhibits.

## Evidence and checks actually performed

Read the two curriculum research/design reports, `tooling/docs/EXHIBIT-REVIEW.md`, and the completed `lab/` application, catalog, state module, tests, HTML, CSS and README.

Independently checked these primary sources on the review date:
- [Notion MCP overview](https://developers.notion.com/guides/mcp/overview): supports the chosen workspace search and page-edit use case. The fixture is not claimed to reproduce official tool names or authorization behavior.
- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp): confirms the maintained integration and repository-interest presentation. No live browser-server integration was tested by this reviewer.
- [Docker Dynamic MCP](https://docs.docker.com/ai/mcp-catalog-and-toolkit/dynamic-mcp/): supports experimental discovery/add/remove and session-scoped tooling. Discovery is not execution authority.

The remaining catalog links and claims were inspected against the research report, not independently re-audited or executed. Repository-star figures in the research were not independently reproduced and are correctly excluded from learner popularity rankings.

Executed independently:
- `node --test lab/notes.test.mjs`: **5 passed, 0 failed**, exit 0.
- `node --check lab/app.js`: exit 0.
- Separate direct state probes across no-access, read-only and editable cases: original data unchanged by retrieval, only editable case adds an item, repeated add remains one item, scenario change clears only the explicitly fresh simulated context, previous read remains a snapshot after writing, underlying edits survive scenario change, fresh reset is isolated. All passed.

Browser interaction, screenshot and viewport verification belong to the coordinator's separate QA evidence. This reviewer did not perform browser QA and does not report those results as independently observed.

## Findings

1. **Execution truth: pass.** Mode badge, task copy, evidence view and event provenance explicitly identify a scripted interactive model. Seven previews state they are not implemented. No Teams/room/Personas artifact is linked or fetched by the new learner UI. Historical files remain outside the active curriculum.
2. **Actors and guarantees: pass.** Connection explanation places model and client inside the host and labels MCP as communication. Permission scenarios and duplicate avoidance are identified as lab choices, not protocol guarantees. Other primitives are acknowledged without pretending this slice teaches them all.
3. **Access and knowledge boundary: pass.** Initial no-access produces no retrieved state or change. A scenario switch explicitly starts a new simulated context; inspector copy explains that actual revocation would not erase already retrieved data. The current application and read snapshot are independently represented.
4. **Core transitions: pass.** Read-only rejection preserves source; editable add changes one item; repeated add avoids duplication as a stated fixture behavior. Reset creates clean independent state. The central Comparison view distinguishes original, retrieved and current content.
5. **Keyboard focus: fix requested.** At the reviewed revision, note-list selection, reflection choices and inspector-section switching rebuild the activated buttons without restoring focus. That can drop focus to the body. In the inspector drawer, losing focus also defeats the trap's first/last-element logic. Add stable identifiers or restore the activated control after these updates, then verify with real keyboard events. Do not claim a complete keyboard pass from source inspection.
6. **Source-reference wording: fix requested.** “View retrieved source” highlights the current application note, which can differ from the preserved read snapshot after an edit. Rename it to “Open source note (current)” or explicitly display the captured snapshot. Current copy elsewhere explains the distinction, but the action should not contradict that teaching.
7. **Scope limits, not blockers.** Optional step-through is absent; immediate scripted runs with an inspectable timeline remain legitimate. No live host, full accessibility audit, external account authorization or human-learning evaluation is demonstrated. Mutable source capabilities should be rechecked before implementing previews as real connections.

## Reviewed source identity

SHA-256 of files at this review's completed source inspection:

| File | SHA-256 |
| --- | --- |
| `lab/app.js` | `a6cd600f0ace720b79e64a13b7ed6e66bb61d37ddbddc4e1d89d2182308528e2` |
| `lab/notes.mjs` | `a1e8139510b080203034f6b04881d4e662fa9e8f0d0d06d1da4e61a44e69144e` |
| `lab/catalog.mjs` | `5cab412ba4b3ef1ff5c3086d453bee2f7c3833e99194a7b5245ee94d06c5dc16` |
| `lab/index.html` | `5eb085bb4561664f25bb76b11fae2ec53485fb54f89392cd9199b88ff806e988` |
| `lab/style.css` | `06c8b05dd36514e7f36ddbf6ae70cbee39cc6aff98e5bfcfee7cb67c609287cd` |
| `lab/notes.test.mjs` | `d590480ae5a36315a44ad8470fb8b759fec241ec5327a8afd292cb12c2356970` |

Later fixes need their own verification receipt. This review's source hashes must not be presented as covering uninspected revisions.

## Follow-up: requested fixes verified

Final targeted source review: `lab/app.js` SHA-256 **`c4e544aedd492a8310693fe94f143547e7e1c39e8d9d5fb5d039bbc17e7c7279`**. Other reviewed file hashes above are unchanged. The source reference now says “Show source note”; the comparison and answer continue to distinguish the earlier read snapshot from current content. Note, reflection, inspector-section, timeline and tab controls restore focus after replacement. The drawer trap also recaptures focus if it is outside the active pane. `node --check lab/app.js` passed after the changes.

The coordinator supplied browser evidence, which this reviewer read but did not independently execute: `.lab/curriculum-qa/keyboard-results.json` contains **15/15 passing checks**, including source highlighting, focus retention, Back/Forward, tab arrows, mobile drawer focus/trapping and Escape restoration. The coordinator separately reports 45 passing functional/viewport checks. These are coordinator verification, distinct from the reviewer’s independently executed five state tests.

Initial coordinator keyboard harness attempts failed. The coordinator identified incomplete CDP Enter event metadata and an invalid unquoted numeric CSS attribute selector, corrected the harness and reran it successfully. Earlier outputs are preserved; those failed harness assertions are not accepted as evidence of application defects or silently counted as passing runs. The final evaluator now reports runtime exceptions rather than converting them into an unexplained false check.

**Final assessment: scoped pass for the bounded first slice after the two requested fixes.** No unresolved blocking issue was found within this review’s scope. Full accessibility, real MCP execution, external-service compatibility, implementation of the seven previews, and actual human learning remain unverified or out of scope.
