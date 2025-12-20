export interface SessionData {
    authenticated: boolean
    issuedAt: number
    expiresAt: number
}

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: number
    blockedUntil?: number
}

export interface RateLimitEntry {
    count: number
    resetAt: number
    blockedUntil?: number
}
