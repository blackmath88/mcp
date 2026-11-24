# Lab factory tooling

The reusable orchestration workbench inside MCP Lab. It coordinates a research-and-making loop: inspect a medium, build something surprising, test where it breaks, show the evidence, and let the person choose the next question.

- [Concept and boundaries](docs/CONCEPT.md)
- [How we built it and what changed during review](docs/IMPLEMENTATION.md)
- [Visual scroll story: One room](explainers/one-room/index.html)
- [Walk through the first experiment](docs/experiments/01-move-one-room/README.md)
- [Reusable skill](skills/lab-factory/SKILL.md)

## Run from the repository root

```sh
npm --prefix tooling ci --ignore-scripts
npm --prefix tooling test
node tooling/src/cli.mjs list
node tooling/src/cli.mjs report MISSION_ID .lab/report.html
node tooling/scripts/install-local.mjs /path/to/msteams-personas
```

Node 24+ is required; tested with Node 26. The installer configures this repository's Codex MCP entry and refuses to replace an existing entry. On linuc the existing entry has already been migrated to `tooling/src/server.mjs`. A fresh host session may be needed to load it. The repository skill discovery path `.agents/skills/lab-factory` links to the canonical skill here.

```sh
LAB_COMPACT_VIEW=1 PERSONAS_ROOT=/home/nuc/projects/msteams-personas npm --prefix tooling run pilot
```

The pilot creates a new mission and renders four images. Omitting LAB_COMPACT_VIEW exercises the original layout failure at the inspected Personas revision. Reproducing it requires the separate Personas checkout, its dependencies and Chromium. Ordinary tests use disposable data and do not require that checkout.

## Layout

| Path | Purpose |
| --- | --- |
| `src/` | Shared store, MCP server, CLI, reports, Personas adapter |
| `test/` | Persistence, revisions, MCP protocol, judgments and rendering failure checks |
| `scripts/` | Local installation and real end-to-end pilot |
| `skills/` | Reusable lead-agent workflow |
| `docs/` | Concept, build account and inspectable experiment evidence |

Runtime data remains in the repository root `.lab/`, ignored by Git. Moving the tools does not move or recreate existing missions. The default is independent of the shell's working directory; LAB_HOME can select another store. Only the deliberately selected fictional exhibit data and images under docs are repository content.

This package adds no unattended worker scheduler and no new inference service. Happier dispatch uses the existing account; observed token and monetary usage remain unknown. Local consistency checks are not authentication between mutually untrusted agents.

## Learning-workbench delivery

For newcomer exhibits, use the [exhibit review rubric](docs/EXHIBIT-REVIEW.md). Assign a researcher and learning designer before coding; require an actual task, visible consequence, meaningful failure and truthful execution mode. Give one builder ownership of application integration and use a separate reviewer. Evaluate source accuracy, functionality, usability and human learning separately. Start with one complete teaching interaction before expanding its pattern across a catalog.

Native workers are the current default; Happier-managed execution remains available when explicitly requested. The store records either runtime accurately but does not launch or authenticate workers. Examples in the original pilot documentation are historical tooling evidence, not mandatory content for new subjects.
