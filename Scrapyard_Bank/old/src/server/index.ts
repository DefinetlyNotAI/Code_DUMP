import express from 'express';
import pool, {query} from '../lib/db.ts';

const app = express();
app.use(express.json());

// Get all users
app.get('/api/users', async (_req, res) => {
    try {
        const result = await query('SELECT * FROM teams_credit_card ORDER BY name');
        res.json(result.rows);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch users'});
    }
});

// Search users
app.get('/api/search-users', async (req, res) => {
    const searchTerm = req.query.term as string;
    try {
        const result = await query(
            'SELECT * FROM teams_credit_card WHERE name ILIKE $1 OR uuid::text ILIKE $1 ORDER BY name',
            [`%${searchTerm}%`]
        );
        res.json(result.rows);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({error: 'Failed to search users'});
    }
});

// Export users
app.get('/api/export-users', async (_req, res) => {
    try {
        const result = await query('SELECT * FROM teams_credit_card ORDER BY name');
        res.json(result.rows);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({error: 'Failed to export users'});
    }
});

// Get user transactions
app.get('/api/transactions/:uuid', async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM teams_transaction_history WHERE uuid = $1 ORDER BY timestamp DESC',
            [req.params.uuid]
        );
        res.json(result.rows);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({error: 'Failed to fetch transactions'});
    }
});

// Create multiple users
app.post('/api/create-users', async (req, res) => {
    const {names, initialBalance} = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const createdUsers = [];

        for (const name of names) {
            console.log(`CREATED: ${name}`);
            const result = await client.query(
                'INSERT INTO teams_credit_card (uuid, name, scraps) VALUES (gen_random_uuid(), $1, $2) RETURNING uuid, name',
                [name, initialBalance || 0]
            );

            const user = result.rows[0];
            createdUsers.push(user);

            await client.query(
                'INSERT INTO teams_transaction_history (uuid, log) VALUES ($1, $2)',
                [user.uuid, `User created with name: ${name} and initial balance: ${initialBalance || 0}`]
            );
        }

        await client.query('COMMIT');
        res.json({users: createdUsers});
    } catch (error) {
        await client.query('ROLLBACK');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        res.status(500).json({error: error.message});
    } finally {
        client.release();
    }
});

// Batch money operation
app.post('/api/batch-money', async (req, res) => {
    const {uuids, amount, reason} = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        for (const uuid of uuids) {
            await client.query(
                'UPDATE teams_credit_card SET scraps = scraps + $1 WHERE uuid = $2',
                [amount, uuid]
            );

            await client.query(
                'INSERT INTO teams_transaction_history (uuid, log) VALUES ($1, $2)',
                [uuid, `Batch operation: Added ${amount} scraps. Reason: ${reason}`]
            );
        }

        await client.query('COMMIT');
        res.json({success: true});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({error: 'Failed to process batch operation'});
    } finally {
        client.release();
    }
});

// Modify name
app.post('/api/modify-name', async (req, res) => {
    const {uuid, newName} = req.body;
    try {
        await query(
            'UPDATE teams_credit_card SET name = $1 WHERE uuid = $2',
            [newName, uuid]
        );
        await query(
            'INSERT INTO teams_transaction_history (uuid, log) VALUES ($1, $2)',
            [uuid, `Name changed to: ${newName}`]
        );
        res.json({success: true});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({error: 'Failed to update name'});
    }
});

// Buy item
app.post('/api/buy', async (req, res) => {
    const {uuid, itemBought, receiptId, cost} = req.body;
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check if user has enough balance
            const userResult = await client.query(
                'SELECT scraps FROM teams_credit_card WHERE uuid = $1',
                [uuid]
            );

            if (!userResult.rows[0] || userResult.rows[0].scraps < cost) {
                throw new Error('Insufficient balance');
            }

            // Update balance
            await client.query(
                'UPDATE teams_credit_card SET scraps = scraps - $1 WHERE uuid = $2',
                [cost, uuid]
            );

            // Log transaction
            await client.query(
                'INSERT INTO teams_transaction_history (uuid, log) VALUES ($1, $2)',
                [uuid, `Purchased ${itemBought} for ${cost} scraps (Receipt: ${receiptId})`]
            );

            await client.query('COMMIT');
            res.json({success: true});
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({error: 'Failed to process purchase'});
    }
});

// Add money
app.post('/api/gain-money', async (req, res) => {
    const {uuid, amount, reason} = req.body;
    try {
        await query(
            'UPDATE teams_credit_card SET scraps = scraps + $1 WHERE uuid = $2',
            [amount, uuid]
        );
        await query(
            'INSERT INTO teams_transaction_history (uuid, log) VALUES ($1, $2)',
            [uuid, `Added ${amount} scraps. Reason: ${reason}`]
        );
        res.json({success: true});
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({error: 'Failed to add money'});
    }
});

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Database connected successfully.');
    } catch (error) {
        console.error('❌ Failed to connect to the database:', error);
        process.exit(1); // Exit the process if the database connection fails
    }
})();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});