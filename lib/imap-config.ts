/**
 * IMAP configuration management
 *
 * Security considerations:
 * - Config parsed strictly on server startup
 * - Credentials never logged or exposed to client
 * - Crashes on invalid configuration (fail-fast principle)
 * - All IMAP operations server-side only
 */


export interface ImapCredentials {
    host: string
    port: number
    secure: boolean
    user: string
    password: string
}

export interface ImapAccount {
    id: string
    label: string
    imap: ImapCredentials
}

export interface ImapConfig {
    accounts: ImapAccount[]
}

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

    try {
        console.log("[IMAP CONFIG] Reading config from IMAP_CONFIG environment variable")

        const configString = process.env.IMAP_CONFIG

        if (!configString) {
            throw new Error("IMAP_CONFIG environment variable is not set")
        }

        console.log("[IMAP CONFIG] Config environment variable read successfully")
        const config = JSON.parse(configString) as ImapConfig

        // Validate structure
        if (!config.accounts || !Array.isArray(config.accounts)) {
            throw new Error("Invalid config: 'accounts' must be an array")
        }

        console.log("[IMAP CONFIG] Found", config.accounts.length, "account(s) in config")

        for (const account of config.accounts) {
            console.log("[IMAP CONFIG] Validating account:", account.id)

            if (!account.id) {
                throw new Error(`Invalid account: missing or invalid 'id'`)
            }
            if (!account.label) {
                throw new Error(`Invalid account ${account.id}: missing or invalid 'label'`)
            }
            if (!account.imap || typeof account.imap !== "object") {
                throw new Error(`Invalid account ${account.id}: missing 'imap' configuration`)
            }

            const {host, port, secure, user, password} = account.imap

            if (!host) {
                throw new Error(`Invalid account ${account.id}: missing or invalid 'imap.host'`)
            }
            if (port < 1 || port > 65535) {
                throw new Error(`Invalid account ${account.id}: invalid 'imap.port'`)
            }

            if (!user) {
                throw new Error(`Invalid account ${account.id}: missing or invalid 'imap.user'`)
            }
            if (!password) {
                throw new Error(`Invalid account ${account.id}: missing or invalid 'imap.password'`)
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
    } catch (error) {
        console.error("[IMAP CONFIG] Failed to parse IMAP_CONFIG environment variable", {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
        })
        console.error("[IMAP CONFIG] PLEASE UPDATE IMAP_CONFIG environment variable with your real IMAP credentials")
        throw error
    }
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
