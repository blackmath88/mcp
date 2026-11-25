# 14 · A tool that asks you

Status: simulated. Rung 2 of the ladder, "an interaction". Tools `list_carts` and `reserve_cart` (`src/domain/reach.ts`).

## What happens

`reserve_cart` takes no input from the model. In the build that asks, the lab's MCP server sends `elicitation/create` to the client in the middle of the call, the page shows the question, and the person's answer (or decline, or close) goes back to the server. Only then does the tool finish. In the build that guesses, the server picks the small cart itself and says so in its result.

## What is the lab's own and what is upstream

- The carts, the question and both builds are this lab's. No upstream server was read.
- Elicitation is a feature of the MCP protocol; the specification page was not read for this station.

## Evidence record

| Claim | Basis |
| --- | --- |
| The question travels as `elicitation/create` and its answer as the reply | observed: test in `src/adapters/in-tab-mcp.test.ts`; frames in Backstage |
| Arguments the model sends to `reserve_cart` are ignored | by construction in `src/adapters/lab-server.ts` |
| A path with nobody to ask fails instead of guessing | observed: test in `src/domain/reach.test.ts` |
| The tool list is identical in both builds | by construction: the build is not part of the listing |
