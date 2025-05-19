import Link from "next/link"

export default function GettingStarted() {
    return (
        <main className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="text-emerald-400 hover:text-emerald-300">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold mt-4 mb-6">Getting Started</h1>
                    <p className="text-lg mb-8">
                        Follow this guide to set up and use the Hackathon Banking API for your project.
                    </p>
                </div>

                <div className="space-y-10">
                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Prerequisites</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Python 3.8 or higher</li>
                            <li>PostgreSQL database</li>
                            <li>Git</li>
                        </ul>
                    </section>

                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Installation</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-medium mb-2">1. Clone the repository</h3>
                                <div className="bg-gray-900 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    git clone https://github.com/yourusername/hackathon-banking-api.git cd hackathon-banking-api
                  </pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium mb-2">2. Create a virtual environment</h3>
                                <div className="bg-gray-900 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    python -m venv venv source venv/bin/activate # On Windows: venv\Scripts\activate
                  </pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium mb-2">3. Install dependencies</h3>
                                <div className="bg-gray-900 p-4 rounded-md">
                                    <pre className="text-sm overflow-x-auto">pip install -r requirements.txt</pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium mb-2">4. Set up environment variables</h3>
                                <p className="mb-2">Create a .env file in the root directory with the following:</p>
                                <div className="bg-gray-900 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    POSTGRESQL_DB_URL=postgresql://username:password@localhost:5432/banking_db
                    JWT_SECRET=your_jwt_secret_key FLASK_ENV=development
                  </pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium mb-2">5. Initialize the database</h3>
                                <div className="bg-gray-900 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    flask db init flask db migrate -m "Initial migration" flask db upgrade
                  </pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium mb-2">6. Create an admin user</h3>
                                <div className="bg-gray-900 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    flask create-admin --username admin --password secure_password
                  </pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium mb-2">7. Run the server</h3>
                                <div className="bg-gray-900 p-4 rounded-md">
                                    <pre className="text-sm overflow-x-auto">flask run</pre>
                                </div>
                                <p className="mt-2">The API will be available at http://localhost:5000</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Basic Usage</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-medium mb-2">1. Authentication</h3>
                                <p className="mb-2">First, authenticate to get your JWT token:</p>
                                <div className="bg-gray-900 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    {`curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "admin", "password": "secure_password"}'`}
                  </pre>
                                </div>
                                <p className="mt-2">Save the token from the response for subsequent requests.</p>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium mb-2">2. Set up a bank</h3>
                                <p className="mb-2">Create your bank and currency:</p>
                                <div className="bg-gray-900 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    {`curl -X POST http://localhost:5000/api/bank/setup \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "bank_name": "Hackathon Bank",
    "currency_name": "HackCoin",
    "currency_symbol": "HC",
    "initial_pool_amount": 1000000
  }'`}
                  </pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium mb-2">3. Create a wallet</h3>
                                <p className="mb-2">Create a wallet for a user:</p>
                                <div className="bg-gray-900 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    {`curl -X POST http://localhost:5000/api/wallets \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "user_id": "user123",
    "initial_balance": 1000,
    "name": "User Wallet"
  }'`}
                  </pre>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-medium mb-2">4. Make a transaction</h3>
                                <p className="mb-2">Transfer currency between wallets:</p>
                                <div className="bg-gray-900 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto">
                    {`curl -X POST http://localhost:5000/api/transactions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "from_wallet_id": "wallet1",
    "to_wallet_id": "wallet2",
    "amount": 100,
    "category": "trade",
    "reason": "Payment for services",
    "idempotency_key": "unique-transaction-id-123"
  }'`}
                  </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                Check out the{" "}
                                <Link href="/api-docs" className="text-emerald-400 hover:text-emerald-300">
                                    API Documentation
                                </Link>{" "}
                                for all available endpoints
                            </li>
                            <li>Explore the source code to understand the implementation details</li>
                            <li>Build your frontend application using the API</li>
                            <li>Customize the API to fit your specific hackathon needs</li>
                        </ul>
                    </section>
                </div>
            </div>
        </main>
    )
}
