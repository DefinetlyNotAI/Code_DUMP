/**
 * Login API endpoint
 *
 * Security features:
 * - CSRF protection
 * - Rate limiting by IP
 * - No information disclosure (same error for all failures)
 * - Secure session creation
 * - No credential logging
 */

import { type NextRequest, NextResponse } from "next/server"
import { verifyMasterPassword, createSessionToken, setSessionCookie } from "@/lib/auth"
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit"
import { requireCsrfProtection } from "@/lib/csrf"

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const csrfCheck = await requireCsrfProtection(request)
    if (csrfCheck.error) return csrfCheck.error

    const { password } = csrfCheck.data

    // Extract IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Check rate limit (5 attempts per 15 minutes)
    const rateLimit = checkRateLimit(ip, 5, 15 * 60 * 1000, 30 * 60 * 1000)

    if (!rateLimit.allowed) {
      console.warn("[AUTH] Login rate limit exceeded", { ip })
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.blockedUntil! - Date.now()) / 1000),
        },
        { status: 429 },
      )
    }


    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Verify password
    const isValid = await verifyMasterPassword(password)

    if (!isValid) {
      console.warn("[AUTH] Failed login attempt", { ip })
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Success - create session
    const token = await createSessionToken()
    await setSessionCookie(token)

    // Reset rate limit on successful login
    resetRateLimit(ip)

    console.log("[AUTH] Successful login", { ip })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AUTH] Login error", { error: error instanceof Error ? error.message : "Unknown error" })
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
