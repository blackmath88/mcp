# One room. A whole way of working.

A local, buildless scrollytelling explainer of the first MCP Lab experiment and the framework behind it.

Open `index.html` directly in a browser, or serve the repository and visit `/tooling/explainers/one-room/`. No install, external font, CDN, model call or backend is required. Keep the relative `tooling/docs/experiments/01-move-one-room/` evidence directory available.

## Narrative

One logical object is the continuity anchor: the Pilotphase room (`pilot`) and its selected checklist. Seven chapters follow the question, bounded mission roles, actual MCP execution path, preserved identity, layout failure, real images and evidence returning to a person.

The sticky workbench is progressive enhancement. Without JavaScript, every complete visual and paragraph remains inline, including all four real images. On mobile or with reduced motion, the scenes stay in the same document order instead of shrinking a desktop diagram. The before/after buttons only compare stored images; the page neither calls tools nor records human feedback.

## Reference and improvement

Inspired by [Scrollies explainers](https://github.com/blackmath88/scrollies/tree/3936182d01a9931be1402956e53919f0ebd369b9/explainers), inspected at revision `3936182d01a9931be1402956e53919f0ebd369b9`, especially `not-everything-is-an-agent` and `learn-in-missions`.

Transfer: one continuity object, a sticky visual stage on desktop, deliberate semantic steps and restrained technical typography. Improvements: authoritative inline DOM with full visuals without JS, responsive recomposition, keyboard comparison buttons, honest boundaries between animated explanation and executed software, and direct links to the real specimen evidence. Implementation is new; no library or source code was copied.

Source facts and images come from [the first experiment](../../docs/experiments/01-move-one-room/README.md). Personas/M365 attribution is retained on the page. Its original house-plus-Teams detail slide overflowed; displayed before/after views use the explicitly adapted compact profile. No live model execution or measured human-learning benefit is claimed.

## Files and checks

- `index.html`: semantic narrative, CSS/HTML diagrams, actual images and provenance links.
- `story.css`: visual system, sticky workbench, responsive/reduced-motion/print states.
- `story.js`: local scene relocation, scroll selection and image comparison only.

Builder checks: `node --check story.js`, HTML parsing, duplicate-ID check and all local href/src targets verified. Browser visual/interaction QA is owned by the lead agent and is not implied by these static checks.


## Lead review

Local Chromium 155 checks passed at 1440px desktop, 390px mobile, desktop reduced motion, and 390px with page JavaScript disabled. All seven scroll states selected the matching desktop visual; inline fallbacks retained every visual. Before/after controls, focusability, image loading and horizontal bounds passed (44 assertions total). Desktop tools/result and mobile screenshots were inspected. Lead fixed a stamp-arrow overlap and explicitly hid inactive no-JS controls. This is targeted QA, not a complete accessibility audit or evidence of human understanding.

Framework mission: `mission-8a670814-5a3d-47fd-a6c3-4ab7baa3f0f1`. A native Codex subagent built the page; the lead reviewed it. This mini-task did not use a Happier-managed execution. Source artifacts, QA results and advisory judgments are in the ignored local ledger. No publication or live inference was added.
