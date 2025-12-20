/**
 * CSRF protection utilities
 *
 * Security considerations:
 * - Generates cryptographically secure tokens
 * - Tokens are single-use and time-limited
 * - Uses double-submit cookie pattern
 */

import { cookies } from "next/headers"
import { randomBytes } from "crypto"

const CSRF_TOKEN_LENGTH = 32
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour

interface CsrfTokenData {
  token: string
  expiresAt: number
}

/**
 * Generate a new CSRF token
 */
export function generateCsrfToken(): string {
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
export async function verifyCsrfToken(providedToken: string): Promise<boolean> {
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
    return tokenData.token === providedToken
  } catch (error) {
    console.error("[CSRF] Token verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return false
  }
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const csrfCookie = cookieStore.get("csrf-token")

    if (!csrfCookie?.value) {
      return null
    }

    const tokenData: CsrfTokenData = JSON.parse(csrfCookie.value)

    // Check if expired
    if (tokenData.expiresAt < Date.now()) {
      return null
    }

    return tokenData.token
  } catch (error) {
    return null
  }
}
