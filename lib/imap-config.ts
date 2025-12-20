/**
 * IMAP configuration management
 *
 * Security considerations:
 * - Config parsed strictly on server startup
 * - Credentials never logged or exposed to client
 * - Crashes on invalid configuration (fail-fast principle)
 * - All IMAP operations server-side only
 */
import {ImapAccount, ImapConfig} from "@/types";


let cachedConfig: ImapConfig | null = null

/**
 * Parse and validate IMAP configuration from environment variable
 * Crashes on invalid configuration (fail-fast)
 */
export function getImapConfig(): ImapConfig {
    // Return cached config if available
    if (cachedConfig) {
        return cachedConfig
    }

    console.log("[IMAP CONFIG] Reading config from IMAP_CONFIG environment variable")

    const configString = process.env.IMAP_CONFIG

    if (!configString) {
        const error = new Error("IMAP_CONFIG environment variable is not set")
        console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
            error: error.message,
            stack: error.stack,
        })
        console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
        throw error
    }

    let config: ImapConfig
    try {
        console.log("[IMAP CONFIG] Config environment variable read successfully")
        config = JSON.parse(configString) as ImapConfig
    } catch (parseError) {
        console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
            error: parseError instanceof Error ? parseError.message : "Unknown error",
            stack: parseError instanceof Error ? parseError.stack : undefined,
        })
        console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
        throw parseError
    }

    // Validate structure
    if (!config.accounts || !Array.isArray(config.accounts)) {
        const error = new Error("Invalid config: 'accounts' must be an array")
        console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
            error: error.message,
            stack: error.stack,
        })
        console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
        throw error
    }

    console.log("[IMAP CONFIG] Found", config.accounts.length, "account(s) in config")

    for (const account of config.accounts) {
        console.log("[IMAP CONFIG] Validating account:", account.id)

        if (!account.id) {
            const error = new Error(`Invalid account: missing or invalid 'id'`)
            console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
                error: error.message,
                stack: error.stack,
            })
            console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
            throw error
        }
        if (!account.label) {
            const error = new Error(`Invalid account ${account.id}: missing or invalid 'label'`)
            console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
                error: error.message,
                stack: error.stack,
            })
            console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
            throw error
        }
        if (!account.imap || typeof account.imap !== "object") {
            const error = new Error(`Invalid account ${account.id}: missing 'imap' configuration`)
            console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
                error: error.message,
                stack: error.stack,
            })
            console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
            throw error
        }

        const {host, port, user, password} = account.imap

        if (!host) {
            const error = new Error(`Invalid account ${account.id}: missing or invalid 'imap.host'`)
            console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
                error: error.message,
                stack: error.stack,
            })
            console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
            throw error
        }
        if (port < 1 || port > 65535) {
            const error = new Error(`Invalid account ${account.id}: invalid 'imap.port'`)
            console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
                error: error.message,
                stack: error.stack,
            })
            console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
            throw error
        }

        if (!user) {
            const error = new Error(`Invalid account ${account.id}: missing or invalid 'imap.user'`)
            console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
                error: error.message,
                stack: error.stack,
            })
            console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
            throw error
        }
        if (!password) {
            const error = new Error(`Invalid account ${account.id}: missing or invalid 'imap.password'`)
            console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
                error: error.message,
                stack: error.stack,
            })
            console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
            throw error
        }

        if (password === "your-app-password" || password.includes("your-")) {
            console.warn(
                `[IMAP CONFIG] WARNING: Account ${account.id} appears to have placeholder credentials. Please update IMAP_CONFIG environment variable with real credentials.`,
            )
        }

        console.log(
            "[IMAP CONFIG] Account validated:",
            account.id,
            "| Host:",
            host,
            "| Port:",
            port,
            "| User:",
            user,
        )
    }

    console.log(`[IMAP CONFIG] Successfully loaded ${config.accounts.length} account(s)`)

    // Cache the validated config
    cachedConfig = config

    return config
}

/**
 * Get a specific account by ID
 * Returns null if not found (don't expose which accounts exist to client)
 */
export function getAccountById(accountId: string): ImapAccount | null {
    const config = getImapConfig()
    return config.accounts.find((acc) => acc.id === accountId) || null
}

/**
 * Get list of accounts (without credentials)
 * Safe to expose to authenticated clients
 */
export function getAccountList(): Array<{ id: string; label: string }> {
    const config = getImapConfig()
    return config.accounts.map((acc) => ({
        id: acc.id,
        label: acc.label,
    }))
}
