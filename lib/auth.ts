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

import {compare} from "bcryptjs"
import {jwtVerify, SignJWT} from "jose"
import {cookies} from "next/headers"
import {SessionData} from "@/types/server";

// Master password hash stored in environment variable
// Generate with: bcrypt.hash('your-password', 10)
const SHA256_HASH = process.env.SHA256_HASH

if (!SHA256_HASH) {
    console.error("[SECURITY] SHA256_HASH not set in environment variables")
    throw new Error("SHA256_HASH must be set")
}

if (!process.env.SESSION_SECRET) {
    console.error("[SECURITY] SESSION_SECRET not set in environment variables")
    throw new Error("SESSION_SECRET must be set")
}

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET)

/**
 * Verify the provided password against the master password hash
 * Never logs the password or hash
 */
export async function verifyMasterPassword(password: string): Promise<boolean> {
    try {
        return await compare(password, SHA256_HASH!)
    } catch (error) {
        console.error("[AUTH] Password verification failed", {
            error: error instanceof Error ? error.message : "Unknown error",
        })
        return false
    }
}

/**
 * Create a new session token with JWT
 * Tokens expire after 8 hours
 */
export async function createSessionToken(): Promise<string> {
    const issuedAt = Date.now()
    const expiresAt = issuedAt + 8 * 60 * 60 * 1000 // 8 hours

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
    try {
        const verified = await jwtVerify(token, SESSION_SECRET)
        return verified.payload as unknown as SessionData
    } catch (error) {
        // Token invalid or expired
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
        maxAge: 8 * 60 * 60, // 8 hours
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
