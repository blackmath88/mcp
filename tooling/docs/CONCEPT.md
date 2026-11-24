# Concept: a factory for inquiry

## The idea

The user's PDF and Excel labs suggested a reusable way of learning: make an artifact, inspect what different tools can see or do with it, change a condition, and make the surprising result visible. The medium is a research object. Its communities, unofficial uses, creative practices and changing boundaries matter alongside its formal specification.

The factory supports this method for MCP first. A person can name a subject, but the next step is still inquiry: what object can we inspect, what question is worth testing, and what exhibit would let someone discover the answer? It is not yet a universal automatic lab generator.

## The loop

Question → source research → bounded experiment → artifact and evidence → independent challenge → human interpretation → next question.

The human decides what matters and contributes observations. The lead agent coordinates. Scouts gather source-backed evidence; builders make one exhibit; reviewers challenge its claims. Roles are bounded assignments, not permanent personalities or separate services.

## Why both a skill and MCP?

The skill describes how to investigate and coordinate. The MCP server supplies callable operations and persistent shared state: missions, worker records, immutable artifact revisions, checks and judgments. The host supplies model execution and tool permissions. Existing software modules perform their specialist work.

For this implementation, Happier launches Codex workers, the local Lab MCP stores evidence, and the Personas MCP validates and renders projects. MCP is a protocol boundary; connecting a renderer does not itself create an autonomous agent or shared editor.

## What the evidence means

A worker finishing is not proof that its output is correct. Deterministic checks establish bounded properties, such as a precise diff or matching hash. A reviewer can interpret evidence, but its verdict remains advisory. Human learning requires the person's participation; the system leaves it unverified rather than guessing.

Named artifact replacement requires the previous revision. Derived outputs record their inputs. When those inputs change, earlier verdicts cease to establish the current result. Failures remain visible and can motivate the next experiment.

## Future possibilities — proposals

Additional adapters for existing PDF/Excel tools; experiments with sampling or dynamic tool discovery; shared canvases with explicit revision state; undo that preserves unrelated human edits; comparisons of a screenshot-only assistant with one given structured operations. Each needs its own implementation and evidence. None is implied by the first successful move.
