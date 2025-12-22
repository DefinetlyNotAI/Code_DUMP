import {Pool} from 'pg';
import fs from "fs";
import path from "path";

// Database Pool - Used for connecting to the Postgres-SQL database securely - Contains cert validation
export const dbPool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: true, // Enforce cert validation
        ca: fs.readFileSync(path.join(process.cwd(), 'certs', 'ca.pem')).toString(),
    },
});
