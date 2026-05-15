import Anthropic from "@anthropic-ai/sdk";
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
