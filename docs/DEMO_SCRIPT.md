# Demo video script — linear-mcp

A shot-by-shot script for the launch demo. Target **3.5-4 minutes**. Tool:
Loom or a plain screen recording. Three of the six tools are shown — enough to
make the point without dragging.

The narration below is a **draft to shape, not a teleprompter** — say it in your
own words. Screen directions are firm; the words are yours.

**Before you record:**
- `.env` populated; `npm run build` done; `linear-mcp` connected in your client.
- Have a Linear workspace with real-ish data — an inbox with a few
  notifications, one freshly-filed issue, a team with a few completed cycles.
- Pick the issue and team you'll use; know their identifiers.
- Close noisy tabs/notifications. Bump editor font size.

---

## Beat 1 — The problem (0:00-0:30)

**Screen:** you, or a title card, or a slow scroll of a typical "thin wrapper"
MCP server's tool list (a long list of `getIssue`, `updateIssue`, …).

**Narration draft:**
> "Linear has a great API. And most MCP servers wrap it the obvious way — they
> expose every endpoint and let the model figure it out. That works, but it
> treats the language model as an RPC caller. I wanted to try something
> different: tools that match how a senior engineer actually thinks about
> running an issue tracker."

---

## Beat 2 — What this is (0:30-0:50)

**Screen:** the README — the six-tool table.

**Narration draft:**
> "Six tools. Not CRUD wrappers — primitives. Each one does a whole job: fetch
> the right data, apply judgment, hand back a structured result. Let me show you
> three."

---

## Beat 3 — `triage_inbox` (0:50-1:50)

**Screen:** your MCP client. Type the prompt, let it run, show the result.

**Prompt:** *"Triage my Linear inbox."*

**While it runs / on the result, narration draft:**
> "It pulls my unread notifications, and instead of just listing them, it sorts
> them — urgent, high, normal, low — summarizes each in a line, and tells me
> what to actually do about it. That classification runs on Haiku, the cheap
> fast model, because triage is high-volume pattern-matching, not deep
> reasoning."

**Point at one item.** Mention: the priority and summary are the model's
judgment; the link is real, straight from Linear — the model never sees URLs, so
it can't invent one.

---

## Beat 4 — `scope_issue` (1:50-2:50)

**Screen:** show the raw issue in Linear first (a thin, freshly-filed one), then
switch to the client.

**Prompt:** *"Scope issue [YOUR-ISSUE-ID] for me."*

**On the result, narration draft:**
> "Same idea, different shape of work. I give it a vague, freshly-filed issue.
> It comes back with subtasks, testable acceptance criteria, the risks with
> mitigations, an effort estimate — and open questions for the person who filed
> it. This one runs on Sonnet with reasoning on, because scoping is genuine
> planning. Match the model to the cognitive load."

**Point at:** the risks, or the open questions — show it's honest, not padding.

---

## Beat 5 — `audit_velocity` (2:50-3:30)

**Screen:** the client.

**Prompt:** *"Has the [YOUR-TEAM] team's velocity changed lately?"*

**On the result, narration draft:**
> "Last one. Velocity. A dashboard gives you the number — this gives you the
> read. It pulls the last few cycles and diagnoses the trend, and crucially it
> distinguishes a real decline from normal cycle-to-cycle noise. It explains
> *why*, not just *what*."

> *(Alternate tool if you'd rather show writing: `compose_update` —
> "Draft a Slack update for the [TEAM] team's last two weeks" — and point out
> the `voice_samples` parameter that matches your team's tone.)*

---

## Beat 6 — The three things most MCP servers skip (3:30-3:50)

**Screen:** quick cuts — `docs/EVAL_RESULTS.md`, then `docs/SECURITY.md`, then
the `LEARNING.md` entry list.

**Narration draft:**
> "The part I'm proudest of isn't the tools. It's that this ships with the three
> things most MCP servers don't: an eval harness — thirty graded test cases — a
> real threat model, and an honest cost analysis. That's the difference between
> a demo and something you'd actually run."

---

## Beat 7 — Close (3:50-4:00)

**Screen:** the GitHub repo.

**Narration draft:**
> "It's open source — link's below — and there's a full writeup of how it's
> built. Thanks for watching."

**On-screen / description:** repo link, writeup link.

---

## Post-production checklist
- [ ] Under 5 minutes (aim ~4:00).
- [ ] Trim dead air while tools run — cut, or speed-ramp the wait.
- [ ] Captions on (most people watch muted).
- [ ] Upload to YouTube **unlisted**.
- [ ] Embed in the writeup; drop the link + a short gif at the top of the README
      (replace the `<!-- DEMO -->` placeholder).
