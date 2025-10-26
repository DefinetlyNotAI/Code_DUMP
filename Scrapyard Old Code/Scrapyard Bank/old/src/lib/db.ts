import {Pool} from 'pg';

const pool = new Pool({
    connectionString: 'SECRET REVOKED REDACTED',
    ssl: {
        rejectUnauthorized: false
    }
});

export const query = async (text: string, params?: any[]) => {
    try {
        return pool.query(text, params);
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
};

export default pool;