# Launch checklist — linear-mcp

Day 14. Work top to bottom. The draft copy is **yours to shape** — it's a
starting point in roughly your voice, not final text.

---

## 1. Pre-launch review (morning)

- [ ] `npm run build` — clean.
- [ ] `npm test` — 56 passing.
- [ ] `npm run eval` **with real keys** (`.env` + `EVAL_TEAM_KEY` + `EVAL_ISSUE_ID`)
      — get a real `docs/EVAL_RESULTS.md`, commit it, eyeball the pass rates.
- [ ] Record the demo (see `DEMO_SCRIPT.md`); upload to YouTube **unlisted**.
- [ ] Replace the `<!-- DEMO -->` placeholder in `README.md` with a gif + the
      video link.
- [ ] Read the README top to bottom as if you'd never seen the repo. Fix
      anything a stranger would trip on.
- [ ] Confirm the repo is **public** (it is) and the description + topics are
      set on GitHub (`mcp`, `linear`, `claude`, `typescript`).
- [ ] Skim `LEARNING.md`, `SECURITY.md`, `COST_ANALYSIS.md` for anything stale.
- [ ] Publish the writeup at `iambrucedavis.com/projects/linear-mcp`.

## 2. Launch (midday)

- [ ] Post on X (draft below) — hook + demo gif, then reply with writeup + repo
      links.
- [ ] Post on LinkedIn (draft below) — longer form, same artifacts.
- [ ] DM the Linear developer-experience folks (find them on X / LinkedIn) with
      the writeup link and a one-line "built this, thought your team might find
      the design interesting."
- [ ] Post in the MCP community Discord(s) — Anthropic's and the community one.
- [ ] Open a PR adding the repo to `awesome-mcp` (and any MCP server registry
      you find — check modelcontextprotocol.io).
- [ ] Pin the repo on your GitHub profile.

## 3. First 48 hours

- [ ] Reply to every comment on X and LinkedIn.
- [ ] Reply to every GitHub issue / discussion.
- [ ] Note recurring questions — they're free material for the Tier-2 blog posts.

---

## Draft — X post

> Most MCP servers for SaaS tools just wrap the API: every endpoint, model
> figures it out. I built one for Linear that doesn't.
>
> 6 opinionated tools. An eval harness. A real threat model. An honest cost
> analysis.
>
> Writeup + repo 👇

*(attach the demo gif; reply to your own post with the writeup link and the
repo link so they're not competing with the gif for the preview)*

## Draft — X reply (links)

> Writeup: iambrucedavis.com/projects/linear-mcp
> Repo (MIT): github.com/iambrucedavis/linear-mcp

## Draft — LinkedIn post

> I spent two weeks building an MCP server for Linear — and tried to make it
> the one people quote when they talk about good MCP design.
>
> Most MCP servers for SaaS tools are thin wrappers: they expose every API
> endpoint and let the language model figure it out. That works, but it treats
> the model as an RPC caller.
>
> linear-mcp takes a different bet — six opinionated tools that match how a
> senior engineer actually runs an issue tracker: triage an inbox, scope a
> fresh issue, find work that's slipped through the cracks, diagnose a team's
> velocity.
>
> But the tools aren't the part I'm proudest of. It ships with the three things
> most MCP servers skip:
>
> → An eval harness — 30 graded test cases, run against the live APIs.
> → A threat model — including why I treat the tool surface itself as a
>   security boundary, and how a successful prompt injection still can't do
>   any damage.
> → An honest cost analysis — which Claude model each tool uses, and why.
>
> Full writeup: iambrucedavis.com/projects/linear-mcp
> Repo (MIT, open source): github.com/iambrucedavis/linear-mcp
>
> #MCP #AnthropicClaude #LinearApp

---

## Notes
- Lead with the problem, not the demo — same framing as the writeup and video.
- The eval harness / threat model / cost analysis is the differentiator. Say it
  everywhere; it's what separates this from a weekend demo.
- Keep replies generous and specific for 48 hours — the conversation is the
  point, not the post.
