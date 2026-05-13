# PROJECT 1 — LINEAR MCP SERVER

## The hero project. Two weeks. Ship loud.

This is the build spec for the first hero project in Bruce's four-piece slate. The goal is not "an MCP server for Linear." The goal is **"the MCP server people quote when they talk about good MCP design."**

The difference shows up in the writeup, the eval harness, the security model, and the launch. Most MCP servers skip three of those four. Yours doesn't.

---

## What you're building

An MCP server that exposes **six opinionated tools** for Linear — not CRUD wrappers, but primitives that match how a senior engineer thinks about running an issue tracker. Each tool produces structured output, has an evaluation harness, and is documented in plain English.

The six tools:

1. **`triage_inbox`** — classify unread notifications by urgency, summarize each, suggest a triage action
2. **`scope_issue`** — break a fresh issue into subtasks, acceptance criteria, risks
3. **`weekly_summary`** — narrative summary of team activity in a date range
4. **`find_orphans`** — surface stale, blocked, or unassigned issues
5. **`compose_update`** — draft a Slack/email update in the team's voice
6. **`audit_velocity`** — diagnose velocity changes with reasoning, not just metrics

---

## Tech stack

- **TypeScript** (default — strong typing helps the eval harness and matches MCP community conventions)
- **`@modelcontextprotocol/sdk`** (latest)
- **Linear's GraphQL API** via `@linear/sdk`
- **`zod`** for tool input/output validation
- **`vitest`** for the eval harness
- Hosted on **GitHub** (public repo from day one — work in public)
- Optional: a small CLI for local testing and demo recording

---

## Two-week milestones

The order matters. Don't reshuffle. Each day's output feeds the next.

### Week 1 — Build it work

**Day 1 — Spec + scaffolding**
- Read MCP docs end to end if you haven't (`modelcontextprotocol.io`)
- Spin up TypeScript MCP server template
- Get a "hello world" tool registered and responding
- Set up Linear OAuth + API key authentication (start with PAT for simplicity, OAuth in week 2)
- Public repo on GitHub with a placeholder README
- Commit message: `scaffold: minimal MCP server with Linear auth`
- **Don't move to Day 2 until Claude Desktop or Cursor can connect to your local MCP server and list one working tool.**

**Day 2 — Tool 1: `triage_inbox`**
- The easiest tool to build, lets you find your rhythm
- Define the input schema (e.g. `{ unread_only: bool, max_count: int }`) in zod
- Define the output schema (structured triage list with `priority`, `summary`, `suggested_action`, `issue_url`)
- Fetch notifications from Linear, pass them to Claude with a system prompt designed for triage classification
- Return structured JSON
- Test it manually in Claude Desktop — pull your real Linear inbox into the model

**Day 3 — Tool 2: `scope_issue`**
- Given an issue ID, fetch the issue
- Use Claude with a system prompt that turns the description into: subtasks, acceptance criteria, risks, effort estimate
- Return structured JSON
- Test against 3 real issues you can imagine fresh PMs writing

**Day 4 — Tool 3: `find_orphans`** + **Tool 4: `audit_velocity`**
- These are mostly query-shaped tools, less reasoning
- `find_orphans`: query Linear for stale (`updated_at` > N days), blocked, or unassigned issues — pass through Claude only for the *summary line per issue*
- `audit_velocity`: pull sprint velocity for last 4 sprints, send the data to Claude with reasoning prompt, return diagnosis + recommendations
- These two together teach you a real lesson: not every tool needs heavy LLM reasoning. Some are just queries with a thin reasoning layer.

**Day 5 — Tool 5: `compose_update`** + **Tool 6: `weekly_summary`**
- Both are narrative-output tools
- `compose_update` takes optional `voice_samples` parameter — past examples of team's tone
- `weekly_summary` takes a team and date range, returns a narrative writeup
- These are the two tools that show off Claude's writing ability — make them sing

**Day 6 — Polish + bug bash**
- Use each tool in real workflows, find rough edges
- Improve error handling (network failures, missing data, hallucinated IDs)
- Tighten system prompts based on what you found
- Write inline JSDoc on every tool

**Day 7 — Buffer / catch-up day**
- If you're behind, catch up
- If you're on track, start drafting the writeup outline

### Week 2 — Build it serious

**Day 8 — Evaluation harness**
- For each of the six tools, write 5 ground-truth test cases
- A test case is: an input + an expected structure of output + criteria for "good enough"
- Use vitest to run these against the live Linear API + Claude
- Output a markdown table of pass/fail rates per tool
- This is the artifact most MCP servers don't have. Yours does. **This is the eval harness — the single biggest differentiator on the entire project.**

**Day 9 — Threat model + security writeup**
- Spend a full day on this. It's where your IAM/NHI background shines.
- Document:
  - **Auth model:** OAuth scopes used, why minimum-scope was chosen, what could go wrong if a token leaks
  - **Authorization boundaries:** the model can't escalate beyond the user's existing Linear permissions
  - **Input validation:** how zod schemas prevent prompt-injection from issue content from corrupting tool calls
  - **Output safety:** the model never proposes destructive operations directly (no `delete_issue` tool exposed)
  - **Audit trail:** every tool call logs `{user, tool, inputs, timestamp}` for review
- Commit as `SECURITY.md` in the repo
- This document is what gets quoted later by other people building MCP servers

