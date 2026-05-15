# linear-mcp

An opinionated MCP server for Linear. Six tools that match how a senior engineer runs an issue tracker — not CRUD wrappers, but primitives that produce structured output, have an evaluation harness, and ship with a real security model.

> Status: **in active build**. Day 6 of 14 — all six tools built and registering; eval harness, threat model, cost analysis, and full docs land in Week 2.

## The six tools

1. **`triage_inbox`** — Classify unread Linear notifications by urgency, summarize each, suggest a triage action.
2. **`scope_issue`** — Break a fresh issue into subtasks, acceptance criteria, risks, effort estimate.
3. **`weekly_summary`** — Narrative summary of team activity over a date range.
4. **`find_orphans`** — Surface stale, blocked, or unassigned issues.
5. **`compose_update`** — Draft a Slack/email status update in the team's voice.
6. **`audit_velocity`** — Diagnose sprint velocity changes with reasoning, not metrics.

## Why this exists

Most MCP servers for SaaS tools are thin wrappers around the underlying REST/GraphQL API. They expose every endpoint and let the model figure it out. That's not what good design looks like.

This one tries something different — opinionated primitives that match real workflows, with an evaluation harness so quality is measurable and a security model that takes the IAM/NHI surface seriously.

More: see [`LEARNING.md`](./LEARNING.md), [`docs/SECURITY.md`](./docs/SECURITY.md) (coming Day 9), and [`docs/COST_ANALYSIS.md`](./docs/COST_ANALYSIS.md) (coming Day 10).

## Install & run

> Setup instructions land Day 12. For now: clone, `npm install`, `npm run build`, point Claude Desktop at `dist/index.js`.

## License

MIT
