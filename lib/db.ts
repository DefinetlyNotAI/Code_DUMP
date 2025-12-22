import {Pool} from 'pg'
import fs from "fs"
import path from "path"
import settings, {validateServerSettings} from '@/lib/settings'

// Validate server settings and require DB URL for DB module
validateServerSettings(true)

// In development with Next.js, modules may be reloaded multiple times creating many Pool instances.
// Store a singleton on globalThis to avoid exhausting Postgres connection limits.

const caPath = path.join(process.cwd(), 'certs', 'ca.pem')
const ca = fs.existsSync(caPath) ? fs.readFileSync(caPath).toString() : undefined

// TODO Put this in settings.ts
const poolConfig: any = {
    connectionString: settings.db.url ?? undefined,
    max: 1, // Force single connection to avoid "remaining connection slots are reserved" error
    min: 0, // No minimum connections
    // Connection pool settings to prevent exhaustion
    idleTimeoutMillis: 5000, // Close idle clients after 5 seconds (aggressive cleanup)
    connectionTimeoutMillis: 10000, // Wait max 10 seconds for a connection from the pool
    allowExitOnIdle: true, // Always allow exit on idle to prevent hanging connections
    // Additional settings to ensure connection cleanup
    statement_timeout: 10000, // Kill queries that take longer than 10 seconds
    query_timeout: 10000, // Same as statement_timeout for safety
}

if (ca) {
    poolConfig.ssl = {rejectUnauthorized: true, ca}
}

// Use a typed alias to avoid TypeScript complaining about indexing global
const g = global as unknown as {
    __dbPool?: Pool
    __dbPoolShutdownRegistered?: boolean
}

if (!g.__dbPool) {
    g.__dbPool = new Pool(poolConfig)

    // Log connection acquisition and release for debugging
    g.__dbPool.on('connect', () => {
        console.log('[DB Pool] Client connected')
    })

    g.__dbPool.on('remove', () => {
        console.log('[DB Pool] Client removed')
    })

    g.__dbPool.on('error', (err) => {
        console.error('[DB Pool] Unexpected error on idle client', err)
    })
}

export const dbPool = g.__dbPool

// Graceful shutdown: ensure the pool is closed on process exit signals
// Register these listeners only once to avoid MaxListenersExceededWarning when Next reloads modules
if (!g.__dbPoolShutdownRegistered) {
    const shutdown = async () => {
        try {
            console.log('[DB Pool] Shutting down...')
            if (g.__dbPool) {
                await g.__dbPool.end()
                console.log('[DB Pool] Shutdown complete')
            }
        } catch (err) {
            console.error('[DB Pool] Error during shutdown', err)
        }
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    process.on('beforeExit', shutdown)

    g.__dbPoolShutdownRegistered = true
}
