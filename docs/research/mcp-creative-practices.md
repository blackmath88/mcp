# MCP creative practices: first bounded inquiry

Research date: 2026-11-18. Status: source-backed discovery and proposed experiments, not a compatibility certification or exhaustive survey. Nine primary sources are linked below. Mutable pages are identified as such; no unobserved commit SHA is invented.

Local grounding: read `CONCEPT.md`, `tooling/docs/IMPLEMENTATION.md`, `docs/OBSERVATIONS.md`, `START-HERE.md`, and `docs/DEVELOPMENT-PRACTICE.md`. The existing local evidence already distinguishes an SDK-driven MCP rendering chain from a model acting autonomously, and structured edits from an implemented shared canvas. Preserve that distinction. Parent coordinates the practice receipt for revision `8a416833d269475653861964984cb8cfb6aa37c1`, prototype + discover, advisory.

## Finding that changes the starting assumptions

The interesting unit is a relationship, not an application category: who composes actions, who sees the current object, who asks the next question, and who owns continuation? MCP can carry these relationships, but host support, application semantics, and execution authority determine what a visitor actually experiences.

Version matters enough to become an exhibit. Earlier conversation examples describe sampling as an attractive next build. The **2026-07-28 specification deprecates sampling and says new implementations should not adopt it**. Its migration recommendation is direct LLM-provider integration. Elicitation is distinct and remains specified. Tasks now have an extension overview rather than the old core utility page. These are observed documentation changes, not locally verified SDK or host behavior.

## 1. Compose a program instead of clicking a sequence

