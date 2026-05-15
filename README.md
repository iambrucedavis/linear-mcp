# linear-mcp

![license](https://img.shields.io/badge/license-MIT-blue)
![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.29-blueviolet)
![node](https://img.shields.io/badge/node-%E2%89%A520-green)
![tests](https://img.shields.io/badge/tests-56%20passing-brightgreen)
![eval cases](https://img.shields.io/badge/eval%20harness-30%20cases-brightgreen)

An opinionated [MCP](https://modelcontextprotocol.io) server for Linear. Six
tools that match how a senior engineer runs an issue tracker — not CRUD
wrappers, but primitives that produce structured output, ship with an
evaluation harness, and come with a real security model.

<!-- DEMO: replace this line with the demo gif / Loom embed after recording. -->

## Why this exists

Most MCP servers for SaaS tools are thin wrappers around the underlying API —
they expose every endpoint and let the model figure it out. That treats the LLM
as an RPC caller.

This one tries something different: six opinionated primitives that match real
workflows ("triage my inbox," "scope this issue"), each with zod-validated input
*and* output, a structured result, and a documented security boundary. It also
ships the three things most MCP servers skip — an **eval harness**, a **threat
model**, and an honest **cost analysis**.

Full writeup: `iambrucedavis.com/projects/linear-mcp` ·
Threat model: [`docs/SECURITY.md`](./docs/SECURITY.md) ·
Cost analysis: [`docs/COST_ANALYSIS.md`](./docs/COST_ANALYSIS.md)

## The six tools

| Tool | What it does |
| --- | --- |
| `triage_inbox` | Classify unread Linear notifications by urgency, summarize each, suggest a triage action. |
| `scope_issue` | Break a fresh issue into subtasks, acceptance criteria, risks, and an effort estimate. |
| `weekly_summary` | Write a narrative summary of a team's activity over a date range. |
| `find_orphans` | Surface stale, blocked, or unassigned issues, each with a one-line summary. |
| `compose_update` | Draft a Slack or email status update in the team's voice (pass `voice_samples`). |
| `audit_velocity` | Diagnose a team's sprint-velocity trend with reasoning, not just metrics. |

All six are **read-and-reason only** — there is no destructive tool by design
(see the threat model).

## Who it's for

Anyone who runs work in Linear and uses an MCP client (Claude Desktop, Claude
Code, Cursor) — engineering leads, PMs, and ICs who want to drive Linear by
intent instead of clicking through the UI.

## Requirements

- Node.js ≥ 20 (built and tested on 25)
- A Linear account + a Personal API key
- An Anthropic API key

## Install

```bash
git clone https://github.com/iambrucedavis/linear-mcp.git
cd linear-mcp
npm install
npm run build
```

## Configure

Copy the example env file and fill in both keys:

```bash
cp .env.example .env
```

```bash
# .env  (gitignored — never commit real keys)
LINEAR_API_KEY=lin_api_...      # Linear → Settings → Security & access → Personal API keys
ANTHROPIC_API_KEY=sk-ant-...    # https://console.anthropic.com/ → API Keys
```

The server loads `.env` automatically on startup (resolved relative to the
built file, so the working directory doesn't matter).

## Connect it to a client

**Claude Code** (one command):

```bash
claude mcp add --scope user linear-mcp -- node /absolute/path/to/linear-mcp/dist/index.js
```

Verify with `claude mcp list` — you should see `linear-mcp` connected.

**Claude Desktop** — add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "linear-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/linear-mcp/dist/index.js"]
    }
  }
}
```

Then fully restart Claude Desktop.

## Example usage

Once connected, talk to your MCP client in plain language — it picks the tool:

- *"Triage my Linear inbox."* → `triage_inbox`
- *"Scope issue BD-142 for me."* → `scope_issue`
- *"What's slipped through the cracks on the Backend team?"* → `find_orphans`
- *"Has the Backend team's velocity changed lately?"* → `audit_velocity`
- *"Draft a Slack update for the Backend team's last two weeks."* → `compose_update`
- *"Write a weekly summary for the Backend team."* → `weekly_summary`

## Development

```bash
npm run build      # compile TypeScript to dist/
npm run dev        # run the server from source (tsx)
npm test           # 56 offline contract tests (vitest) — no API keys needed
npm run eval       # live eval harness — 30 cases → docs/EVAL_RESULTS.md
npm run typecheck  # tsc --noEmit
```

The eval harness needs API keys in `.env`; some cases also need `EVAL_TEAM_KEY`
and `EVAL_ISSUE_ID` to point at real workspace data. Without keys it still runs
every deterministic case and reports the rest as skipped.

## Project layout

```
src/
  index.ts          MCP server entry point — loads .env, registers tools
  tools/            one file per tool (triage-inbox.ts, scope-issue.ts, …)
  lib/              config, Linear/Anthropic clients, audit log, helpers
tests/
  *.test.ts         offline schema-contract tests (vitest)
  evals/            the live eval harness
docs/
  SECURITY.md       threat model
  COST_ANALYSIS.md  per-tool model selection + cost
LEARNING.md         build notebook — a plain-English entry per decision
FUTURE.md           V2 ideas, deliberately out of V1 scope
```

## License

MIT — see [LICENSE](./LICENSE).
