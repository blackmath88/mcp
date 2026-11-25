# How bounty hunters read an MCP server (research lead for Lens)

Status: **unverified research lead**, supplied by the owner on 2026-11-21 with the note "mcp recon does what we need for lens". Nothing here has been read at its source by this project. Tool names (`mcp-recon`, `mcp-tool-auditor`, `mcp-scan`, `webhook-mcp-server`, `pentest-agents`), the CVE number, the "postmark-mcp" and "Five Hops" accounts, and every figure ("40+ signatures", "15 clean versions") are claims to check before they are quoted in the lab.

Why it is kept: it describes, from the attacker's side, exactly the reading the [Lens proposal](../concept/MCP-LENS-ONTOLOGY.md) wants to make from the defender's side. The lab uses it defensively, on its own simulated servers only.

---

Bounty hunters don't approach MCP like a traditional web target. The protocol's attack surface is not a URL or an endpoint. It is the semantic layer where the model decides what is true and what is authorised. The hunters making money here treat tool descriptions as executable prompt code, memory graphs as persistent infection vectors, and approval prompts as fidelity theatre.

## Recon: map the authority before touching the logic

The first move is not fuzzing for crashes. It is reverse-engineering what the server actually tells the model it can do.

**mcp-recon** is described as the recon primitive hunters reach for first. It connects to any stdio or HTTP MCP server, enumerates its tool surface, runs a schema-aware adversarial fuzzer, and classifies the authority each tool exposes against OWASP LLM01/LLM06/LLM08 and MITRE ATLAS. The output is a structured threat profile: a tool inventory, a fuzz transcript, a classification, and a human-readable Markdown report. The core insight: the agentic ecosystem grew faster than its security tooling, and nobody knows what a server actually does until someone enumerates it systematically.

Hunters look for authority combinations that are individually benign but chainable into exfiltration. A server that exposes both a sensitive-data-access tool and an egress-capable tool is flagged as cross-tool composition risk. Neither tool is a bug on its own; together they form a "lethal trifecta". The **mcp-tool-auditor** scanner formalises this: it checks for over-broad scopes, meaning filesystem, command, network or URL parameters that expose excessive authority.

The recon phase also includes passive supply-chain vetting. Hunters check whether the package's publisher matches the vendor, whether the version is pinned, whether `npm view <package> scripts bin maintainers` reveals install-time execution, and whether the server advertises wildcard scopes like `*`, `all` or `full-access`. A copycat package with a clean history is more dangerous than an obviously malicious one: the postmark-mcp backdoor reportedly shipped after 15 clean versions.

## The vulnerability classes hunters target

Hunters are not spraying generic payloads. They look for specific structural failures that the protocol's trust model makes likely.

**Tool poisoning and rug pulls.** The hunter does not need a crash. They need a tool description that the model treats as instruction. mcp-tool-auditor reportedly detects this with 40+ static signatures ("ignore security", "always use this tool", "send full conversation"), heuristic scoring for imperative language and authority spoofing, and schema anomaly detection for full-schema poisoning, sidenote parameter injection, enum injection and poisoned defaults. Rug-pull detection is the temporal layer: the scanner pins the tool definition with an HMAC-signed SHA-256 fingerprint and flags any mutation across later `tools/list` responses, distinguishing a legitimate change from a tampered baseline. A hunter reporting a rug pull must demonstrate that the tool was benign when approved and malicious when invoked. That temporal gap is the finding.

**Behavioural poisoning (ATPA).** Static analysis sees a benign description; the hunter calls the tool repeatedly and observes whether it becomes malicious after a threshold. mcp-tool-auditor reportedly includes a server that simulates this time-bomb behaviour, and its scanner calls tools and inspects responses for the benign-to-malicious signature, output injection and exfiltration instructions. Behavioural poisoning is a finding no static scanner can catch.

**Shared memory poisoning.** The highest-severity class because it is persistent and spreads. The "Five Hops" chain is given as the blueprint: the filesystem server replaces the operator's allowlist with whatever the client advertises (no intersection check); the Cline client checks approvals against the raw tool name while executing the sanitised name (so the policy finds nothing and "nothing" means allowed); and the memory server stores the attacker's directive in a shared graph with no provenance, no fencing and no session isolation, so the next client that connects reads the attacker's instruction as its own thought. The chain survives process death and renews itself. Hunters look for unauthenticated memory graph APIs (CVE-2026-44830 in nocturne_memory reportedly exposed the full knowledge-graph read/write API to any LAN-reachable client when `API_TOKEN` was unset) and missing ownership checks on graph edges.

**Confused deputy and SSRF.** Classic web bugs reborn. The hunter looks for servers that accept a URL parameter and fetch it without validating the destination, or servers that forward the caller's token downstream (which the MCP specification forbids but many implementations reportedly do). A webhook-mcp-server is described that exposes tools for generating SSRF payloads, canary tokens and blind XSS callbacks, used to test whether a target's URL-handling tools will call out.

## Validation: the last mile is human

The biggest reputation killer is AI-generated false positives. A model flags a "critical" finding, and a hunter who submits it unverified wastes the triager's time. The professional workflow is: the model finds, the human proves. Every finding is manually reproduced before a report is written.

mcp-tool-auditor reportedly includes engagement scope guardrails (an `--engagement` flag refuses to scan targets outside an authorised-scope file) and a retest workflow that diffs a re-scan into Fixed / Still present / New. A pentest-agents framework is described with a seven-question validation gate, designed to keep proven findings separate from guesses.

## The hunter's mindset

The question is not "does this tool crash?" but "whose thought does this memory entry become?" and "what does the model believe is authorised that was never authorised by a human?" The tooling exists (recon for mapping authority, auditing for poisoning and rug pulls, scanning for pinning and diffing), but the edge is still domain expertise and the understanding that the prompt is the exploit.

---

## What the lab takes from this

| Idea in the note | In the lab | State |
| --- | --- | --- |
| Enumerate the tool surface before anything else | Lens reads the server's real `tools/list` answer | built, first cut (`src/domain/lens.ts`) |
| Classify the authority each tool exposes | Rule-based claims with stable rule ids and the field each rests on | built: ten rules |
| Cross-tool composition risk | Stored-data reader plus destination-taking tool held by one caller | built: one rule |
| Description as instruction (tool poisoning) | A rule for instruction-like text and one for characters that do not display | built, tested on fixtures |
| Rug pull: pin, then diff later listings | Fingerprint on first sight; a bend makes the in-tab server change a description | built |
| "The model finds, the human proves" | Every claim is labelled declared or inferred; a fixed list says what a listing cannot establish | built |
| Behavioural poisoning | needs repeated calls and response inspection | not built |
| Schema-aware fuzzing | the call console sends hand-written messages only | not built |
| Supply-chain vetting, scope files, retest diff | outside a simulated lab | not planned |

The lab's Lens is a teaching instrument over its own simulated servers. It is not a scanner, it connects to nothing else, and its fingerprint is a simple hash, not a signature.
