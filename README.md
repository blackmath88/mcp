# MCP Lab

An exploration lab for one question: when an AI gains access to a capability, what has it actually gained access to? See [CONCEPT.md](CONCEPT.md).

## What you will find

- **An atlas** of 30 tools on 14 simulated servers, each tool a pixel object in a fixed place. Three sentences for a first visit, and a shortcut to raw JSON-RPC for the curious.
- **A toolbench per server**: what it hands you (and what it does not), what those tools work on, what comes back, what stays changed. Use a tool, watch the engine events replay, set the host to ask you first and deny a write.
- **Under the hood** of every tool: the `tools/list` entry as received, the exact `tools/call` it would send, what Lens infers from the wording, and hidden-character checks.
- **Thirteen questions** from reading to inspecting the inspector, each with tools to try. Python runs in the tab for station 09; every `ledger.write` is a real tool call.

## Run the lab

Requires Node 24.12 or newer. Install the pinned versions from the lockfile.

```bash
npm ci
npm run dev -- --host 127.0.0.1
```

Open [the Atlas](http://127.0.0.1:5173/) and choose **Live workbench**, or open [the workbench directly](http://127.0.0.1:5173/live.html). The lab runs locally. The Registry exhibit makes a read-only request to the public MCP Registry.

| Specimen | Try it |
| --- | --- |
| Get Time | Discover tools, open the upstream view, then click **Get Server Time** inside it. Backstage shows the Apps messages and MCP stdio call separately. Use **Stop specimen** and click again to see the failed refresh. |
| Everything | Discover the reference inventory and run **Echo** with your own text. Select other discovered tools to inspect their metadata. |
| Permission slip | Run the synthetic bridge edit as viewer, then as editor. Read the role, enforcement decision and before/after revisions in the result. |
| Registry | Search published records and compare package identifiers with remote endpoint declarations. |

**MCP Lens** shows what the actual tool listing advertised, with the corresponding field beside each claim. Runtime results and Apps activity appear in Backstage. The original [simulated prototype](http://127.0.0.1:5173/lab/concept.html) and the Atlas’s recorded CLI/MCP exchange remain accessible.

The live workbench uses a local Node host and a second loopback origin for the Apps sandbox. Open the lab from a browser on the same machine using `127.0.0.1` or `localhost`. For a built local run, use `npm run build` and then `npm run preview -- --host 127.0.0.1`.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:infra-guard
python3 scripts/check.py
npx playwright install chromium
npm run test:browser
```

For an existing Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable. The browser suite uses real local specimen processes and a deterministic Registry failure response. Registry availability can be checked from its workbench exhibit.

## Atlas and command-line entrances

The same domain engine has three entrances:

```bash
npm run lab -- list
npm run lab -- connect_places --from forge --to dock            # CLI, succeeds
npm run lab -- connect_places --from forge --to dock --storm    # CLI, controlled failure, exit 1
npm run lab -- build_path --from mill --to archive --state .lab/world.json   # keep the world between runs
npm run lab -- fetch_page --url https://valley.test/notice --policy first-hop   # station 01, bent
npm run mcp:server   # MCP server over stdio, for any MCP client
npm run record       # rerun the real CLI and MCP exchange shown in the lab
```

Atlas execution modes:

- The browser runs a real MCP client and a real MCP server in the tab, joined by the SDK's in-memory transport. Every run is an actual `tools/call`; Backstage shows the frames. The data is made up and nothing crosses a network.
- The CLI and the MCP stdio server run the same engine. The MCP path is tested with the official SDK client over stdio.
- The "Recorded CLI + MCP" tab shows `src/recordings/entrances.json`, captured by `npm run record`. It is a recording, labelled as such.
- Atlas specimens use synthetic data. The Atlas toolbench can request a synthetic approval for writes.

The route of twelve specimens lives in [specimens/](specimens/README.md); its claims about upstream projects are unverified research leads.

The Atlas lives in `src/lab` and its shared engine in `src/domain`. The live workbench and its curated adapters live in `src/live`. Upstream Quickstart sources and licence are in [vendor/mcp-apps-quickstart](vendor/mcp-apps-quickstart/PROVENANCE.md). `npm run infra:deploy` is gated and was not run; nothing is deployed.

# Project foundation

Every project starts with a shared picture of the work and a small, explicit knowledge base.

**Use this template → Create a new repository**, then clone it and run:

```bash
python3 scripts/init_project.py --repository YOUR-OWNER/YOUR-REPO --title "Your project"
python3 scripts/check.py
git add .
git commit -m "Describe the project foundation"
git push
```

Fill in [CONCEPT.md](CONCEPT.md), [the plan](docs/PLAN.md) and [the next handoff](docs/HANDOFF.md). Start humans and agents at [START-HERE.md](START-HERE.md).

## Included from day one

| Part | What you get |
| --- | --- |
| Observatory | Workstreams, board, timeline, activity and evidence, using the pinned upstream Observstory implementation |
| Knowledge | Explicit selection of concepts, decisions, research, plan, questions and handoff with Git provenance |
| Working practice | Short AGENTS.md, issue/PR templates and bounded handoffs |
| Checks | Local structural checks, producer contract tests and artifact validation |
| Optional memory | An onboarding guide for the existing Knowledge Lab service; no model/API account required |

On pushes, PR changes, issue changes and branch creation/deletion, the **Observatory** workflow reads the default branch's selected knowledge and observes repository-wide activity within the upstream collector's configured limits. Download its `observstory` artifact from Actions and serve it:

```bash
python3 -m http.server --directory observstory 8000
```

Open http://localhost:8000/. The workspace needs HTTP; do not open it with `file://`.
`map.html` is the classic map and `knowledge.html` shows selected documents.
A fresh artifact timestamp does not imply complete collection: inspect its diagnostics and degraded coverage.

## Deliberate defaults

- Repository artifacts only. No Pages deployment, recurring schedule, model call or central ingestion.
- Knowledge audience starts as `private`. This is metadata, **not an access-control mechanism**; the repository's actual visibility controls access to committed files and artifacts.
- Workflow tokens are read-only; credentials are not persisted in checkouts.
- The template is framework-neutral. Add your application's own build, tests and licence.
- The template pins upstream code. New repositories do not automatically inherit future template changes.

See [setup and publication](docs/SETUP.md), [optional connected memory](docs/CONNECTED-MEMORY.md), [upstream review](docs/TEMPLATE-PROVENANCE.md) and [security boundaries](SECURITY.md).

## Work on the template itself

`python3 scripts/check.py` checks the current working files without dependencies.
The CI contract suite also uses the pinned Observstory checkout to build knowledge from a disposable Git repository, check missing-source failures, preserve commit identity and reject unselected content.

## Evolving Development Practice

Each substantive task can read the current [Development Practice](https://github.com/blackmath88/development-practice) baseline plus one relevant profile and optional method. Agents use their GitHub connection, or local sessions run `python3 scripts/practice.py --profile prototype --skill build` with existing `gh` access. The exact source revision and application are recorded in the task handoff. No template update is needed to read newer guidance.

See [the live-practice protocol](docs/DEVELOPMENT-PRACTICE.md). Source access is optional; private text is not copied into generated projects, and draft guidance never silently becomes approved project policy.