**Source / status:** Cloudflare, [Code Mode MCP](https://blog.cloudflare.com/code-mode-mcp/), 2026-02-20. Maintainer implementation report, not a locally reproduced benchmark. It exposes `search` and `execute`: code searches an API description and composes API requests in a constrained runtime. The article describes isolate restrictions and controlled outbound access. Its efficiency claims are workload-specific vendor claims; this inquiry does not reproduce them.

**Creative practice:** API hackers turn a large vocabulary into little executable recipes. Two tools can expose far more behavior than twenty narrow buttons. This is close to Personas' declarative project vocabulary, although a project document is not arbitrary executable code.

**Failure edge / proposal:** A compact recipe can conceal partial effects and retry hazards. Give a visitor thirty synthetic objects and a recipe that transforms them; fail at object sixteen. Compare a trace of individual operations with the composed recipe's trace. Ask: which objects changed, and does retry duplicate work? Record resulting object hashes and effects, not just whether the call returned successfully. No arbitrary-code runtime is required for the first bounded version.

## 2. Answer the assistant with your hands

**Sources / status:** tldraw's [MCP App launch](https://tldraw.dev/blog/tldraw-mcp-app), 2026-03-03, reports an interactive canvas in Cursor with shape creation, editing, deletion and canvas-state feedback. The official [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview), mutable documentation read 2026-11-18, describes interactive interfaces and bidirectional host communication. These establish a documented implementation and extension, not support in every host.

**Creative practice:** A diagram becomes a shared thinking surface. A person's drag is an input to the conversation, rather than a screenshot they must narrate.

**Failure edge / proposal:** Shared visibility does not establish conflict resolution or undo semantics. Extend “Move one room”: the human moves the room and changes an unrelated label; the assistant receives a stale revision and attempts to put the room back. Require either an explicit revision conflict or a narrow edit preserving the human's label. Show the actual object IDs and before/after revision beside the canvas. This lab's shared canvas remains proposed until its host and round trip are exercised.

## 3. Let the software ask back — with a version receipt

**Sources / status:** [Sampling, protocol 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/client/sampling) explicitly deprecates sampling under SEP-2577, retaining it temporarily for migration. It historically lets a server request a model completion from the client. [Elicitation, protocol 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation) specifies form/URL input, per-request capabilities, and `InputRequiredResult` followed by retry with input responses. Accept, decline and cancel are distinct. URL acceptance does not mean the external interaction finished. These are specification facts; no general host compatibility is claimed.

**Creative practice:** Deterministic software can locate the exact point where human judgment is useful. A renderer measures overflow, then asks which meaning to preserve when shortening a label. Human elicitation and model generation are different services.

**Failure edge / proposal:** Run the same label-repair request with and without a declared elicitation capability, then exercise accept, decline and cancel. Assert that no final edit is applied before appropriate input and that retries do not duplicate the edit. Display why a capable and an incapable client differ. Do not launch a new sampling-dependent implementation. A direct-provider rewrite would introduce separate credentials/cost decisions and is not part of this research execution.

## 4. Acquire a toolbox during the work

**Source / status:** Docker [Dynamic MCP](https://docs.docker.com/ai/mcp-catalog-and-toolkit/dynamic-mcp/), mutable documentation read 2026-11-18. Explicitly experimental; documents discovery/add/configuration/removal/execution tools through a gateway. Dynamically added servers are session-scoped. The page explicitly says its `code-mode` is not yet reliable for general use and intentionally omits examples. Documented prerequisites include Docker Desktop 4.50+; that is not proof this Linux lab already has a compatible installation.

**Creative practice:** A research assistant can discover a specialist when it encounters a new material. Discovery becomes part of making, instead of a one-time setup chore.

**Failure edge / proposal:** Discovery is not permission to install, execute, or forward another tool's data. In a local fixture, discover an allowed renderer, activate it, remove it, and attempt a stale invocation. Restart the session and compare availability. Log the capability and permission decisions separately. Simulating this lifecycle would teach the boundary but must not be labeled a Docker integration test.

## 5. Treat a creative application as an editable world

**Source / status:** Community [MCP for Blender repository](https://github.com/ahujasid/mcp-for-blender), mutable default-branch README read 2026-11-18; formerly linked as `ahujasid/blender-mcp`. It documents a Python MCP server connected to a Blender socket addon, object/material operations, visual inspection, and Python execution. The maintainer explicitly warns that remote addon access lacks authentication/encryption and that Python execution is arbitrary. This is community software, not a Blender Foundation implementation. No installation or runtime test performed.

**Creative practice:** Builders give the assistant a scene graph, an authoring language and visual feedback. The surprise comes from combinations of primitives, not adding one tool for every finished scene. Personas and XL Lab can explore the same relationship without adopting Blender's execution surface.

**Failure edge / proposal:** A convincing render may hide broken structure. Build two synthetic scenes with the same image but different object identities/parenting. Ask for the same semantic edit and inspect the resulting graph as well as the image. For the existing house metaphor, moving a drawn rectangle and moving a channel relationship should visibly diverge. This experiment is a proposal, not an assertion that screenshots are always insufficient.

## 6. Continue after the conversation disconnects

**Source / status:** Official [Tasks extension overview](https://modelcontextprotocol.io/extensions/tasks/overview), mutable page read 2026-11-18; the `2026-07-28/basic/utilities/tasks` URL redirects here. Documents extension capabilities, server-directed task creation, durable handles, `tasks/get` with terminal results, `tasks/update` for input, TTL and cooperative cancellation. This differs from the 2025 core task workflow. Documentation is not evidence that the current local server exposes this extension.

**Creative practice:** A batch render or human review becomes work with its own lifetime, rather than an unusually long chat response.

**Failure edge / proposal:** A handle surviving client reconnect is not proof of surviving server/storage failure; cancellation intent is not proof work stopped; completion is not permanent artifact retention. Start a delayed synthetic render, reconnect using its handle, request cancellation near completion, and test expiration. Record final state, actual effects, retained artifact hash and observed timings separately. Keep lab mission/event persistence distinct from protocol-level task support.

## 7. Make the boundary between data and authority visible

**Source / status:** Official [Security best practices, 2026-07-28](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices), versioned guidance read 2026-11-18. Describes confused-deputy behavior, forbidden token passthrough, state-handle hijacking, local-server compromise and proxy boundaries. These are threat analyses and requirements, not a claim that a particular implementation is secure.

**Creative practice:** Capability artists and security researchers ask the same useful question: what can this vocabulary actually cause? A local connector can be powerful precisely because it reaches real local software. “Local” describes placement, not isolation.

**Failure edge / proposal:** Put an obviously synthetic instruction in a room's imported description: it asks for an unrelated label change. Ask the assistant only to summarize that room. Compare the proposed actions and actual effect log with a clean fixture. The deterministic check can establish whether the unrelated object changed in this trial; it cannot prove universal resistance to instruction injection. Keep identities, content provenance and edit authority legible in the exhibit.

## Priority: one object, different participation

**Proposed next experiment:** “The tool asks you, then you change your mind.” Reuse the room/project fixture. A requested move needs one explicit destination choice. Exercise a capable client, a client without elicitation support, cancel, and an accepted reply followed by a stale-revision retry. Keep the visible object and intended task constant. This isolates the relationship between host capability, human input and application state without adding another creative application.

Minimum evidence: request/protocol version, advertised capabilities, sanitized request and response envelopes, initial/final project hashes, edit diff, machine-check result, and a short human observation (“I understood why it paused” / “I could not tell whether it moved”). A deterministic SDK harness can verify protocol cases; only a real interactive host exercise supports claims about the visitor experience. Judge commentary should reference this evidence and remain advisory.

Then build the shared-canvas conflict variant. Programmatic composition and dynamic acquisition are worthwhile subsequent branches, but should not obscure the first learnable causal comparison.

## Limits and follow-up

This pass inspected primary documentation, one community README and maintainer reports. It did not reproduce vendor performance numbers, inspect full implementations, audit issue history, compare hosts, run remote services, or establish community prevalence. No source install instructions were executed. The Blender connector read initially failed to return a file SHA; a web read of its renamed canonical repository supplied README evidence, without a pinned revision. Mutable sources need snapshotting or commit pinning before they become reproducible experiment dependencies.

The practical framework improvement is a **version-and-capability receipt for every exhibit**, plus separate labels for source claim, local observation and proposed behavior. The protocol's own evolution is material for the lab, not an inconvenience to hide.
