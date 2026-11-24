# Independent review: Tool asks back

Reviewer run: `run-85ae2f05-084f-450d-b75c-1f41b6fec22b` (`native-codex`). Review scope: source inspection and independent execution of the existing synthetic stdio matrix. No model call, real Teams operation, human interaction study, or external host compatibility test.

## Verdict

**Pass for the bounded experiment:** all 14 existing cases independently reproduced, with the expected state and response outcomes. The experiment demonstrates two materially different MCP exchanges producing the same synthetic application decision. This is sufficient for an exhibit about declared capability, implemented handling, and submitted form answers. It is not evidence of authenticated permission, general host compatibility, or human learning.

## Evidence inspected and executed

- [Server](../../tooling/experiments/02-tool-asks-back/server.mjs), SHA-256 `100f657d2cfdac0effa1472c7bbc6eb7bfc4df6a2db08ce21858e0383f23e575`.
- [Runner](../../tooling/experiments/02-tool-asks-back/run.mjs), SHA-256 `0ef26acc757d2998c0e20e798fef3a83ecbcbf9d4470a07e5d4a29a91e510fdc`.
- Original `.lab/tool-asks-back/results.json`, including actual request/response traces.
- Executed `node tooling/experiments/02-tool-asks-back/run.mjs .lab/tool-asks-back-review` from repository root. Exit status **0**. Independent result timestamp `2026-11-18T14:06:08.534Z`; Node `v26.12.0`; recorded client/server SDK `2.4.0`.
- Independent `.lab/tool-asks-back-review/results.json` SHA-256 `6f10faf8b448da9ec74aa61571d2314c1e72fc860adf7d48ebf7f11e2e6f0603`. This ignored local evidence is not automatically available in a fresh checkout.

## Observations

Each protocol configuration runs seven cases in a fresh server process. The runner asserts room parent, write count, retained file association, prompt count, and expected status/error category.

| Case | Pinned 2026-07-28 | Default legacy | Writes in either |
| --- | --- | --- | --- |
| Unsupported capability | unsupported | unsupported | 0 |
| Accept, confirm=true | moved | moved | 1 |
| Accept, confirm=false | not-confirmed | not-confirmed | 0 |
| Decline | decline | decline | 0 |
| Cancel answer | cancel | cancel | 0 |
| Declared capability, no handler | client-error | tool-error | 0 |
| Strict form schema | tool-error | tool-error | 0 |

Observed wire behavior:

1. **Modern is explicitly pinned**, not negotiated through an initialize handshake. The first wire request is `tools/call` carrying protocol version and client capabilities in `_meta`. The server returns `resultType: input_required` with an elicitation request. The SDK executes the synthetic local answer handler, then sends a second `tools/call` with `inputResponses.move`. The final response is `resultType: complete`.
2. **Default legacy actually negotiates 2025-11-25** through `initialize`, followed by `notifications/initialized`. During the pending tool call, the server sends `elicitation/create`; the client responds to that request ID. The SDK adapts the same server handler to this exchange.
3. Missing handler produces modern `CAPABILITY_NOT_SUPPORTED` locally after receiving `input_required`. Legacy sends JSON-RPC `-32601 Method not found` back to the server, whose final tool result contains `isError: true`.
4. The strict Zod form fails before any host decision: `Elicitation requestedSchema contains unsupported JSON Schema constraint(s) after Standard Schema conversion: additionalProperties`. This is observed schema-conversion rejection in this SDK pair. It does not prove that all JSON Schema constraints or all strict validation are unsupported: the server still uses strict validation for accepted content.
5. All unchanged cases retain `onboarding` and zero writes. Both accepted-true cases end at `campus` with one write. Every case retains `['pilot-checklist']`.

## Important coverage limits and follow-up proposals

- **Wire assertions:** the reviewed runner records but does not assert negotiated version, handshake presence, request direction, or continuation shape. A future SDK could alter these while those tests pass. After this finding, the parent reported adding structural assertions for both acceptance traces and starting another run. That subsequent revision is outside the hashes and independent rerun above; use its own execution evidence to assess the fix.
- **Invalid content:** no case submits missing, wrongly typed, or extra accepted fields. The `invalid-response` branch is not tested. Add these before claiming comprehensive schema validation coverage.
- **Consent and replay:** the server trusts syntactically valid client-provided accepted content; it does not authenticate a person, bind a response to a nonce or revision, or require an earlier prompt in server state. Synthetic answer handling is correctly labeled. Direct supplied answers, replay and concurrent edits remain untested; these matter before connecting a real consequential action.
- **Cancellation:** the tested `cancel` is an elicitation answer. It does not test aborting the request, killing the host, timeout during input, or transport loss. No lifecycle robustness claim follows.
- **Capability breadth:** only absent elicitation and explicit `elicitation.form` are exercised. URL-only capability and legacy empty elicitation object branches are not checked.
- **Experimental isolation:** the strict-schema case also has no host handler, but the observed schema-conversion error establishes that schema rejection occurs first. Providing a handler in that case would isolate this variable more cleanly.
- **Evidence durability:** SDK version strings are hard-coded in runner output, and source hashes are absent from its evidence bundle. Record installed versions and source hashes automatically before treating results as durable provenance. The reviewer hashes above bind this review to the inspected source.
- **Failure reporting:** a failed acceptance case writes debug data to the default evidence directory even when another output directory is requested; an assertion failure prevents the final result bundle. Neither affected this successful rerun. An incremental failure record would improve future diagnosis.

The next useful human action is to predict the missing-handler outcome, inspect both traces, then explain why declaring a capability did not provide an implementation. Whether that teaches the distinction remains a human review question, not a result of these automated checks.
