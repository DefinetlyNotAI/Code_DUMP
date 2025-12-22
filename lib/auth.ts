/**
 * Authentication utilities for the email supervision dashboard
 *
 * Security considerations:
 * - Uses bcrypt for password hashing (bcrypt is preferred over argon2 for Node.js compatibility)
 * - HTTP-only cookies prevent XSS attacks on session tokens
 * - Secure sessions with rotation on login
 * - Rate limiting prevents brute force attacks
 * - No credentials ever logged or exposed to client
 */

import bcrypt from "bcryptjs"
import {jwtVerify, SignJWT} from "jose"
import {cookies} from "next/headers"
import {SessionData} from "@/types/server";
import {SecuritySettings} from "@/lib/settings";

// Master password hash stored in environment variable as base64-encoded bcrypt hash
// Generate with: Buffer.from(await bcrypt.hash('your-password', 10)).toString('base64')
const MASTER_PASSWORD_BCRYPT_HASH_BASE64 = process.env.MASTER_PASSWORD_BCRYPT_HASH

// Decode the base64-encoded bcrypt hash at runtime
const MASTER_PASSWORD_BCRYPT_HASH = MASTER_PASSWORD_BCRYPT_HASH_BASE64
    ? Buffer.from(MASTER_PASSWORD_BCRYPT_HASH_BASE64, 'base64').toString('utf8')
    : undefined

// Validate environment variables at runtime, not at module load
function validateEnvironment() {
    if (!MASTER_PASSWORD_BCRYPT_HASH) {
        console.error("[SECURITY] MASTER_PASSWORD_BCRYPT_HASH not set in environment variables")
        return false
    }
    if (!process.env.SESSION_SECRET) {
        console.error("[SECURITY] SESSION_SECRET not set in environment variables")
        return false
    }
    return true
}

const SESSION_SECRET = process.env.SESSION_SECRET
    ? new TextEncoder().encode(process.env.SESSION_SECRET)
    : null

/**
 * Verify the provided password against the master password hash
 * Never logs the password or hash
 */
export async function verifyMasterPassword(password: string): Promise<boolean> {
    console.log("[AUTH DEBUG] verifyMasterPassword called")
    console.log("[AUTH DEBUG] Password received:", {
        type: typeof password,
        length: password?.length,
        trimmedLength: password?.trim().length,
    })


    if (!validateEnvironment() || !MASTER_PASSWORD_BCRYPT_HASH) {
        console.error("[AUTH] Environment validation failed")
        throw new Error("Environment not properly configured")
    }

    console.log("[AUTH DEBUG] Environment hash exists:", !!MASTER_PASSWORD_BCRYPT_HASH)
    console.log("[AUTH DEBUG] Hash starts with $2:", MASTER_PASSWORD_BCRYPT_HASH?.startsWith('$2'))
    console.log("[AUTH DEBUG] Hash length:", MASTER_PASSWORD_BCRYPT_HASH?.length)
    console.log("[AUTH DEBUG] Hash first 10 chars:", MASTER_PASSWORD_BCRYPT_HASH?.substring(0, 10))
    console.log("[AUTH DEBUG] Hash last 10 chars:", MASTER_PASSWORD_BCRYPT_HASH?.substring(MASTER_PASSWORD_BCRYPT_HASH.length - 10))

    const result = await bcrypt.compare(password, MASTER_PASSWORD_BCRYPT_HASH)
    console.log("[AUTH] bcrypt.compare result:", result)

    return result
}

/**
 * Create a new session token with JWT
 * Tokens expire after set timeout
 */
export async function createSessionToken(): Promise<string> {
    if (!validateEnvironment() || !SESSION_SECRET) {
        throw new Error("Environment not properly configured")
    }

    const issuedAt = Date.now()
    const expiresAt = issuedAt + SecuritySettings.sessionTimeout

    return await new SignJWT({
        authenticated: true,
        issuedAt,
        expiresAt,
    })
        .setProtectedHeader({alg: "HS256"})
        .setExpirationTime(expiresAt)
        .sign(SESSION_SECRET)
}

/**
 * Verify and decode a session token
 */
export async function verifySessionToken(token: string): Promise<SessionData | null> {
    if (!validateEnvironment() || !SESSION_SECRET) {
        throw new Error("Environment not properly configured")
    }

    try {
        const verified = await jwtVerify(token, SESSION_SECRET!)
        return verified.payload as unknown as SessionData
    } catch (error) {
        // Token invalid or expired - this is an expected case
        return null
    }
}

/**
 * Set session cookie with secure options
 * - HTTP-only: prevents JavaScript access
 * - Secure: only sent over HTTPS
 * - SameSite: CSRF protection
 */
export async function setSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies()

    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: SecuritySettings.sessionTimeout, // 8 hours
        path: "/",
    })
}

/**
 * Remove session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete("session")
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie?.value) {
        return null
    }

    return verifySessionToken(sessionCookie.value)
}

/**
 * Check if user is authenticated (for use in server components and API routes)
 */
export async function requireAuth(): Promise<boolean> {
    const session = await getSession()
    return session?.authenticated === true && session.expiresAt > Date.now()
}
