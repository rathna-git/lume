/**
 * Server-side environment config.
 * Validates required variables at startup so missing secrets
 * cause a clear error at boot, not a cryptic runtime failure.
 *
 * Import this instead of reading process.env directly.
 * Do NOT import this in client components — server-only.
 */

function require(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  DATABASE_URL: require("DATABASE_URL"),
  CLERK_SECRET_KEY: require("CLERK_SECRET_KEY"),
  OPENAI_API_KEY: require("OPENAI_API_KEY"),
} as const
