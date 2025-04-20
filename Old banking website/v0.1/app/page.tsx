import Link from "next/link"

export default function Home() {
    return (
        <main
            className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <div className="max-w-3xl w-full text-center">
                <h1 className="text-5xl font-bold mb-6">Hackathon Banking API</h1>
                <p className="text-xl mb-8">A ready-to-use banking API server for your hackathon projects</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4">API Documentation</h2>
                        <p className="mb-4">Explore the comprehensive API endpoints</p>
                        <Link
                            href="/api-docs"
                            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            View Documentation
                        </Link>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
                        <p className="mb-4">Learn how to set up and use the banking API</p>
                        <Link
                            href="/getting-started"
                            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Read Guide
                        </Link>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg mb-8">
                    <h2 className="text-2xl font-semibold mb-4">Features</h2>
                    <ul className="text-left grid grid-cols-1 md:grid-cols-2 gap-3">
                        <li className="flex items-start">
                            <span className="text-emerald-400 mr-2">✓</span>
                            <span>Bank/Currency Management</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-emerald-400 mr-2">✓</span>
                            <span>Wallet Operations</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-emerald-400 mr-2">✓</span>
                            <span>Transaction Processing</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-emerald-400 mr-2">✓</span>
                            <span>Admin Controls</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-emerald-400 mr-2">✓</span>
                            <span>Role-Based Access Control</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-emerald-400 mr-2">✓</span>
                            <span>Audit Logging</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-emerald-400 mr-2">✓</span>
                            <span>Currency Pool Management</span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-emerald-400 mr-2">✓</span>
                            <span>Leaderboard System</span>
                        </li>
                    </ul>
                </div>

                <div className="flex justify-center">
                    <Link
                        href="https://github.com/yourusername/hackathon-banking-api"
                        className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-md transition-colors"
                    >
                        Fork on GitHub
                    </Link>
                </div>
            </div>
        </main>
    )
}
