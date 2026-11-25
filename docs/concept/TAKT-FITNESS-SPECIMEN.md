# TAKT Fitness — a real-world MCP workshop specimen

2026-11-25 · Owner-requested use-case note. Status: design proposal; not an implemented fitness integration or runtime-verified specimen. Primary contract: [TAKT Fitness Workshop](https://github.com/blackmath88/takt/blob/main/docs/FITNESS-WORKSHOP.md), [implementation tracker](https://github.com/blackmath88/takt/issues/6).

## Learning value

A person starts a workout conversationally, reads past actual results, receives a proposed session, reports sets by voice/text or optional dynamically generated chat UI, and resumes in another conversation. One inventory exposes a specialised workshop, not a generic database. The caller model coaches; the human trains; the domain implementation validates and persists. The same domain operation can be used through MCP, CLI, or optional app/UI.

Apply [Lens ontology](MCP-LENS-ONTOLOGY.md) and [architecture](ARCHITECTURE.md): read/query/act/remember; discover equipment; trace interface versus engine; interact with optional generated UI; compose a session; consult; iterate across human-performed workouts; resume durable state; connect workshops (BUFF, TAKT, selected Knowledge Lab). These are candidate learning steps, not a risk ranking or proof of support.

## Distinct surfaces and evidence

Host-generated rich chat UI is not inherently an MCP App. It may render structured state, collect inputs and explicitly submit a new user message or supported action. A native MCP App is an optional different adapter requiring host verification. Plain text has equal domain capability. Persistence comes from ledger/session state, not transport or browser controls. A rendered checkbox is not proof a set was saved, and a saved lift is not independent proof a person physically lifted it.

Proposed trace: actual user entry → host selection → typed tool args → authorization/validation → domain mutation → receipt/revision → fresh read → representation. Capture synthetic/redacted traces only. Classify declared tools, source-inspected behavior, and actual runtime observations independently. No live testing or protocol/host support claimed.

## Smallest specimen

Synthetic athlete and workouts, a read-only progress query and a bounded write, persistent session ID/revision, optional generated view and plain text alternative. Perform the same entry through both; compare domain state, test identical retry and stale version. In a fresh client resume session. Separately test work-only and fitness-only principals: hidden inventory is not authorization; backend must deny cross-scope calls. No real personal fitness data or credentials in MCP Lab. Do not execute tests against live services on the strength of this note.

The next step is TAKT implementation and evidence, then add a recorded or live specimen to the lab with explicit execution mode.