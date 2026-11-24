# Prior labs → an MCP laboratory

Read-only source audit, 18 November 2026. This is a bounded first pass, not a fresh execution of either prior lab's measurements.

## Sources actually inspected

Both local checkouts were clean (`git status --short` returned no changes):

- XL LAB: `/home/nuc/projects/xl-lab`, revision `324fe21a54087ea0540f4eb6b647f05a8afd9d1b`.
- PDF LAB inside Open Presence: `/home/nuc/projects/baselhack26-open-presence/sideprojects/pdf-lab`, host revision `f61b470dd7574cfd9eb9ec6ba68325b1508ec559`.

Read their READMEs and run notes, XL's workbench README/design parity/consumer evidence adapter and unavailable-consumer record, PDF's poem generator and two-poem/transformation notebook. Also read this lab's `CONCEPT.md`, `tooling/docs/IMPLEMENTATION.md`, package manifest, and installed official MCP SDK 2.4.0 type declarations. The linked GitHub sources below are pinned to those inspected commits; no claim is made that either checkout is today's remote main.

## What was built: source evidence

**XL LAB is a workbench around real workbook bytes and competing interpretations.** Its seven synthetic specimens include a formula cellular automaton, hidden state, text becoming a formula, visible formatting disagreeing with stored values, an external relationship, and a deliberately ambiguous summary fixture. The application combines a cabinet, grid/formula inspector, package/relationship inspector, consumer comparison, recipe maker and evidence notebook. The browser's X01 rule/seed/generation controls write a new workbook, not merely a drawing. Parent/hash/recipe lineage accompanies the result. [Project](https://github.com/blackmath88/xl-lab/blob/324fe21a54087ea0540f4eb6b647f05a8afd9d1b/README.md), [workbench contract](https://github.com/blackmath88/xl-lab/blob/324fe21a54087ea0540f4eb6b647f05a8afd9d1b/workbench/README.md).

