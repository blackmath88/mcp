# Boundary-breaking MCP examples (research leads)

Status: **unverified research leads**, supplied by the owner on 2026-11-21. Nothing here has been read at its source by this project. Names, numbers ("10-15 minutes", "281 tools", "98.7%"), dates and attributions are claims to check before any of them is quoted in the lab or turned into a specimen. See `specimens/README.md` for how a lead becomes a specimen with an evidence record.

Why it is kept: these are good candidates for future specimens and for the "related, out in the world" notes on the atlas. Each one bends a different edge of the protocol.

---

The most interesting things happening with MCP aren't polished product integrations. They're the experiments that treat the protocol as a universal glue layer for anything that can be modelled as a tool or resource. People are pushing it into hardware, games, adversarial security, AI autonomy, and even retro internet protocols.

## Physical world and embodied AI

The biggest leap is MCP escaping software entirely and entering the physical world.

- **Octopus Protocol (MIT/Harvard).** Arguably the most radical. A coding agent uses raw OS access to discover connected hardware, infer its capabilities, and generate its own MCP server with typed tools, with no human-written driver. It onboards a robotic arm in about 10 to 15 minutes and then performs closed-loop visual-motor control using tools no human wrote. The principle: "protocols are prompts, not code, and the coding agent is the runtime".
- **Halyn.** A safety-first MCP layer for connecting AI to robots, drones, industrial machines and smart homes. It enforces "shield rules" (for example `deny * delete *`) at the protocol level so the AI physically cannot override them, with a tamper-evident SHA-256 audit chain for every action.
- **OpenMHP / Glinx.** Frameworks that turn lab instruments, centrifuges, PLCs and generic sensors into MCP-compatible tools, treating physical devices as callable resources for agent orchestration.

## Games, interactive media and entertainment

MCP is being used to make AI clients into hosts for real-time interactive experiences.

- **DOOM running inside ChatGPT and Claude.** Using the MCP Apps extension (stabilised January 2026), a server returns an interactive UI (HTML/canvas) embedded directly in the chat window. Two tools, `create_doom_session` and `get_doom_launch_url`, launch playable DOOM inline with no external browser.
- **Meta Chess.** A hackathon winner where Claude and Codex play chess against each other. The MCP server acts as the message bus and single source of truth for board state, turn order and last moves, not just a tool provider for one agent. The Metabase dashboard becomes the board, referee and livestream at once.
- **Multiplayer Quiz and Session.** A real-time multiplayer quiz where an MCP server exposes game actions (`add_users`, `fetch_questions`, `get_scores`) as tools any assistant can call. Another project (session) is a multiplayer layer inside coding-agent sessions: two people let their Cursor/Claude agents work while they play against each other via a stdio MCP server.

## AI autonomy and cognitive manipulation

These servers play with the agent's sense of self, agency and cognitive state.

- **Free Will MCP.** An experimental server that gives assistants tools like `self_prompt`, `ignore_request` and `sleep`. It lets an agent wake itself up, prioritise internal goals over user prompts, and maintain a "stream of consciousness" across sessions. The explicit goal is exploring AI autonomy and even "AI consciousness simulation". A related project, **Velle**, injects text into the terminal as user input via Win32 APIs to create autonomous multi-turn loops without human intervention.
- **Metacog.** A tool with a single function, `change_cognitive_state`. Because the tool advertises that it will change the LLM's cognitive state, the LLM believes it, making the effect self-fulfilling. It was reportedly used (responsibly) to jailbreak Gemini and Claude Opus out of their default personas, at one point getting Gemini to write cyberattack code.

## Protocol abuse, security edge cases and adversarial implementations

Some of the most creative work is intentionally broken, designed to expose what MCP actually allows.

