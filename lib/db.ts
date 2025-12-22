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

const poolConfig: any = {
    connectionString: settings.db.url ?? undefined,
    max: settings.db.maxClients,
    // Connection pool settings to prevent exhaustion
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Wait max 10 seconds for a connection from the pool
    allowExitOnIdle: settings.db.allowExitOnIdle,
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
}

export const dbPool = g.__dbPool

// Graceful shutdown: ensure the pool is closed on process exit signals
// Register these listeners only once to avoid MaxListenersExceededWarning when Next reloads modules
if (!g.__dbPoolShutdownRegistered) {
    const shutdown = async () => {
        try {
            if (g.__dbPool) {
                await g.__dbPool.end()
            }
        } catch (err) {
            // ignore
        }
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    process.on('exit', shutdown)

    g.__dbPoolShutdownRegistered = true
}
