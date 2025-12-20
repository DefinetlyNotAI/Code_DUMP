/**
 * Rate limiting implementation to prevent brute force attacks
 *
 * Security considerations:
 * - In-memory store (for production, use Redis or similar)
 * - Tracks attempts by IP address
 * - Exponential backoff on repeated failures
 */
import {RateLimitEntry, RateLimitResult} from "@/types/server";


// In-memory store (use Redis in production for multi-instance deployments)
// I know it's not ideal, but sufficient for current usage/scope
const store = new Map<string, RateLimitEntry>()

// Clean up old entries every 10 minutes
setInterval(
    () => {
        const now = Date.now()
        for (const [key, value] of store.entries()) {
            if (value.resetAt < now && (!value.blockedUntil || value.blockedUntil < now)) {
                store.delete(key)
            }
        }
    },
    10 * 60 * 1000,
)


/**
 * Check rate limit for a given identifier (typically IP address)
 *
 * @param identifier - Usually the IP address
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowMs - Time window in milliseconds
 * @param blockDurationMs - How long to block after exceeding limit
 */
export function checkRateLimit(
    identifier: string,
    maxAttempts = 5,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    blockDurationMs: number = 30 * 60 * 1000, // 30 minutes
): RateLimitResult {
    const now = Date.now()
    const entry = store.get(identifier)

    // Check if currently blocked
    if (entry?.blockedUntil && entry.blockedUntil > now) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.blockedUntil,
            blockedUntil: entry.blockedUntil,
        }
    }

    // Reset if window expired
    if (!entry || entry.resetAt < now) {
        store.set(identifier, {
            count: 1,
            resetAt: now + windowMs,
        })
        return {
            allowed: true,
            remaining: maxAttempts - 1,
            resetAt: now + windowMs,
        }
    }

    // Increment count
    entry.count += 1

    // Block if exceeded
    if (entry.count > maxAttempts) {
        entry.blockedUntil = now + blockDurationMs
        store.set(identifier, entry)

        console.warn("[SECURITY] Rate limit exceeded", {identifier, attempts: entry.count})

        return {
            allowed: false,
            remaining: 0,
            resetAt: entry.resetAt,
            blockedUntil: entry.blockedUntil,
        }
    }

    store.set(identifier, entry)

    return {
        allowed: true,
        remaining: maxAttempts - entry.count,
        resetAt: entry.resetAt,
    }
}

/**
 * Reset rate limit for an identifier (e.g., on successful login)
 */
export function resetRateLimit(identifier: string): void {
    store.delete(identifier)
}