The consumer adapter does not repair missing observations into plausible answers. It distinguishes raw value, displayed value and its renderer, formula, cache and number format. A recorded result becomes `stale-input` if its exact input hash no longer matches the served file. Unavailable Excel/Copilot consumers remain explicitly unmeasured. This is implemented evidence handling, not just an aspiration in a README. [Adapter](https://github.com/blackmath88/xl-lab/blob/324fe21a54087ea0540f4eb6b647f05a8afd9d1b/workbench/src/adapters/consumerResults.ts), [unmeasured consumers](https://github.com/blackmath88/xl-lab/blob/324fe21a54087ea0540f4eb6b647f05a8afd9d1b/evidence/consumers/not-measured.json).

Recorded examples are informative precisely because they are narrow: the same CSV imported with one LibreOffice setting changed yields two formulas versus none; an external relationship names a URL but one recorded headless conversion never fetches it. Those findings concern the measured consumer/configuration, not universal Excel behavior. This audit did not rerun them.

**PDF LAB makes a strange artifact first, then gives the visitor instruments to interrogate it.** The running cabinet documents 27 PDFs across its families and paired-poem addition. Its material includes a maze drawn as one Type 3 glyph, a form/JavaScript toy machine, bounded repair mutations, a PDF/ZIP polyglot, incremental-history recovery, and print/view differences. Gallery controls link actual files and measured renderings; they do not claim that an HTML preview emulates an interactive PDF reader. [Running cabinet and limits](https://github.com/blackmath88/baselhack26-open-presence/blob/f61b470dd7574cfd9eb9ec6ba68325b1508ec559/sideprojects/pdf-lab/RUNNING.md).

The paired-poem generator separates drawn glyph programs from the `/ToUnicode` mapping. Two mappings can retain the same visible page while extractors return different poems. A browser writer lets the person author four alternate lines and download a real derivative. Source code supports this mechanism directly: the glyph streams use fixed visible lines, while the mapping stream is built from supplied lines. [Generator](https://github.com/blackmath88/baselhack26-open-presence/blob/f61b470dd7574cfd9eb9ec6ba68325b1508ec559/sideprojects/pdf-lab/poems.py), [controls and recorded measurements](https://github.com/blackmath88/baselhack26-open-presence/blob/f61b470dd7574cfd9eb9ec6ba68325b1508ec559/sideprojects/pdf-lab/TWO-POEMS.md).

The transformation notebook asks which reading survives object cloning, rewriting or rasterization. It retains commands, versions, input/output hashes, raw extracted strings and pixel differences. Its recorded Ghostscript recipe collapses two differently mapped inputs to identical output bytes; this is then minimized to one glyph with A, Z and SEA controls. It explicitly separates observed behavior from a source-code explanation and from untested native copy/paste or physical printing. [Notebook](https://github.com/blackmath88/baselhack26-open-presence/blob/f61b470dd7574cfd9eb9ec6ba68325b1508ec559/sideprojects/pdf-lab/TRANSFORMATION-NOTEBOOK.md).

**Correction to an earlier premise:** the inspected tools already create unusual PDF/Excel artifacts, but this audit did not establish implemented MCP servers in those labs. XL's environment plan explicitly describes the Agent/MCP path as a future adapter. A bounded source search found no implemented MCP exposure in the PDF lab. Personas is the existing MCP implementation established by our own first exhibit. [XL adapter plan](https://github.com/blackmath88/xl-lab/blob/324fe21a54087ea0540f4eb6b647f05a8afd9d1b/docs/environment-adapters.md).

## Method inferred from that evidence

1. **Let an artifact pose a question.** A poem that changes under extraction or a cell that displays a different number earns curiosity before the architecture is explained.
2. **Keep one object stable while changing one condition.** Same bytes, different consumer; same visible page, different mapping; same CSV, different import setting.
3. **Put readings beside their mechanism.** Show the picture, underlying structure, actual consumer output and control/configuration together.
4. **Allow a bounded creative mutation.** The visitor makes a new real specimen, with a recipe and parent lineage. A generated variant is not automatically a measured variant.
5. **Use failures to select the next experiment.** Reduce the surprising result, add discriminating controls, inspect the relevant source; do not average away differences.
6. **Separate observation, interpretation and acceptance.** Name the tested version, absent instruments and remaining uncertainty. A passing harness is not a human learning result.

This is an interpretation of the sources, not a claim that one universal framework has already been validated. XL's own [PDF design parity document](https://github.com/blackmath88/xl-lab/blob/324fe21a54087ea0540f4eb6b647f05a8afd9d1b/docs/pdf-lab-design-parity.md) supports deliberate transfer rather than copying every feature.

## What changes for MCP

The transferable unit is **specimen + instrument + controlled variation + evidence**, not the PDF or spreadsheet UI. MCP's specimen is a configured interaction: protocol version, advertised capabilities, tool/resource schemas, requests, responses, host behavior and resulting state. Its consumer is a particular client/host implementation and configuration. A transcript alone does not capture all runtime state; a tool-list screenshot does not establish what later calls will do.

The workbench should therefore display: what the host advertises, what is requested, what actually crosses the protocol boundary, what local software changes, and which observations were recorded. Do not import the misleading assumption that a static document's identity is sufficient to reproduce a live interaction. Capture negotiation and configuration alongside artifact hashes.

## Three proposed exhibits

### A. The tool asks a question — preferred next slice

- **Question:** what happens when software needs a person's answer before it can finish?
- **Baseline:** deterministic local MCP client with a supported elicitation/input-flow handler returning an explicit acceptance.
- **Variable:** accept, decline, cancel, or absent capability/handler; keep the tool request and synthetic project fixed.
- **Failure/control:** only accepted valid data permits a synthetic state change; refusal/cancellation/unavailable support must not silently become consent.
- **Evidence:** negotiated protocol, advertised capabilities, exact request/result sequence, state before/after, explicit outcome and errors. Stubbed answers are labeled scripted clients, not human observations.
- **Human action:** predict the result, choose a response policy, run the local probe, inspect what changed. No paid inference or new dependency is needed.
- **Current SDK caution:** installed 2.4.0 declarations say the legacy `server.elicitInput` API throws on the 2026-07-28 era and directs implementations to `inputRequired` multi-round-trip flows. Test the current path; do not copy older push-style examples unquestioningly.

### B. A toolbox changes while you are looking

- **Question:** is the toolbox fixed after the first discovery?
- **Baseline:** list a server with one synthetic safe operation, then call it.
- **Variable:** enable/disable a second registered tool; compare clients that refresh discovery versus retain an old list.
- **Failure/control:** discovery changes are not authorization grants. A cached tool name is not proof that a later invocation is supported; record actual rejection rather than inventing success.
- **Evidence:** exact tool inventories, relevant change/subscription signal, invocation results and timing; same session/configuration except the deliberate change.
- **Human action:** enable a capability, predict what each client knows, reveal the two views. This tests discovery within one server, not installation of arbitrary servers.
- **SDK support inspected:** registered tools expose `enable()`, `disable()` and `update()`; client `listChanged` handlers and server tool-list change APIs exist. Modern subscription versus legacy notification behavior needs an executed probe before claiming equivalence.

### C. Yesterday's proof, today's object

- **Question:** when is an image or successful check no longer evidence for the current project?
- **Baseline:** existing room-move project, render and satisfied checks.
- **Variable:** replace the project under its current revision while preserving old render bytes.
- **Failure/control:** stale concurrent write is rejected; a successful new write makes source-dependent results unverified. Historical evidence remains inspectable.
- **Evidence:** old/new revision and hash, render input references, stale-write response, before/after criterion status.
- **Human action:** make a small edit and decide which displayed claims should survive. This is partly implemented in core/tests; exposing it as an exhibit would reuse functioning code. It is chiefly an application-state lesson transported through MCP, not a protocol guarantee.

## SDK observation and scope

Installed `@modelcontextprotocol/client` and `server` are 2.4.0. Read local declarations `client/dist/client-BTIWJvaF.d.mts` (server-initiated handlers, capability checks, protocol-era notes) and `server/dist/mcp-BCJHyo7l.d.mts` (input flows, tool lifecycle). They mark sampling/roots deprecated as of 2026-07-28 (SEP-2577), and legacy elicitation calls as replaced by the current multi-round-trip input mechanism. Sampling should not be the foundation of a new architecture merely because it appeared in our earlier conversation. Parent separately verifies live primary specification status.

No consumer measurements, SDK probes, renders or security tests were executed during this audit. No prior-lab files changed. The strongest next move is A: it makes the human/software boundary tangible, exercises current protocol behavior, and can be implemented with synthetic deterministic clients before involving actual hosts or paid model calls.
