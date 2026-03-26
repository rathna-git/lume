/**
 * Simple in-memory rate limiter — v1 safeguard.
 *
 * Stores request timestamps per key (userId). On each call it:
 *   1. Drops timestamps older than the window
 *   2. Rejects if the remaining count >= the limit
 *   3. Otherwise records the current timestamp and allows the request
 *
 * Note: state is per-instance. On Vercel each serverless function instance
 * maintains its own Map, so this does not enforce a hard global limit across
 * all instances. It is sufficient as a cost-protection measure for v1.
 */

const store = new Map<string, number[]>()

export function checkRateLimit(
    key: string,
    limit: number = 12,
    windowMs: number = 60_000
): { allowed: boolean } {
    const now = Date.now()
    const cutoff = now - windowMs
    const timestamps = (store.get(key) ?? []).filter((t) => t > cutoff)

    if (timestamps.length >= limit) {
        store.set(key, timestamps)
        return { allowed: false }
    }

    timestamps.push(now)
    store.set(key, timestamps)
    return { allowed: true }
}
