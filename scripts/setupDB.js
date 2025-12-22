'use strict'

const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, '../.env')
})

const {Client} = require('pg')
const fs = require('fs')

async function main() {
    const connectionString = process.env.POSTGRES_URL

    if (!connectionString) {
        console.error('Error: POSTGRES_URL environment variable is not set.')
        console.error('Example:')
        console.error("$env:POSTGRES_URL = 'postgresql://user:pass@host:5432/dbname?sslmode=require'")
        process.exit(1)
    }

    // Try to read CA cert if present (repo includes certs/ca.pem)
    const caPath = path.resolve(__dirname, '../certs/ca.pem')
    let ssl = false
    if (fs.existsSync(caPath)) {
        try {
            const ca = fs.readFileSync(caPath).toString()
            ssl = {rejectUnauthorized: true, ca}
            console.log('Using CA cert at', caPath)
        } catch (err) {
            console.warn('Failed to read CA cert at', caPath, '-', err.message)
            ssl = false
        }
    } else {
        console.warn('No CA cert found at', caPath, '- proceeding without custom CA (verify your connection)')
    }

    const client = new Client({connectionString, ssl})

    try {
        await client.connect()
        console.log('Connected to database')

        // Create status_logs table
        const createTable = `
            CREATE TABLE IF NOT EXISTS status_logs
            (
                id           BIGSERIAL PRIMARY KEY,
                project_slug TEXT        NOT NULL,
                route_path   TEXT        NOT NULL,
                status_code  INTEGER     NOT NULL,
                response_time INTEGER    NULL,
                created_at   timestamptz NOT NULL DEFAULT now()
            );
        `

        const createIndex = `
            CREATE INDEX IF NOT EXISTS idx_status_logs_project_route_created_at
                ON status_logs (project_slug, route_path, created_at DESC);
        `

        console.log('Creating table status_logs (if not exists)')
        await client.query(createTable)
        console.log('Creating index idx_status_logs_project_route_created_at (if not exists)')
        await client.query(createIndex)

        console.log('Database setup complete')
    } catch (err) {
        console.error('Database setup failed:', err)
        process.exitCode = 1
    } finally {
        await client.end()
    }
}

if (require.main === module) {
    main().catch(console.error)
}
