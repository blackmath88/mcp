# MCP Lab

An exploration lab for one question: when an AI gains access to a capability, what has it actually gained access to? See [CONCEPT.md](CONCEPT.md).

## Run the first slice

Requires Node 22.18 or newer. No cloud account, API key or model is needed.

```bash
npm install
npm run dev          # the lab at http://localhost:5173
npm test             # domain, state, UI, CLI and MCP integration tests
npm run typecheck && npm run lint && npm run build
```

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

What is real and what is not:

- The browser runs the engine in process. Its Backstage events are emitted by that execution. It makes no MCP connection.
- The CLI and the MCP stdio server run the same engine. The MCP path is tested with the official SDK client over stdio.
- The "Recorded CLI + MCP" tab shows `src/recordings/entrances.json`, captured by `npm run record`. It is a recording, labelled as such.
- There is no model, no approval step and no remote service anywhere in this slice.

The route of twelve specimens lives in [specimens/](specimens/README.md); its claims about upstream projects are unverified research leads.

Layout: `src/domain` (engine, no DOM or transport), `src/adapters` (in-process, CLI, MCP), `src/lab` (Foldkit model, update, view), `lab/concept.html` (the earlier prototype, kept as reference). `npm run infra:deploy` is gated and was not run; nothing is deployed.

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
