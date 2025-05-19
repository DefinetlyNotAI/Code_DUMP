import Link from "next/link"

export default function ApiDocs() {
    return (
        <main className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="text-emerald-400 hover:text-emerald-300">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl font-bold mt-4 mb-6">API Documentation</h1>
                    <p className="text-lg mb-8">Complete reference for all available endpoints in the Hackathon Banking
                        API.</p>
                </div>

                <div className="space-y-12">
                    {/* Authentication */}
                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Authentication</h2>
                        <p className="mb-4">
                            All API requests require authentication using JWT tokens except for public endpoints.
                        </p>

                        <div className="mt-6 space-y-6">
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">POST /api/auth/login</h3>
                                <p className="mb-2">Authenticate a user and receive a JWT token.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "username": "string",
  "password": "string"
}

// Response
{
  "token": "string",
  "user": {
    "id": "string",
    "username": "string",
    "role": "admin|user|guest"
  }
}`}
                  </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Bank Management */}
                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Bank Management [Admin]</h2>

                        <div className="mt-6 space-y-6">
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">POST /api/bank/setup</h3>
                                <p className="mb-2">Setup a new bank with currency name.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "bank_name": "string",
  "currency_name": "string",
  "currency_symbol": "string",
  "initial_pool_amount": "number"
}

// Response
{
  "id": "string",
  "bank_name": "string",
  "currency_name": "string",
  "currency_symbol": "string",
  "pool_amount": "number",
  "created_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">POST /api/bank/rules</h3>
                                <p className="mb-2">Setup bank rules.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "transaction_limit": "number",
  "require_approval": "boolean",
  "allow_refunds": "boolean",
  "default_wallet_balance": "number"
}

// Response
{
  "id": "string",
  "transaction_limit": "number",
  "require_approval": "boolean",
  "allow_refunds": "boolean",
  "default_wallet_balance": "number",
  "updated_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Wallet Management */}
                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Wallet Management</h2>

                        <div className="mt-6 space-y-6">
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">POST /api/wallets [Admin]</h3>
                                <p className="mb-2">Create a new wallet.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "user_id": "string",
  "initial_balance": "number",
  "name": "string"
}

// Response
{
  "id": "string",
  "user_id": "string",
  "balance": "number",
  "name": "string",
  "status": "active",
  "created_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">GET /api/wallets/:id [Admin, User, Guest]</h3>
                                <p className="mb-2">Get wallet balance and details.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Response
{
  "id": "string",
  "user_id": "string",
  "balance": "number",
  "name": "string",
  "status": "active|frozen|burned",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">PATCH /api/wallets/:id/status [Admin]</h3>
                                <p className="mb-2">Freeze, unfreeze or burn a wallet.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "status": "active|frozen|burned",
  "reason": "string"
}

// Response
{
  "id": "string",
  "status": "active|frozen|burned",
  "updated_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">PATCH /api/wallets/:id/reset [Admin]</h3>
                                <p className="mb-2">Reset wallet balance.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "new_balance": "number",
  "reason": "string"
}

// Response
{
  "id": "string",
  "balance": "number",
  "updated_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Transactions */}
                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Transactions</h2>

                        <div className="mt-6 space-y-6">
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">POST /api/transactions [Admin, User]</h3>
                                <p className="mb-2">Create a new transaction.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "from_wallet_id": "string",
  "to_wallet_id": "string",
  "amount": "number",
  "category": "reward|penalty|trade|other",
  "reason": "string",
  "idempotency_key": "string"
}

// Response
{
  "id": "string",
  "from_wallet_id": "string",
  "to_wallet_id": "string",
  "amount": "number",
  "category": "reward|penalty|trade|other",
  "reason": "string",
  "status": "pending|complete|cancelled|refunded",
  "created_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">PATCH /api/transactions/:id/status [Admin]</h3>
                                <p className="mb-2">Approve, cancel or refund a transaction.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "status": "complete|cancelled|refunded",
  "reason": "string"
}

// Response
{
  "id": "string",
  "status": "complete|cancelled|refunded",
  "updated_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">POST /api/transactions/:id/refund-request
                                    [Admin, User]</h3>
                                <p className="mb-2">Request a refund for a transaction.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "reason": "string"
}

// Response
{
  "id": "string",
  "transaction_id": "string",
  "reason": "string",
  "status": "pending",
  "created_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">GET /api/transactions/public [Admin, User,
                                    Guest]</h3>
                                <p className="mb-2">Get public transaction logs.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Response
{
  "transactions": [
    {
      "id": "string",
      "from_wallet_id": "string",
      "to_wallet_id": "string",
      "amount": "number",
      "category": "reward|penalty|trade|other",
      "status": "complete|cancelled|refunded",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">GET /api/transactions/user [Admin, User]</h3>
                                <p className="mb-2">Get private user transaction logs.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Response
{
  "transactions": [
    {
      "id": "string",
      "from_wallet_id": "string",
      "to_wallet_id": "string",
      "amount": "number",
      "category": "reward|penalty|trade|other",
      "reason": "string",
      "status": "pending|complete|cancelled|refunded",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}`}
                  </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Currency Pool */}
                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Currency Pool</h2>

                        <div className="mt-6 space-y-6">
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">GET /api/currency/pool [Admin, User,
                                    Guest]</h3>
                                <p className="mb-2">Get global currency pool information.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Response
{
  "total_supply": "number",
  "in_circulation": "number",
  "free_pool": "number",
  "currency_name": "string",
  "currency_symbol": "string"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">POST /api/currency/mint [Admin]</h3>
                                <p className="mb-2">Mint new currency (add to global pool).</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "amount": "number",
  "reason": "string"
}

// Response
{
  "id": "string",
  "amount": "number",
  "new_total_supply": "number",
  "created_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">POST /api/currency/burn [Admin]</h3>
                                <p className="mb-2">Burn currency from the free pool.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "amount": "number",
  "reason": "string"
}

// Response
{
  "id": "string",
  "amount": "number",
  "new_total_supply": "number",
  "created_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Leaderboard */}
                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>

                        <div className="mt-6 space-y-6">
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">GET /api/leaderboard [Admin, User, Guest]</h3>
                                <p className="mb-2">Get wallet leaderboard.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Response
{
  "leaderboard": [
    {
      "wallet_id": "string",
      "name": "string",
      "balance": "number",
      "rank": "number"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}`}
                  </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* User Management */}
                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">User Management</h2>

                        <div className="mt-6 space-y-6">
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">POST /api/users/password-reset-request
                                    [User]</h3>
                                <p className="mb-2">Request wallet password reset.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "user_id": "string",
  "reason": "string"
}

// Response
{
  "id": "string",
  "status": "pending",
  "created_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>

                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">PATCH /api/users/password-reset/:id
                                    [Admin]</h3>
                                <p className="mb-2">Accept password reset request.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Request
{
  "status": "approved|rejected",
  "reason": "string"
}

// Response
{
  "id": "string",
  "status": "approved|rejected",
  "updated_at": "timestamp"
}`}
                  </pre>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Audit Logs */}
                    <section className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-4">Audit Logs [Admin]</h2>

                        <div className="mt-6 space-y-6">
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-xl font-medium mb-2">GET /api/logs/audit</h3>
                                <p className="mb-2">Get audit logs and admin related logs.</p>
                                <div className="bg-gray-900 p-4 rounded-md mb-4">
                  <pre className="text-sm overflow-x-auto">
                    {`// Response
{
  "logs": [
    {
      "id": "string",
      "action": "string",
      "entity_type": "string",
      "entity_id": "string",
      "user_id": "string",
      "details": "object",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}`}
                  </pre>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}
