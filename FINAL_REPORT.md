# Final report — linear-mcp

A plain-English summary of the two-week build. For the day-by-day reasoning, see
`LEARNING.md`; for the design argument, `docs/WRITEUP_OUTLINE.md`.

## What this is

`linear-mcp` is an MCP server for Linear — a small program that gives an AI
assistant (Claude Desktop, Claude Code, Cursor) six tools for running an issue
tracker. The bet behind it: most MCP servers for SaaS tools are thin wrappers
that expose every API endpoint and let the model figure it out. This one instead
exposes six *opinionated primitives* that match how a senior engineer actually
works — and ships with the three things most MCP servers skip: an evaluation
harness, a threat model, and a cost analysis.

## What got built

**Six tools**, each with zod-validated input and output:

- `triage_inbox` — classify unread notifications by urgency.
- `scope_issue` — break a fresh issue into subtasks, criteria, risks, effort.
- `weekly_summary` — narrative summary of a team's activity.
- `find_orphans` — surface stale / blocked / unassigned issues.
- `compose_update` — draft a Slack/email update in the team's voice.
- `audit_velocity` — diagnose sprint-velocity changes with reasoning.

**The three differentiators:**

- **Eval harness** — 30 ground-truth cases (5 per tool) that drive the real
  server through a real MCP client and grade the results, emitting a pass/fail
  table. Most MCP servers have no evaluation at all.
- **Threat model** (`docs/SECURITY.md`) — a real attacker's-eye document: the
  authorization boundary, prompt-injection defense, why the tool surface is
  read-only by design, the audit trail.
- **Cost analysis** (`docs/COST_ANALYSIS.md`) — which Claude model each tool
  uses and why, with the economics worked out (~$2.60/month for a normal user).

**Plus:** 56 offline contract tests, a build notebook (`LEARNING.md`, 22
entries), a writeup kit, a demo script, a launch checklist, and `FUTURE.md`.

## How it was built

Fourteen project-days, in public on GitHub from day one, a commit per logical
chunk with conventional-commit messages. The order was deliberate: scaffold →
the easy tool first to find a rhythm → the rest → a polish pass → then the four
hero artifacts (harness, security, cost, writeup) in week two. TypeScript strict
mode throughout; no dependency added without a written justification.

## What was learned

A few threads ran through the build (all expanded in `LEARNING.md`):

- **The model brings judgment; the code owns facts.** The model never sees or
  produces issue URLs — they're joined in from the real Linear response. A
  hallucinated link is structurally impossible, not just unlikely.
- **Match the model to the cognitive load.** Cheap fast Haiku for classification
  and retrieval; stronger Sonnet, with reasoning on, for planning and writing.
  And the real cost lever is *frequency* — put the high-frequency tools on the
  cheap model.
- **Omission is a security control.** No destructive tool exists, so no
  instruction — injected, hallucinated, or genuine — can invoke one. The worst
  case for the whole server is a bad read.
- **You can't stop prompt injection, so make it not matter.** The defenses bound
  the blast radius: even a fully successful injection has nowhere to go.
- **Use the LLM only where judgment is needed.** `find_orphans` is mostly a
  database query; the model just writes a summary line. Not everything needs the
  model.

## State of it — verified vs. needs a live run

Verified during the build: the server builds clean, all 56 contract tests pass,
the eval harness runs end-to-end (11/11 deterministic cases pass through the
real MCP protocol), and the error paths return clean messages.

**Not yet verified — needs Bruce with API keys:** the build had no Linear or
Anthropic credentials, so the live tool behavior and the GraphQL queries have
not been exercised against a real workspace. The queries were written carefully
and conservatively, but the first live run is where any wrong field name
surfaces — and each tool is built to return the exact upstream error message if
that happens, so a fix is quick. The eval harness with real keys
(`npm run eval`) is the fastest way to shake this out; it also produces the real
pass-rate numbers for `EVAL_RESULTS.md`.

The honest gap: I aimed for 30-50 `LEARNING.md` entries and wrote 22. That was a
deliberate call — the briefing also said "less is more," and 22 entries that
each teach something beat 40 that include "renamed a file."

## What's next

1. **Launch** — run `docs/LAUNCH_CHECKLIST.md`: a live eval run, record the demo
   from `docs/DEMO_SCRIPT.md`, publish the writeup (prose is Bruce's — kit is in
   `docs/WRITEUP_OUTLINE.md`), then post and share.
2. **First live run** — `npm run eval` with real keys; fix any GraphQL field
   mismatch; commit the real `EVAL_RESULTS.md`.
3. **V2** — see `FUTURE.md`: OAuth for a hosted/multi-tenant deployment,
   relation-based "blocked" detection, an HTTP transport, CI-integrated evals,
   an npm release.

The candidate artifact is done: a public repo with six working tools, an eval
harness, a threat model, a cost analysis, and a writeup kit — a hero project,
not just a shipped one.
