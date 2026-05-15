# Eval results

Generated 2026-05-15T16:59:59.059Z by `npm run eval`.

**Mode: OFFLINE** — no API keys were configured. Only deterministic cases (input validation, error paths) ran; live-API cases are reported as skipped. Set `LINEAR_API_KEY` and `ANTHROPIC_API_KEY` (and `EVAL_TEAM_KEY` / `EVAL_ISSUE_ID`) in `.env` and re-run for a full report.

Server connectivity (`ping`): OK.

| Tool | Cases | Passed | Failed | Skipped | Pass rate |
| --- | --- | --- | --- | --- | --- |
| `triage_inbox` | 5 | 2 | 0 | 3 | 100% |
| `scope_issue` | 5 | 1 | 0 | 4 | 100% |
| `find_orphans` | 5 | 2 | 0 | 3 | 100% |
| `audit_velocity` | 5 | 2 | 0 | 3 | 100% |
| `compose_update` | 5 | 2 | 0 | 3 | 100% |
| `weekly_summary` | 5 | 2 | 0 | 3 | 100% |
| **Total** | 30 | 11 | 0 | 19 | **100%** |

Pass rate is computed over graded (non-skipped) cases.

## Failures

None.

## Skipped

- `triage_inbox` — default call returns a schema-valid triage list (requires LINEAR_API_KEY + ANTHROPIC_API_KEY)
- `triage_inbox` — respects a small max_count (requires LINEAR_API_KEY + ANTHROPIC_API_KEY)
- `triage_inbox` — every triaged item is well-formed (requires LINEAR_API_KEY + ANTHROPIC_API_KEY)
- `scope_issue` — errors cleanly on an unknown issue id (requires LINEAR_API_KEY + ANTHROPIC_API_KEY)
- `scope_issue` — scopes a real issue into subtasks (requires EVAL_ISSUE_ID)
- `scope_issue` — produces a usable effort estimate (requires EVAL_ISSUE_ID)
- `scope_issue` — echoes the real issue's identity (requires EVAL_ISSUE_ID)
- `find_orphans` — default scan returns a schema-valid list (requires LINEAR_API_KEY + ANTHROPIC_API_KEY)
- `find_orphans` — every orphan has reasons and a summary (requires LINEAR_API_KEY + ANTHROPIC_API_KEY)
- `find_orphans` — respects a small max_count (requires LINEAR_API_KEY + ANTHROPIC_API_KEY)
- `audit_velocity` — errors cleanly on an unknown team (requires LINEAR_API_KEY + ANTHROPIC_API_KEY)
- `audit_velocity` — diagnoses a real team's velocity (requires EVAL_TEAM_KEY)
- `audit_velocity` — returns at least two cycles with scope data (requires EVAL_TEAM_KEY)
- `compose_update` — drafts a Slack update from real activity (requires EVAL_TEAM_KEY)
- `compose_update` — honours the email format (requires EVAL_TEAM_KEY)
- `compose_update` — counts the voice samples it was given (requires EVAL_TEAM_KEY)
- `weekly_summary` — errors cleanly on an unknown team (requires LINEAR_API_KEY + ANTHROPIC_API_KEY)
- `weekly_summary` — summarizes a real team's activity (requires EVAL_TEAM_KEY)
- `weekly_summary` — by-the-numbers counts are non-negative (requires EVAL_TEAM_KEY)
