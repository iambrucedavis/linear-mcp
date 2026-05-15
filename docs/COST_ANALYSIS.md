# Cost analysis — linear-mcp

Every tool here calls the Anthropic API, and every API call costs money. This
document explains which Claude model each tool uses, why, what a call costs,
and where the cost actually goes.

It is also a working artifact: each tool returns a `usage` block in its output
(exact input/output/cache token counts for that call), so the estimates below
can be replaced with measured numbers from real runs.

---

## 1. Model selection — which tool runs on what

| Tool | Model | Adaptive thinking | Why |
| --- | --- | --- | --- |
| `triage_inbox` | Haiku 4.5 | off | High-volume classification. Sorting notifications into four buckets is fast pattern-matching; deeper reasoning wouldn't improve it. |
| `find_orphans` | Haiku 4.5 | off | Mostly retrieval. Linear's query engine finds the orphans; the model only writes a one-line summary per issue. |
| `scope_issue` | Sonnet 4.6 | on | Genuine planning — subtasks, risks, effort. Reasoning quality is the product. |
| `audit_velocity` | Sonnet 4.6 | on | Diagnosis — distinguishing a real trend from noise. Reasoning quality is the product. |
| `compose_update` | Sonnet 4.6 | on | Writing quality and voice matching matter. |
| `weekly_summary` | Sonnet 4.6 | on | Narrative prose — writing quality is the product. |

The rule: **match the model to the cognitive load.** Classification and
retrieval go to Haiku (cheap, fast); reasoning and writing go to Sonnet.
Adaptive thinking is on only for the four tools that genuinely reason.

---

## 2. Pricing

Anthropic API list pricing (per 1,000,000 tokens), as of the build:

| Model | Input | Output |
| --- | --- | --- |
| Claude Haiku 4.5 | $1.00 | $5.00 |
| Claude Sonnet 4.6 | $3.00 | $15.00 |

Two facts drive everything below:

1. **Output tokens cost 5× input tokens.** What a tool *produces* matters far
   more to its bill than what it *reads*.
2. **Sonnet is 3× the price of Haiku.** And on the reasoning tools, adaptive
   thinking adds output tokens (thinking is billed as output).

---

## 3. Cost model

For one tool call:

```
cost = (input_tokens  / 1e6) * input_price
     + (output_tokens / 1e6) * output_price
```

`output_tokens` includes any adaptive-thinking tokens. The real numbers for any
given call are in that call's `usage` block —
`{ input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens }`.

---

## 4. Estimated cost per call

**These are modeled estimates**, not measurements — they assume representative
input sizes (a 20-item inbox, a typical issue, ~2 weeks of team activity) and
typical output lengths. Treat them as the right *order of magnitude* and the
right *ratios*; replace them with measured `usage` numbers from real runs (§6).

| Tool | Model | ~Input tok | ~Output tok | ~Cost / call |
| --- | --- | --- | --- | --- |
| `triage_inbox` | Haiku | ~1,900 | ~1,200 | **~$0.008** |
| `find_orphans` | Haiku | ~1,450 | ~900 | **~$0.006** |
| `audit_velocity` | Sonnet | ~900 | ~2,000 | **~$0.033** |
| `scope_issue` | Sonnet | ~850 | ~2,500 | **~$0.040** |
| `weekly_summary` | Sonnet | ~2,250 | ~2,500 | **~$0.044** |
| `compose_update` | Sonnet | ~2,500 | ~2,500 | **~$0.045** |

The Haiku tools land around **half a cent to a cent** per call. The Sonnet
reasoning tools land around **3-5 cents** — roughly 5-7× more.

---

## 5. Where the cost actually goes

- **Output dominates.** On the Sonnet tools, output (final answer + thinking) is
  the large majority of the bill. Optimizing cost means controlling output
  length and thinking depth, not trimming input.
- **Model choice is a multiplier; frequency is the real lever.** The cheap tools
  (`triage_inbox`, `find_orphans`) are also the ones you run *often* — you
  triage an inbox daily. Putting the high-frequency tools on Haiku is where the
  per-tool model decision pays off: frequency × unit cost is what shows up on
  the monthly bill. The Sonnet tools are run occasionally (scope a new issue,
  write the weekly summary), so their higher unit cost matters less.
- **Worked example.** A team member who triages their inbox twice a day, checks
  orphans weekly, scopes ~5 issues a week, and runs one weekly summary and one
  update: roughly `(2×20×$0.008) + (1×$0.006) + (5×$0.04) + $0.044 + $0.045`
  per week ≈ **$0.61/week**, about **$2.60/month**. The triage calls — by far
  the most frequent — are only ~$0.32 of that *because* they're on Haiku. On
  Sonnet they would be ~$1.30.

---

## 6. Prompt caching — wired, currently inactive (and that's honest)

Each tool sets `cache_control` on its system prompt. But Anthropic only caches a
prefix above a minimum size — ~4,096 tokens for Haiku, ~2,048 for Sonnet 4.6.
The system prompts here are short (~250-400 tokens), so **they do not currently
hit the cache**, and `cache_read_input_tokens` will read 0.

This is left wired on purpose, and documented rather than hidden: it costs
nothing, it is correct, and it means caching activates automatically if the
prompts grow. If cost became a real concern, the higher-leverage move would be
caching the *per-request data* (e.g. a large activity payload reused across
several summary variants), not the small static prompt.

---

## 7. Getting real numbers

The estimates above are modeled. To measure:

1. Every tool's output already includes a `usage` block — exact token counts
   for that call. Read it directly.
2. The eval harness (`npm run eval`) calls every tool; a live run surfaces real
   `usage` for representative inputs.
3. Substitute measured input/output tokens into the §3 formula.

Real numbers will move the estimates, but the **structure** holds: output
dominates, Haiku tools are ~5-7× cheaper than Sonnet tools, and the bill is
driven by how often the cheap high-frequency tools run.

---

*Last reviewed: 2026-05-15 (Day 10 of the build).*
