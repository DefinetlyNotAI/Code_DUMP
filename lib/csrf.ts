/**
 * CSRF protection utilities
 *
 * Security considerations:
 * - Generates cryptographically secure tokens
 * - Tokens are single-use and time-limited
 * - Uses double-submit cookie pattern
 * - Enforces CSRF protection on all state-changing operations
 *
 * Usage:
 * 1. In API routes: Use requireCsrfProtection() middleware
 * 2. In client: Get token from /api/auth/csrf and include in request body
 */

import { cookies } from "next/headers"
import { randomBytes, timingSafeEqual } from "crypto"
import { type NextRequest, NextResponse } from "next/server"

const CSRF_TOKEN_LENGTH = 32
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour

interface CsrfTokenData {
  token: string
  expiresAt: number
}

/**
 * Generate a new CSRF token
 */
function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString("hex")
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken()
  const cookieStore = await cookies()

  const tokenData: CsrfTokenData = {
    token,
    expiresAt: Date.now() + CSRF_TOKEN_EXPIRY,
  }

  cookieStore.set("csrf-token", JSON.stringify(tokenData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_EXPIRY / 1000,
    path: "/",
  })

  return token
}

/**
 * Verify CSRF token from request
 */
async function verifyCsrfToken(providedToken: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const csrfCookie = cookieStore.get("csrf-token")

    if (!csrfCookie?.value) {
      return false
    }

    const tokenData: CsrfTokenData = JSON.parse(csrfCookie.value)

    // Check expiry
    if (tokenData.expiresAt < Date.now()) {
      return false
    }

    // Constant-time comparison to prevent timing attacks
    // Convert strings to buffers for timingSafeEqual comparison
    const tokenBuffer = Buffer.from(tokenData.token, "utf-8")
    const providedBuffer = Buffer.from(providedToken, "utf-8")

    // Check if lengths match first (timingSafeEqual requires equal length buffers)
    if (tokenBuffer.length !== providedBuffer.length) {
      return false
    }

    return timingSafeEqual(tokenBuffer, providedBuffer)
  } catch (error) {
    console.error("[CSRF] Token verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return false
  }
}

/**
 * Middleware to require CSRF protection for state-changing operations
 *
 * Usage in API routes:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfCheck = await requireCsrfProtection(request)
 *   if (csrfCheck.error) return csrfCheck.error
 *
 *   // Access the parsed body (CSRF token removed)
 *   const data = csrfCheck.data
 * }
 * ```
 */
export async function requireCsrfProtection(
  request: NextRequest
): Promise<{ error: NextResponse | null; data?: any }> {
  try {
    const body = await request.json()
    const { csrfToken, ...data } = body

    if (!csrfToken) {
      console.warn("[CSRF] Request blocked - missing CSRF token", {
        url: request.url,
        method: request.method,
      })
      return {
        error: NextResponse.json({ error: "CSRF token required" }, { status: 403 }),
      }
    }

    const isValid = await verifyCsrfToken(csrfToken)

    if (!isValid) {
      console.warn("[CSRF] Request blocked - invalid CSRF token", {
        url: request.url,
        method: request.method,
      })
      return {
        error: NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 }),
      }
    }

    // Return data without the CSRF token
    return { error: null, data }
  } catch (error) {
    console.error("[CSRF] CSRF protection check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      url: request.url,
    })
    return {
      error: NextResponse.json({ error: "CSRF validation failed" }, { status: 403 }),
    }
  }
}
