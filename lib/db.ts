import {Pool} from 'pg'
import fs from "fs"
import path from "path"

// In development with Next.js, modules may be reloaded multiple times creating many Pool instances.
// Store a singleton on globalThis to avoid exhausting Postgres connection limits.

const caPath = path.join(process.cwd(), 'certs', 'ca.pem')
const ca = fs.existsSync(caPath) ? fs.readFileSync(caPath).toString() : undefined

const poolConfig: any = {
    connectionString: process.env.POSTGRES_URL,
    max: process.env.POSTGRES_MAX_CLIENTS ? Number(process.env.POSTGRES_MAX_CLIENTS) : 10,
}

if (ca) {
    poolConfig.ssl = {rejectUnauthorized: true, ca}
}

// Use a typed alias to avoid TypeScript complaining about indexing global
const g = global as unknown as { __dbPool?: Pool }

if (!g.__dbPool) {
    g.__dbPool = new Pool(poolConfig)
}

export const dbPool = g.__dbPool

// Graceful shutdown: ensure the pool is closed on process exit signals
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
