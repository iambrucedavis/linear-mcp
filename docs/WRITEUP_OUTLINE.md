# Writeup outline — raw material for the Day 11 portfolio piece

**This is a scaffold, not a draft.** Per the project rules, the writeup prose is
Bruce's — this file just gathers the argument structure, the facts, candidate
code snippets, and diagram specs so the blank page isn't blank. Target: 1500-2500
words at `iambrucedavis.com/projects/linear-mcp`. Pull from `LEARNING.md` for the
plain-English explanations; it already has ~15 entries in the right voice.

---

## Section 1 — Why a thoughtful Linear MCP is different from a thin wrapper

**The argument:**
- Most SaaS MCP servers are 1:1 wrappers — they expose every API endpoint and
  let the model figure it out. That treats the LLM as an RPC caller.
- This server exposes **six opinionated primitives** that match how a senior
  engineer actually runs an issue tracker — verbs like "triage my inbox" and
  "scope this issue," not `getIssues` / `updateIssue`.
- A primitive does the whole job: fetch the right data, apply judgment, return
  a structured, validated result. The model orchestrates *intent*, not REST.
- Opinionated also means **what's left out**: no `delete_issue`, no raw
  query tool. The tool surface is a security boundary (see Section 4).

**Facts to cite:**
- 6 tools, each with a zod-validated input AND output schema.
- Every tool returns `structuredContent` — machine-readable, not just prose.

**Candidate snippet:** the `ping` → real-tool contrast, or the `triage_inbox`
tool definition showing input + output schemas declared together.

---

## Section 2 — The six tools and why these six

**One line each (already in README / spec):**
1. `triage_inbox` — classify unread notifications by urgency.
2. `scope_issue` — break a fresh issue into subtasks / criteria / risks / effort.
3. `weekly_summary` — narrative summary of a team's activity.
4. `find_orphans` — surface stale / blocked / unassigned issues.
5. `compose_update` — draft a Slack/email update in the team's voice.
6. `audit_velocity` — diagnose velocity changes with reasoning.

**The deeper point — not every tool needs heavy LLM reasoning** (LEARNING Day 4):
- `find_orphans` is a *query* — Linear's filter engine finds the orphans; Haiku
  only writes one summary line per issue.
- `audit_velocity` is a query + a *thin* reasoning layer.
- `scope_issue` / the narrative tools are reasoning-first.
- The model is a scalpel, not a hammer.

**Per-tool model selection** (LEARNING Day 3, sets up Section via Day 10):
- Haiku: `triage_inbox`, `find_orphans` (cheap, high-volume, retrieval-shaped).
- Sonnet: `scope_issue`, `weekly_summary`, `compose_update`, `audit_velocity`
  (reasoning / writing quality is the product).
- Adaptive thinking on for the reasoning tools, off for classification.

**Candidate snippet:** `MODELS` constant + the comment block in
`src/lib/anthropic-client.ts`.

---

## Section 3 — The eval harness (the differentiator)

**The argument:**
- Most MCP servers ship with zero evaluation. You can't improve what you don't
  measure, and "it worked when I tried it" is not a quality bar.
- The harness defines ground-truth cases per tool: an input, the expected
  *shape* of the output, and "good enough" criteria.
- Runs under vitest against the live Linear + Anthropic stack; emits a
  pass/fail table per tool.

**Facts to cite** (fill in after Day 8 is built):
- N ground-truth cases per tool, 6 tools.
- The schema-contract tests that run with no API keys (Day 2-5 baseline): every
  tool has happy-path + error-path schema tests — 56 of them as of Day 6.
- Pass-rate table from `docs/EVAL_RESULTS.md` (generated Day 8).

**Candidate snippet:** one ground-truth case + the assertion helper.

---

## Section 4 — Security and threat model (the IAM/NHI angle)

**The argument — this is where Bruce's background shows:**
- **Authorization boundary:** the server authenticates with a Linear Personal
  API key. It therefore operates *exactly* within its owner's existing Linear
  permissions — the model gets no privilege escalation. (See decision note
  below re: PAT vs OAuth.)
- **Tool surface as a boundary:** no destructive tools exist. The model
  *cannot* delete or mutate — the worst case is a bad read. Omission is a
  security control.
- **Prompt injection:** issue titles / comments / voice samples are untrusted
  input written by many users. Defenses: system prompts mark content as
  data-only; untrusted content is fenced in tags; zod validates every input.
  (LEARNING Day 2.)
- **No hallucinated facts:** the model supplies judgment; code owns facts
  (URLs, IDs joined from the API response). A hallucinated link is structurally
  impossible. (LEARNING Day 2.)
- **Audit trail:** every tool call logs `{ tool, inputs, timestamp }` to stderr.
  Data-minimized — `compose_update` logs a voice-sample *count*, not contents.
  (LEARNING Days 5-6.)
- **Secrets:** keys live in a gitignored `.env`, never in code, never in logs.

**Where it extends in enterprise use:**
- OAuth with minimum-scope tokens for a hosted/multi-tenant deployment.
- Per-user audit log shipping to a SIEM.
- Rate limiting and per-tool authz policy.

**Candidate snippet:** the `getLinearClient()` JSDoc (states the boundary), or
the prompt-injection fence in a system prompt.

---

## Section 5 — What I'd do differently / V2

Pull from `FUTURE.md`. Honest limitations:
- PAT not OAuth (fine for a local server; a hosted one needs OAuth).
- `find_orphans` detects "blocked" via a label heuristic, not Linear relations.
- `triage_inbox` filters unread client-side after fetching `max_count`.
- No live integration tests in CI (needs secrets); eval harness is run manually.
- Single-user — no multi-tenant isolation.

---

## Diagrams (3, as the spec asks)

**Diagram A — Architecture**
```
  [ Claude Desktop / Claude Code ]      MCP client
            |  stdio (JSON-RPC)
            v
  [ linear-mcp server ]  ── 6 tools, zod-validated I/O
        |                \
        | GraphQL          \ Messages API
        v                   v
  [ Linear API ]       [ Anthropic API ]
```

**Diagram B — Auth / trust boundary**
- `.env` (gitignored) → `LINEAR_API_KEY` (PAT) + `ANTHROPIC_API_KEY`.
- PAT scopes the server to one user's Linear permissions — draw this as a box
  labelled "the server can do exactly what this user can do, nothing more."
- Anthropic key → Anthropic API only.

**Diagram C — One tool call (`triage_inbox`)**
```
  client → tools/call
    → zod validates input
    → Linear GraphQL: fetch notifications (1 query)
    → compact view built (URLs dropped — model never sees them)
    → Anthropic Haiku: classify (zodOutputFormat-constrained JSON)
    → join model verdicts onto real Linear data by notification_id
    → zod validates output
    → structuredContent returned
```

---

## Tone notes for Bruce
- First person. Plain English. One idea per sentence.
- No manifesto fragments, no slashes-as-style, no all-caps for vibe.
- The LEARNING.md entries are already written in roughly the right voice —
  they're the closest thing to a first draft of the explanations.