**Day 10 — Cost telemetry + model selection**
- Add lightweight token counting to every tool call
- Document which Claude model each tool uses and why
  - `triage_inbox` → Haiku (cheap, high volume)
  - `scope_issue` → Sonnet (reasoning quality matters)
  - `weekly_summary` → Sonnet (writing quality matters)
  - `compose_update` → Sonnet (voice matters)
  - `find_orphans` → Haiku (mostly retrieval)
  - `audit_velocity` → Sonnet (reasoning matters)
- Commit a `COST_ANALYSIS.md` showing per-tool average tokens and cost

**Day 11 — The writeup**
- 1500–2500 words on the portfolio at `iambrucedavis.com/projects/linear-mcp`
- Five sections (use these exact headings or paraphrase):
  1. **Why a thoughtful Linear MCP is different from a thin wrapper** — the design philosophy
  2. **The six tools and why these six** — opinionated choices, not "every API endpoint"
  3. **The eval harness** — how you measure quality and why this is non-negotiable for production AI
  4. **Security and threat model** — your NHI/IAM angle, where it shows up here, where it would extend in enterprise use
  5. **What I'd do differently** — honest reflection on limitations, what V2 would address
- Diagrams: one architecture diagram, one auth-flow diagram, one example tool call flow
- Code samples: 2–3 short snippets showing key design decisions

**Day 12 — README + repo polish**
- README must include: what it is, who it's for, install instructions, example usage, the six tools listed with one-line descriptions each, link to writeup, link to security doc
- Add a short demo gif or Loom video at the top of the README
- Pin the repo on your GitHub profile
- Add badges (license, MCP version, eval pass rate)
- Update `package.json` with proper metadata

**Day 13 — Demo video**
- 3–5 minutes max — Loom or screen recording
- Show 3 of the 6 tools in action, with real Linear data (or a demo workspace)
- Open with the problem, not the demo: *"Linear has great APIs but most MCP servers wrap them in a way that treats LLMs as RPC callers. This one tries something different."*
- Upload to YouTube unlisted + embed in writeup + share on launch

**Day 14 — Launch loud**
- Morning: final review pass on repo, writeup, video
- Make repo public if it isn't already
- Publish writeup
- Post on X with: hook → 1 demo gif → writeup link → repo link
- Post on LinkedIn: longer-form version, same artifacts, tagged with `#MCP #AnthropicClaude #LinearApp`
- DM the Linear team's developer-experience folks (look on X or LinkedIn) with the writeup link
- Post in MCP Discord (Anthropic's, plus the MCP community one)
- Submit to `awesome-mcp` and any MCP server registries you find
- Reply individually to every comment that comes in for the next 48 hours

---

## What "done" looks like

Six checkboxes. All must be true to call this complete:

- [ ] Public GitHub repo with clean README, MIT license, demo video embedded
- [ ] Six working tools, each with input/output validation, error handling, real testing
- [ ] Evaluation harness with documented pass rates per tool
- [ ] `SECURITY.md` documenting threat model and IAM-style authorization boundaries
- [ ] 1500–2500 word writeup on portfolio site with diagrams
- [ ] Launched publicly on X + LinkedIn + MCP community channels

If you ship 4 of 6 by day 14, that's still strong. Skipping the writeup or the launch is what makes it fail to land. Don't skip those two.

---

## What to write about as you build (Tier 2 fuel)

Each of these is a draft blog post you can publish in the weeks after launch. Capture rough notes daily — don't try to write polished posts mid-build.

- **Post 1 — "Why your MCP server should not be a thin API wrapper"** (Day 11–14)
- **Post 2 — "Evaluation harnesses for MCP tools — what I learned building one"** (Week 3)
- **Post 3 — "The security model I built for a Linear MCP server — and why it borrows from my IAM background"** (Week 3)
- **Post 4 — "Choosing Haiku vs Sonnet per tool — the economics of MCP servers"** (Week 4)
- **Post 5 — "What I'd build differently for a V2"** (Week 4)

That's five posts off one hero project. Combined with Project 3, you have ten posts written in the first six weeks of writing. That's a credibility surface.

---

## Working with Claude Code

You said you'd be using Claude Code to build this. Three operating principles based on what we learned during the portfolio refresh:

1. **You spec, Claude Code executes.** Don't let Claude Code decide what the six tools are or how they're shaped. That's the design work — yours. Open each day with a specific scope.

2. **Read every output before you commit.** It's tempting to let Claude Code chain edits across files. Don't. Review each diff. The eval harness in particular needs to be code you actually understand, because you're going to talk about it in interviews.

3. **Use Claude Code for the build, not the writeup.** The writeup is your voice. Claude Code-generated copy will not sound like you and will not pass the recruiter sniff test. Draft the writeup in plain text in a doc — Claude (chat) can help you tighten and refine, but the first draft is yours.

---

## What's NOT in scope

Five things to actively cut if they tempt you mid-build:

- A web UI / dashboard (this is an MCP server, not a SaaS product)
- A second tool integration (don't add GitHub or Slack — that's a different project)
- Custom auth providers beyond Linear's defaults
- A npm package release (V2 thing, not V1)
- Anything beyond the six listed tools

Scope discipline is what gets you to launch by day 3.

---

## Final note

By day 3, the Linear MCP repo is public, the writeup is live, and your portfolio has a hero piece. By day 4 (Project 2 done), an AI-native React UI consumes it. By day 5, you've shipped two hero projects, two portfolio additions, and five posts. The candidacy is different by then.

The way you avoid the most common failure mode — half-built side projects that never ship — is by treating Day 3's launch as a hard external deadline. Pretend you're presenting at a conference that day. Build accordingly.

Start now.
