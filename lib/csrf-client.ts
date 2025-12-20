/**
 * Client-side CSRF token utilities
 *
 * Usage:
 * ```typescript
 * import { fetchWithCsrf } from '@/lib/csrf-client'
 *
 * // For POST, PUT, DELETE requests
 * const response = await fetchWithCsrf('/api/some-endpoint', {
 *   method: 'POST',
 *   body: JSON.stringify({ data: 'value' })
 * })
 * ```
 */

let cachedToken: string | null = null
let tokenExpiry: number = 0

/**
 * Get CSRF token from the server or cache
 */
export async function getCsrfToken(forceRefresh = false): Promise<string> {
  // Return cached token if valid
  if (!forceRefresh && cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    const response = await fetch("/api/auth/csrf")

    if (!response.ok) {
      throw new Error("Failed to get CSRF token")
    }

    const data = await response.json()

    if (!data.token) {
      throw new Error("No token in response")
    }

    // Cache token for 50 minutes (token expires in 60 minutes)
    cachedToken = data.token
    tokenExpiry = Date.now() + 50 * 60 * 1000

    return data.token
  } catch (error) {
    console.error("[CSRF] Failed to get token", error)
    throw error
  }
}
/**
 * Fetch with automatic CSRF token injection for state-changing operations
 *
 * This function automatically:
 * - Gets a CSRF token if the request method is POST, PUT, PATCH, or DELETE
 * - Injects the token into the request body
 * - Retries once with a fresh token if the request fails with 403
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || "GET"

  // Only apply CSRF protection to state-changing operations
  const requiresCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method)

  if (!requiresCsrf) {
    return fetch(url, options)
  }

  try {
    // Get CSRF token
    const csrfToken = await getCsrfToken()

    // Parse existing body if present
    let body = options.body
    if (body && typeof body === "string") {
      try {
        const bodyData = JSON.parse(body)
        bodyData.csrfToken = csrfToken
        body = JSON.stringify(bodyData)
      } catch {
        // If body is not JSON, create a new JSON body
        body = JSON.stringify({ csrfToken })
      }
    } else {
      // No body, create one with just the token
      body = JSON.stringify({ csrfToken })
    }

    // Make the request
    const response = await fetch(url, {
      ...options,
      body,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    // If we get a 403, try once more with a fresh token
    if (response.status === 403) {
      const freshToken = await getCsrfToken(true)

      // Re-parse body and inject fresh token
      const bodyData = JSON.parse(body as string)
      bodyData.csrfToken = freshToken
      body = JSON.stringify(bodyData)

      return fetch(url, {
        ...options,
        body,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      })
    }

    return response
  } catch (error) {
    console.error("[CSRF] Fetch with CSRF failed", { url, error })
    throw error
  }
}

