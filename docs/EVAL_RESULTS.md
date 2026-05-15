# Eval results

Generated 2026-05-15T20:50:52.721Z by `npm run eval`.

**Mode: LIVE** — run against the live Linear and Anthropic APIs.

Server connectivity (`ping`): OK.

| Tool | Cases | Passed | Failed | Skipped | Pass rate |
| --- | --- | --- | --- | --- | --- |
| `triage_inbox` | 5 | 5 | 0 | 0 | 100% |
| `scope_issue` | 5 | 5 | 0 | 0 | 100% |
| `find_orphans` | 5 | 5 | 0 | 0 | 100% |
| `audit_velocity` | 5 | 3 | 2 | 0 | 60% |
| `compose_update` | 5 | 5 | 0 | 0 | 100% |
| `weekly_summary` | 5 | 5 | 0 | 0 | 100% |
| **Total** | 30 | 28 | 2 | 0 | **93%** |

Pass rate is computed over graded (non-skipped) cases.

## Failures

- **`audit_velocity` — diagnoses a real team's velocity**: returns a success result — expected success, got an error result: Error: Team "HEY" has only 0 cycle(s) with data — need at least 2 to assess velocity. | structured output matches the tool's schema — tool errored, no structured output: Error: Team "HEY" has only 0 cycle(s) with data — need at least 2 to assess velocity. | trend is a valid value — tool errored: Error: Team "HEY" has only 0 cycle(s) with data — need at least 2 to assess velocity.
- **`audit_velocity` — returns at least two cycles with scope data**: returns a success result — expected success, got an error result: Error: Team "HEY" has only 0 cycle(s) with data — need at least 2 to assess velocity. | has at least 2 cycles — tool errored: Error: Team "HEY" has only 0 cycle(s) with data — need at least 2 to assess velocity.

## Skipped

None.
