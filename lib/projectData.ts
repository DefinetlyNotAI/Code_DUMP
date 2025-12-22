import type {Project} from "@/types/types"

export const projects: Project[] = [
    {
        slug: "wesmun-email",
        title: "WESMUN Email",
        description: "Read-only Web-based email client platform for WESMUN with authenticated access, account-scoped mailboxes, and attachment handling.",
        visitLink: "https://email.wesmun.com",
        routes: [
            {
                path: "/",
                title: "Inbox",
                description: "Main email client interface showing folders and messages."
            },
            {
                path: "/login",
                title: "Login",
                description: "User authentication page for accessing WESMUN Email."
            },
            {
                path: "/api/accounts",
                title: "Accounts API",
                description: "Lists and manages available email accounts."
            },
            {
                path: "/api/auth/csrf",
                title: "CSRF Token API",
                description: "Issues CSRF tokens for secure authentication requests."
            },
            {
                path: "/api/auth/login",
                title: "Login API",
                description: "Handles user login and session creation."
            },
            {
                path: "/api/auth/logout",
                title: "Logout API",
                description: "Terminates the current user session."
            }
        ]
    },
    {
        slug: "nfc-wesmun",
        title: "NFC WESMUN",
        description: "NFC-based system used by WESMUN to track and manage participants and staff data securely and efficiently.",
        visitLink: "https://nfc.wesmun.com",
        routes: [
            {
                path: "/",
                title: "Home",
                description: "Main landing page for NFC WESMUN."
            },
            {
                path: "/auth/signin",
                title: "Sign In",
                description: "User sign-in page for accessing the NFC system."
            },
            {
                path: "/admin",
                title: "Admin Dashboard",
                description: "Administration panel for managing users and system settings."
            },
            {
                path: "/api/admin/approve-user",
                title: "Approve User API",
                description: "Endpoint to approve pending user registrations."
            },
            {
                path: "/api/admin/pending-users/test",
                title: "Pending Users API",
                description: "Lists users awaiting approval in the admin panel."
            },
            {
                path: "/api/audit/test",
                title: "Audit Logs API",
                description: "Retrieves system audit logs for monitoring and review."
            },
            {
                path: "/api/audit/bulk-delete",
                title: "Bulk Delete Audit API",
                description: "Deletes multiple audit log entries at once."
            },
            {
                path: "/api/auth/login",
                title: "Login API",
                description: "Handles user login and session creation."
            },
            {
                path: "/api/auth/logout",
                title: "Logout API",
                description: "Terminates the current user session."
            },
            {
                path: "/api/auth/register",
                title: "Register API",
                description: "Registers new users in the NFC system."
            },
            {
                path: "/api/auth/validate/test",
                title: "Validate API",
                description: "Validates user authentication tokens or credentials."
            },
            {
                path: "/api/nfc-links",
                title: "NFC Links API",
                description: "Lists all NFC links associated with users."
            },
            {
                path: "/api/users/test",
                title: "Users API",
                description: "Fetches and manages all user accounts."
            },
            {
                path: "/api/users/bulk-delete",
                title: "Bulk Delete Users API",
                description: "Deletes multiple user accounts at once."
            },
            {
                path: "/api/users/bulk-update",
                title: "Bulk Update Users API",
                description: "Updates multiple user accounts at once."
            },
            {
                path: "/api/users/create-data-only",
                title: "Create Data Only API",
                description: "Creates user records without NFC assignment."
            },
            {
                path: "/api/users/create-data-only/bulk",
                title: "Bulk Create Data Only API",
                description: "Creates multiple user records without NFC assignment."
            },
            {
                path: "/api/users/export/test",
                title: "Export Users API",
                description: "Exports user data for reporting or backup purposes."
            },
            {
                path: "/audit",
                title: "Audit Page",
                description: "Frontend interface for viewing audit logs."
            },
            {
                path: "/scan",
                title: "Scan Page",
                description: "Interface for scanning NFC tags and retrieving user information."
            },
            {
                path: "/users",
                title: "Users Page",
                description: "Frontend view for browsing and managing users."
            }
        ]
    },
    {
        slug: "wesmun-website",
        title: "WESMUN Website",
        description: "Public-facing website for WESMUN, allowing visitors to view committees, departments, FAQs, and sign up for participation.",
        visitLink: "https://wesmun.com",
        routes: [
            {
                path: "/",
                title: "Home",
                description: "Landing page with general information and navigation."
            },
            {
                path: "/committees",
                title: "Committees Overview",
                description: "Lists all WESMUN committees and links to individual committee pages."
            },
            {
                path: "/committees/unicef",
                title: "UNICEF (Junior)",
                description: "Focuses on children's rights, education, and humanitarian response."
            },
            {
                path: "/committees/who",
                title: "World Health Organization",
                description: "Global health initiatives, disease prevention, and international health crises."
            },
            {
                path: "/committees/unhrc",
                title: "United Nations Human Rights Council",
                description: "Promotes and protects human rights globally through dialogue and monitoring."
            },
            {
                path: "/committees/ga3",
                title: "General Assembly Third Committee",
                description: "Handles social, humanitarian, and cultural issues including human rights and social development."
            },
            {
                path: "/committees/f1",
                title: "Formula 1 Committee",
                description: "Simulates governance and ethical discussions within the Formula 1 world."
            },
            {
                path: "/committees/ga1",
                title: "General Assembly First Committee",
                description: "Focuses on international peace, security, disarmament, and weapons regulation."
            },
            {
                path: "/committees/arab-league",
                title: "Arab League",
                description: "Regional committee addressing unity, stability, and development in the Arab world."
            },
            {
                path: "/committees/unodc",
                title: "United Nations Office on Drugs and Crime",
                description: "Combats drugs, crime, corruption, and terrorism through international cooperation."
            },
            {
                path: "/committees/unw",
                title: "United Nations Women",
                description: "Advocates for gender equality and the empowerment of women globally."
            },
            {
                path: "/committees/ecosoc",
                title: "Economic and Social Council",
                description: "Coordinates UN economic, social, and development activities globally."
            },
            {
                path: "/committees/unoosa",
                title: "United Nations Office for Outer Space Affairs",
                description: "Promotes peaceful use and exploration of outer space and international cooperation."
            },
            {
                path: "/committees/unsc",
                title: "United Nations Security Council",
                description: "Maintains international peace and security with authority to make binding resolutions."
            },
            {
                path: "/committees/pbc",
                title: "Peacebuilding Commission",
                description: "Supports peace efforts and coordinates international aid in post-conflict countries."
            },
            {
                path: "/committees/interpol",
                title: "INTERPOL",
                description: "CLASSIFIED committee handling sensitive international law enforcement topics."
            },
            {
                path: "/committees/hcc",
                title: "Historical Crisis Committee",
                description: "CLASSIFIED committee simulating historical crises with advanced decision-making challenges."
            },
            {
                path: "/contact",
                title: "Contact Page",
                description: "Page with contact information and form for inquiries."
            },
            {
                path: "/departments",
                title: "Departments Overview",
                description: "Page listing all WESMUN departments and their responsibilities."
            },
            {
                path: "/faqs",
                title: "FAQs",
                description: "Frequently asked questions about WESMUN and participation."
            },
            {
                path: "/sign-up",
                title: "Sign Up",
                description: "Page for new participants to register and join WESMUN."
            }
        ]
    },
    {
        slug: "bank-system",
        title: "Hackathon Bank System",
        description: "A banking platform with public, user, and admin routes, handling wallets, requests, and transfers with detailed API endpoints for hackathon use (Fake money for competition purposes).",
        visitLink: "https://flask-bank.vercel.app",
        routes: [
            // Public Routes
            { path: "/", title: "Home", description: "Main landing page for the banking system." },
            { path: "/setup", title: "Setup", description: "Setup page to initialize the bank system (GET, POST)." },
            { path: "/login", title: "Login", description: "Login page for users to access the system (GET, POST)." },
            { path: "/logout", title: "Logout", description: "Logs out the current user." },
            { path: "/leaderboard", title: "Leaderboard", description: "Displays the leaderboard of users or wallets." },
            { path: "/logs", title: "Public Logs", description: "Publicly accessible system logs." },

            // User Routes
            // { path: "/user/logs", title: "User Logs", description: "User's private wallet logs (login required)." },
            // { path: "/user/requests", title: "User Requests", description: "View the user's request history (login required)." },

            // API Routes
            // Setup API
            // { path: "/api/setup", title: "Setup API", description: "Initialize bank system (POST)." },
            // { path: "/api/setup/wallet", title: "Create Wallet API", description: "Create a new wallet (POST, admin required)." },
            // { path: "/api/setup/rules", title: "Update Rules API", description: "Update bank rules (POST, admin required)." },

            // Get API
            // { path: "/api/get/health", title: "Server Health API", description: "Get server health metrics (GET)." },
            // { path: "/api/get/leaderboard", title: "Leaderboard API", description: "Retrieve the leaderboard (GET)." },
            // { path: "/api/get/logs", title: "Public Logs API", description: "Retrieve public logs (GET)." },
            // { path: "/api/get/wallet/logs", title: "Wallet Logs API", description: "Get user's wallet logs (GET, login required)." },
            // { path: "/api/get/user/requests", title: "User Requests API", description: "Get user requests (GET, login required)." },
            // { path: "/api/get/walletList", title: "All Wallets API", description: "Get all wallets (GET, admin required)." },
            // { path: "/api/get/requests", title: "All Requests API", description: "Get all pending requests (GET, admin required)." },
            { path: "/api/check-database", title: "Database Check API", description: "Check database connection status (GET)." },

            // Request API
            // { path: "/api/request/wallet", title: "Request Wallet API", description: "Request creation of a new wallet (POST)." },
            // { path: "/api/request/refund", title: "Refund Request API", description: "Request a refund (POST, login required)." },
            // { path: "/api/request/resetPassword", title: "Password Reset API", description: "Request password reset (POST, login required)." },

            // Transfer API
            // { path: "/api/transfer/bank", title: "Bank Transfer API", description: "Execute a bank transfer (POST, admin required)." },

            // Admin API
            // { path: "/api/admin/burnWallet", title: "Burn Wallet API", description: "Delete a wallet permanently (POST, admin required)." },
            // { path: "/api/admin/freezeWallet", title: "Freeze Wallet API", description: "Freeze a wallet to prevent transactions (POST, admin required)." },
            // { path: "/api/admin/unfreezeWallet", title: "Unfreeze Wallet API", description: "Unfreeze a wallet (POST, admin required)." }
        ]
    }
]
