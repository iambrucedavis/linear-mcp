# FUTURE.md — V2 ideas

Things deliberately out of scope for V1, parked here so they don't bloat the
build. V1 is six tools, an eval harness, a threat model, and a clean launch —
nothing more. Each item below is a real idea with a reason it waited.

## Auth

- **Linear OAuth with minimum-scope tokens.** V1 uses a Personal API key (PAT).
  A PAT is the correct, idiomatic auth for a *local, single-user* stdio MCP
  server, and it gives a clean authorization story (the server inherits exactly
  its owner's permissions). OAuth matters when the server becomes hosted and
  multi-tenant — then you want per-user, minimum-scope, revocable tokens.
  SECURITY.md documents OAuth as the enterprise extension rather than V1 doing
  a half-implementation.

## Tool depth

- **`find_orphans`: relation-based blocked detection.** V1 detects "blocked"
  via a label-name heuristic (`/block/i`). Linear also models explicit
  `blocks` / `blockedBy` issue relations — V2 should use those for precision.
- **`triage_inbox`: comment-body context.** V1 triages on issue title + type +
  state. Pulling the triggering comment's body would sharpen classification.
- **`triage_inbox`: server-side unread filter.** V1 fetches `max_count`
  notifications then filters unread client-side. A server-side `readAt` filter
  would make `max_count` mean "unread returned."
- **`weekly_summary`: explicit start/end date range.** V1 takes a rolling
  `days` window. An explicit date range would help for retrospectives.

## Platform

- **HTTP / streamable transport.** V1 is stdio-only — correct for Claude
  Desktop / Cursor / Claude Code. A remote, multi-tenant deployment would need
  the HTTP transport plus real auth.
- **npm package release.** V1 ships as a repo you clone and build. Publishing
  to npm is a packaging exercise worth doing once the API is stable.
- **CI integration tests.** V1's eval harness runs manually (it needs live API
  keys). A V2 could run it in CI against a dedicated Linear demo workspace with
  secrets in the CI vault.

## Observability

- **Audit log shipping.** V1 writes audit lines to stderr. A hosted version
  would ship them to a SIEM / log aggregator with per-user attribution.
- **Cost dashboard.** V1 reports per-call token usage in each tool's output and
  summarizes it in COST_ANALYSIS.md. A V2 could persist and chart it over time.
