import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getAnthropicApiKey } from "./config.js";

/**
 * Claude model IDs used by this server, keyed by role.
 *
 * Per-tool model selection is a deliberate cost/quality tradeoff (documented in
 * full in the Day 10 cost analysis): cheap, high-volume, retrieval-shaped work
 * runs on Haiku; reasoning- and writing-heavy work runs on Sonnet.
 *
 *   triage_inbox    → HAIKU   (classification, high volume)
 *   find_orphans    → HAIKU   (mostly retrieval, thin reasoning)
 *   scope_issue     → SONNET  (reasoning quality matters)
 *   weekly_summary  → SONNET  (writing quality matters)
 *   compose_update  → SONNET  (voice matters)
 *   audit_velocity  → SONNET  (reasoning quality matters)
 */
export const MODELS = {
  /** Fast and cheap. Classification and retrieval-shaped summaries. */
  HAIKU: "claude-haiku-4-5",
  /** Stronger reasoning and writing. Scoping, narratives, diagnosis. */
  SONNET: "claude-sonnet-4-6",
} as const;

let client: Anthropic | undefined;

/**
 * Returns a configured Anthropic API client (lazy singleton).
 *
 * Throws {@link import("./config.js").ConfigError} if ANTHROPIC_API_KEY is unset.
 */
export function getAnthropicClient(): Anthropic {
  client ??= new Anthropic({ apiKey: getAnthropicApiKey() });
  return client;
}

/**
 * Token-usage shape attached to every tool's output. Feeds the Day 10 cost
 * analysis — every tool reports exactly what it spent.
 */
export const UsageSchema = z.object({
  input_tokens: z.number().int(),
  output_tokens: z.number().int(),
  cache_read_input_tokens: z.number().int(),
  cache_creation_input_tokens: z.number().int(),
});

export type Usage = z.infer<typeof UsageSchema>;

/** Structural shape of the `usage` object on an Anthropic message response. */
interface RawUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** Normalizes an Anthropic response's usage into our {@link UsageSchema} shape (nulls → 0). */
export function extractUsage(usage: RawUsage): Usage {
  return {
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
    cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
  };
}
