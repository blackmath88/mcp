# Pi as MCP consumer with sciCORE inference

Status: consumer path verified; sciCORE inference configured but blocked on credential.

Pi 1.6.1 provides native stdio/HTTP MCP, deferred exposure through `tool_search`, codemode exposure and CLI allow/deny controls. Provider selection is independent: `models.json` configures the OpenAI-compatible sciCORE endpoint, while `mcp.json` configures tools. MCP does not grant authority; the process OS permissions, project trust and tool selection remain the enforcement points.

Observed on `bruh`:

- private profile connected to the existing Project Knowledge stdio launcher and discovered eight tools;
- a permitted `weavr` brief returned source references from authoritative `linuc`;
- restricted `weavr2` retrieval was denied;
- private launcher excludes the write-capable `capture` tool;
- sciCORE profile had no MCP servers and private could not discover the sciCORE model.

The later synthetic sciCORE fixture must use a disposable Knowledge Lab root and a unique project scope. Do not treat an ordinary model text response as proof of tool calling: retain the MCP tool-call/result receipt. Provider credentials must remain local Keychain references and must never appear in MCP arguments, Happier messages or transcripts.
