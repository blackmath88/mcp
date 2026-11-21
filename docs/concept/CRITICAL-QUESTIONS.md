# Critical questions and counterarguments

Status: open critique and evaluation framework. No question is resolved merely by documenting it.

## 1. Are we teaching MCP or general software architecture?

Both appear in the narrative. The risk is attributing ordinary modularity, composition, or remote execution to MCP.

Response: every exhibit should identify what MCP standardizes, what the host decides, what application code implements, and what is a general systems concern. Include a non-MCP route to the same engine.

## 2. Does the metaphor overpromise discoverability?

An inventory may suggest automatic internet-wide discovery, trust, installation, compatibility, and permission. Those are distinct problems.

Response: separate finding a service, connecting, discovering capabilities, being authorized, and approving an action. Verify actual discovery mechanisms later.

## 3. Is a tool secretly an unrestricted terminal?

One narrow-looking slot can expose a programming language or a broad executor.

Response: show action-space size and effects, not just tool count. Compare narrow domain operations with arbitrary commands and code execution.

## 4. Are we building agents where algorithms suffice?

A dynamic agent can be more expensive and less predictable than a fixed process. A multi-agent graph may be mostly handoffs.

Response: preserve a deterministic baseline. Evaluate added intelligence against the same task and acceptance criteria. A smaller graph may be the better result.

## 5. Is delegation merely a prompt forwarded elsewhere?

A specialist must own a meaningful responsibility. A stronger model cannot repair an underspecified task automatically.

Response: inspect handoff inputs, evidence, constraints, acceptance conditions, and returned artifacts. Test missing context deliberately.

## 6. Does iteration actually improve anything?

Repeated model review can produce confident circular agreement or endless cosmetic changes.

Response: define success externally where possible, use deterministic checks for hard constraints, and distinguish preference from correctness. Require stopping rules and escalation.

## 7. Are local/remote claims misleading?

A local adapter may upload data. A remote service may be inside a controlled network. Model weights, inference, storage, and logs may have different locations.

Response: map the whole path. Configured topology is not proof of actual behavior. Avoid blanket privacy claims.

## 8. Is auth being described as solved?

The owner wants authority handled by solid infrastructure rather than prompts. That is a scope boundary, not a proof of implementation security.

Response: retain a minimal visible identity/effect layer. Do not expand into an identity platform, but do not hide broad credentials or unverified approval semantics.

## 9. What happens during retries and partial failure?

Successful message exchange does not prove exactly-once business effects. A retry can duplicate a write; a coordinator can lose track of a completed operation.

Response: test partial completion and inspect persistent outcomes. Define deduplication or recovery where needed rather than making protocol-level assumptions.

## 10. Can the visual system become deceptive?

Animated edges can imply actual traffic. A planned graph can look like an execution trace. A simulation can resemble a live integration.

Response: persistent labels for planned/executed, simulated/live, requested/completed, and proposed/applied. Provide a textual event record.

## 11. Will network visualisation overload the learner?

A realistic graph can be unreadable. The metaphor can become decorative clutter.

Response: progressive disclosure from one participant's inventory. Open one item, reveal its dependencies, then zoom out. Offer an outline/table alternative.

## 12. Are protocol details trustworthy?

The earlier conversation contains specific revision dates and claims about discovery, sampling, interaction direction, tasks, and extension maturity. These are not verified by this concept commit and may be inaccurate.

Response: recheck current primary sources, pin tested versions, and distinguish normative requirements from implementation behavior. Do not reproduce earlier claims as accepted facts.

## 13. Are provider examples stable enough?

Names can conceal official/community differences, client restrictions, subscriptions, account requirements, and changing tool surfaces.

Response: a later evidence register must record source, inspection date, exact capabilities, client support, credential requirements, documented versus executed status, and limitations.

## 14. Are we overbuilding?

The subject invites a universal gateway, agent runtime, observability platform, or workflow engine. Building those would displace the learning goal.

Response: choose one runnable synthetic slice. Borrow infrastructure when needed. Require an educational justification before adding a service.

## 15. What counts as success?

A successful demo is not sufficient evidence of learning, reliability, safety, or production readiness.

Response: ask learners to explain where a decision occurred, predict the result of a change, and diagnose a failure. Report evaluation observations without inventing numeric thresholds or generalizing from one run.

## Open product questions

- Who is the first audience and what do they already know?
- Facilitated session or self-guided exploration?
- Which synthetic domain carries the story best?
- Which chapters must work offline?
- What protocol detail is visible by default?
- What should be simulated initially?
- What runtime evidence is retained, and for how long?
- Which client capabilities are required versus optional?
- What is the smallest meaningful learner evaluation?
- Which real example contributes a new architectural lesson?
