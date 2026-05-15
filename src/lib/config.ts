/**
 * Environment configuration.
 *
 * The server reads two secrets from the environment:
 *   - LINEAR_API_KEY     — a Linear Personal API key (PAT)
 *   - ANTHROPIC_API_KEY  — an Anthropic API key
 *
 * Design choice 1 — lazy validation. Keys are checked when a tool first needs
 * them, not at startup. That lets the server boot and serve `ping` with no keys
 * configured, which is friendlier for first-time setup and for MCP clients that
 * probe the tool list before anything is wired up.
 *
 * Design choice 2 — no zod here, on purpose. zod is this project's defense
 * against untrusted, model-generated tool inputs. Environment variables are
 * operator-controlled, not model-controlled, so a plain presence check is the
 * honest tool. Reaching for zod here would be cargo-culting.
 */

/** Thrown when a required environment variable is missing or empty. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function readKey(name: string, hint: string): string {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    throw new ConfigError(
      `${name} is not set. ${hint} ` +
        `Set it in your environment or a .env file at the project root (see .env.example).`,
    );
  }
  return raw.trim();
}

let linearApiKey: string | undefined;
let anthropicApiKey: string | undefined;

/** Returns the Linear Personal API key. Throws {@link ConfigError} if unset. */
export function getLinearApiKey(): string {
  linearApiKey ??= readKey(
    "LINEAR_API_KEY",
    "Generate a Personal API key at Linear → Settings → Security & access → Personal API keys.",
  );
  return linearApiKey;
}

/** Returns the Anthropic API key. Throws {@link ConfigError} if unset. */
export function getAnthropicApiKey(): string {
  anthropicApiKey ??= readKey(
    "ANTHROPIC_API_KEY",
    "Create a key at https://console.anthropic.com/ under API Keys.",
  );
  return anthropicApiKey;
}
