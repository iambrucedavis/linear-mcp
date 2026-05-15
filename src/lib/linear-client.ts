import { LinearClient } from "@linear/sdk";
import { getLinearApiKey } from "./config.js";

let client: LinearClient | undefined;

/**
 * Returns a configured Linear API client (lazy singleton).
 *
 * Authenticated with a Personal API key (PAT). This is a deliberate security
 * boundary: the server operates strictly within the permissions of the user
 * who issued that key. It cannot see or change anything that user couldn't
 * already see or change in Linear themselves — the model gets no privilege
 * escalation. (OAuth with scoped, minimum-privilege tokens is the Week 2
 * upgrade; PAT keeps Day 2 simple.)
 *
 * Throws {@link import("./config.js").ConfigError} if LINEAR_API_KEY is unset.
 */
export function getLinearClient(): LinearClient {
  client ??= new LinearClient({ apiKey: getLinearApiKey() });
  return client;
}
