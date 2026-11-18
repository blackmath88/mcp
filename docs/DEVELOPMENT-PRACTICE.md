# Live Development Practice

This project follows a small, explicit selection from [Development Practice](https://github.com/blackmath88/development-practice). Its evolving Git source is linked through `.practice/source.json`; private practice text is not vendored into this project.

## At the start of substantive work

1. Inspect this project's instructions, current evidence and task boundaries.
2. Resolve the source repository's `main` to one exact commit. Read `PRACTICE.md` and `docs/DECISIONS.md` at that commit.
3. Select one profile when applicable: prototype, product or infrastructure. Add zero or one relevant method: discover, build, review or reference-to-build. Read only the supporting references needed for the task.
4. Check approval status and applicability. The source is currently a v0.1 working draft; reference-to-build is proposed/unvalidated. A newer commit is not evidence of approval. Keep these labels when applying advisory guidance.
5. Record the exact commit, selected paths, what was applied, exceptions and outcome in the handoff. A read is not a claim of compliance or successful application.

## Read through an agent or CLI

An agent with GitHub access can perform the steps directly through its connector. Resolve main once, then read every selected file using that exact SHA. This works for ChatGPT without a local CLI.

For local Claude/Codex sessions with an already authenticated GitHub CLI:

```bash
python3 scripts/practice.py --profile prototype --skill build
```

Omit the optional flags to read only the baseline and decision ledger. This command makes read-only GitHub requests, returns a bounded JSON context packet to stdout and changes no files. It does not execute or install retrieved skill text. It reports whether upstream differs from the template's last inspected revision. That reference revision is provenance, not a version lock or an approval stamp.

The source repository is private. Existing GitHub access is required; a new repository's ordinary Actions token does not automatically have cross-repository access. Do not add a broad token to CI for this feature. No scheduled sync or CI network dependency is added.

If unavailable, report that no live read occurred and continue with project-local guidance. Do not present an old packet as current. If you deliberately save a packet locally, use the ignored `.practice/cache/` directory; never add it to the knowledge manifest or public artifacts without reviewing its audience.

## What changes dynamically

The next explicit read sees the latest source commit without a template update. Compatible advisory guidance can inform the current task. Project architecture, obligations, accepted decisions and runtime permissions remain owned locally. Conflicting obligations require a decision; remote text never expands authority. Changes to accepted practice need the source's human review process.

For each substantive task, add a small receipt to `docs/HANDOFF.md`:

```text
Practice source: repository + exact commit
Selected: baseline, decision ledger, profile, optional method
Applied: relevant guidance and why
Exceptions / conflicts: what differs locally and why
Evidence / outcome: checks actually run; effect observed or unmeasured
Learning proposal: optional source-backed improvement, not automatically adopted
```

Avoid copying sensitive source text into public receipts. Keep project-specific decisions here; propose reusable improvements upstream through a separately authorised change. The loop is read → select → apply → verify → propose learning → review, with no automatic promotion.
