# Research: visualising an MCP tool surface (summary of an external review)

Status: **research lead, not verified by this project.** The owner ran the prompt below through Perplexity on 2026-11-21 and pasted the answer. This file summarises it; the owner has the full text. Sources were not opened by this project. The answer itself labels claims as documented / observed / claimed; those labels are kept. Several sources are dated in 2026 and could not be checked here.

## What was asked

Whether board D of the architecture canvas (a fixed map: model, tool kinds, what sits behind the server; simulate a call) matches prior art, how capabilities are classified, what a model actually receives, what visualisation research applies, and where the picture could mislead.

## Findings that change the design

1. **Advertised is not received** (documented). Hosts filter, rename, group and defer tool definitions (Cursor dynamic context discovery, Jan 2026; Anthropic deferred tool search, Nov 2025; OpenAI `allowed_tools`). Show "server advertises" separately from "host exposes to the model now".
2. **The four MCP annotations are independent hints** (documented, MCP schema 2025-06-18): `readOnlyHint` (default false), `destructiveHint` (default true), `idempotentHint` (default false), `openWorldHint` (default true). Not guarantees; clients should not trust them from untrusted servers. They do not form one scale.
3. **Capability, permission and autonomy are different variables** (documented, OWASP LLM06:2025 Excessive Agency). A left-to-right "how much stays in your hands" axis mixes them.
4. **Definitions act before any call** (observed, Invariant Labs, Apr 2025: tool poisoning, cross-tool influence, rug pulls). A picture that only draws lines during execution misses this.
5. **Stable layouts help, a little and depending on the task** (documented, Archambault, Purchase and Pinaud 2011). Keep fixed landmarks, keep a static trace after animation, consider testing against a plain matrix.
6. **The boundary wording was too strong** (documented). Descriptions can mention files or services; what they do not give is a verified, complete effect graph.

## Other points kept for later

- Prior art splits into surface inspectors (MCP Inspector) and run inspectors (LangSmith, Langfuse, Phoenix; OpenTelemetry GenAI attributes such as `gen_ai.tool.definitions`). Langfuse's aggregated vs per-call graph modes match atlas vs replay.
- Annotations and output schemas reach the model on some surfaces only; no universal mapping found. Claude Code names tools `mcp__<server>__<tool>` in permissions. VS Code documents a 128-tools-per-request error. No portable "too many tools" threshold; vendor numbers only.
- Blur is ambiguous: absent, disabled, deferred and unknown need different marks (glyph research: Borgo et al. 2013).
- Data-flow diagrams with trust boundaries (Microsoft SDL) plus a sequence view; reader-paced animation (Hohman et al., Distill 2020); counterfactual "change one condition" exercises (Victor 2011, Case 2014).
- Show escaped text next to rendered descriptions; a Unicode TAG-block concealment preprint (Jul 2026) shows hidden metadata can reach a model while invisible to a person.
- "Lethal trifecta" (Willison, Jun 2025) is commentary: private data + untrusted content + a way out.

## Open questions the review could not answer

Whether a fixed atlas beats a matrix for learning; whether the ten families can be assigned reliably; whether people read danger into left-to-right order despite labels; whether a server's "shape" survives renaming and splitting of tools; exact field-level exposure per host, model and version.

## Selected sources (as given, not opened here)

- MCP schema 2025-06-18: https://modelcontextprotocol.io/specification/2025-06-18/schema
- MCP tools 2025-06-18: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- MCP Inspector: https://modelcontextprotocol.io/docs/2025-06-18/tools/inspector
- OWASP LLM06:2025: https://genai.owasp.org/llmrisk/llm062025-excessive-agency/
- Invariant Labs, tool poisoning: https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks
- Cursor, dynamic context discovery: https://cursor.com/blog/dynamic-context-discovery
- Anthropic, advanced tool use: https://www.anthropic.com/engineering/advanced-tool-use
- OpenAI, MCP servers in the Responses API: https://developers.openai.com/api/docs/guides/tools-connectors-mcp
- VS Code, tools and approval: https://code.visualstudio.com/docs/agents/run/tools
- Claude Code permissions: https://code.claude.com/docs/en/permissions
- Langfuse agent graphs: https://langfuse.com/docs/observability/features/agent-graphs
- Archambault, Purchase, Pinaud 2011: https://inria.hal.science/inria-00472423/document
- Borgo et al. 2013, glyph-based visualisation: https://vis.uib.no/wp-content/papercite-data/pdfs/Borgo13GlyphBased.pdf
- Hohman et al. 2020: https://distill.pub/2020/communicating-with-interactive-articles/
- Microsoft SDL secure design: https://www.microsoft.com/en-us/securityengineering/sdl/practices/secure-by-design
- Unicode TAG-block concealment preprint: https://arxiv.org/html/2607.05744v1
