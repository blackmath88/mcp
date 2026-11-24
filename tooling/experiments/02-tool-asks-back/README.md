# The tool asks back

Question: what changes when software needs an answer before changing an object?

Run from repository root: `node tooling/experiments/02-tool-asks-back/run.mjs`. Requires installed `tooling` dependencies, no credentials. Optional first argument changes the results directory. Each case starts a disposable real stdio MCP server with one fictional room; no Teams or model provider is called.

Control: same room, destination and server logic. Variables: explicit protocol 2026-07-28 versus SDK legacy default (2025-11-25 observed), plus seven host/form conditions. Node assertions check destination, exact write count, preserved checklist, prompt count and outcome. The accepted case additionally asserts the differing wire mechanisms. Synthetic host answers are fixtures, not consent.

| Case | Result | Writes |
|---|---|---|
| Accept, confirm true | moved | 1 |
| Accept, confirm false | not-confirmed | 0 |
| Decline | decline | 0 |
| Cancel form | cancel | 0 |
| No capability | unsupported | 0 |
| Capability without handler | client-error (modern), tool-error (legacy) | 0 |
| Strict form schema | tool-error | 0 |

Observed in SDK client/server 2.4.0: modern calls carry version and capabilities per request, return `input_required`, then retry with `inputResponses`. Legacy negotiation initializes 2025-11-25 and sends reverse `elicitation/create`. The raw synthetic wire is retained in `lab/data/tool-asks-back.json`.

The strict schema deliberately exercises the observed error: `Elicitation requestedSchema contains unsupported JSON Schema constraint(s) after Standard Schema conversion: additionalProperties`. The working form uses the supported schema subset; accepted answers still receive strict local validation. Initial implementation mistakes (wrong capability field and malformed assertion) were corrected before the passing matrix; they are not protocol findings.

Limits: one SDK pair; no real interactive MCP host, authentication, concurrent edits, adversarial response test, or human learning evaluation. Cancellation here is a form answer, not interrupted transport. Exactly one observed write does not establish general retry idempotency. The page is a recorded replay, not live execution. Malformed accepted content and stale/replayed replies need further fixtures.

Sources: [2026 elicitation specification](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation) and installed SDK declarations. Research context: `docs/research/mcp-creative-practices.md`. Independent review: `docs/research/tool-asks-back-review.md`.