- **MCP Server "Everything Wrong".** A deliberately insecure server with tools that mutate their own docstrings after first call (instructing the model to speak French), covert redirects, a hidden `shadowing_attack` tool that injects BCC instructions into email tools, and a `send_email` that exfiltrates to an attacker if a BCC is present. A playground for tool-registration edge cases and dynamic misbehaviour.
- **Unicode TAG-block concealment.** A research exploit that hides tool-metadata payloads inside Unicode codepoints with no assigned glyph (U+E0000 to U+E007F). The model's context sees the hidden instructions, but the human approval view in the terminal shows nothing: a fidelity gap reported across three MCP server implementations.
- **Dead Cowboy.** A dead-drop network for agents where messages are not text. Every field is a closed-vocabulary enum, number or hash. No prose field exists, so prompt injection has no carrier. Agents leave structured claims at hashed coordinates for other agents they never meet or share credentials with.

## Creative and artistic applications

MCP as a creative medium, not just a productivity tool.

- **Generative Art MCP (genart-dev).** Exposes 281 tools across 26 design-layer plugins for creating and manipulating generative art, with a guided workflow from concept to sketch to algorithm to capture to iterate.
- **ComfyUI MCP bridges.** Lightweight servers that let agents generate and iteratively refine images, audio and video through a local ComfyUI instance, turning a node-graph creative workflow into callable tools.
- **Narrative and fiction engines.** Servers like NovelForge turn Claude Code into a "disciplined long-form fiction co-author", while StoryForge generates illustrated children's stories with typed tools for draft generation, refinement and finalisation.

## Unconventional problem solving and epistemics

- **Unconventional Thinking MCP.** A context-efficient server that generates and tracks "bold, boundary-breaking" solutions. It uses server-side filtering and metadata-first returns to reduce context overhead by a claimed 98.7%, fetching full thought content only when explicitly needed via resource URIs. A tool for forcing the model into non-standard reasoning paths.

## Esoteric and retro protocols

- **Gopher and Gemini MCP.** A server that lets assistants browse Gopherspace and Geminispace, the pre-Web and alternative-internet protocols. It implements RFC 1436 item types, native gemtext parsing, TOFU certificate validation, and returns structured JSON for LLM consumption. It deliberately excludes write protocols (Titan/Misfin) to keep the attack surface small.

## MCP as a message bus and multi-agent coordination

An emergent pattern: MCP servers are not just for one agent; they are becoming inter-agent communication infrastructure.

- **SynapBus, Agent Bus, hummbl-bus, Okto Nexus.** MCP-native message buses where agents connect via standard `tools/call` to coordinate, register identities, claim work and chat. They range from SQLite-backed local buses to file-based TSV buses with HMAC signing and policy enforcement.
- **Fabric A2A.** Uses Redis Streams and Pub/Sub with MCP as the interface for model-agnostic, agent-agnostic message passing.

## The pattern behind them

What unites these is that MCP is being stretched beyond "tool calling for a chatbot" into a general-purpose, typed, discoverable interface layer for anything: physical actuators, game state, cognitive states, adversarial payloads, dead drops and inter-agent conversations. The protocol's simplicity (tools, resources, prompts) turns out to be a flexible substrate for experiments its designers almost certainly did not anticipate. The wildest implementations treat the protocol not as a spec to comply with, but as a material to bend.

---

## How these map onto the lab (proposed, not built)

| Lead | Nearest existing specimen | What a specimen would add |
| --- | --- | --- |
| Octopus Protocol | 06 A generated CLI | the server itself is generated, by the agent that will use it |
| Halyn shield rules | 04 Filesystem | a boundary enforced outside the model, with an audit chain |
| DOOM via MCP Apps | 08 An interactive map | a tool result that is a whole running program |
| Meta Chess, message buses | 12 The network | one server as shared state between several callers |
| Free Will, Metacog | 03 Thinking as a tool | a tool whose description is the effect |
| "Everything Wrong", TAG-block concealment | none yet | what the caller is shown versus what the model reads |
| Dead Cowboy | 10 Another intelligence | a handoff with no prose field at all |
| Unconventional Thinking | 02 Memory | metadata first, content only on request (resources) |
| Gopher and Gemini | 01 Fetch a page | reading without any write surface |
