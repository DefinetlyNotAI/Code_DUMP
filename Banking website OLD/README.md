> [!IMPORTANT]
> Don't use this, it is OUTDATED, UNTESTED and USELESS, [use this instead](https://github.com/DefinetlyNotAI/FlaskBank) as it is my proper attempt of a bank app, with security in mind as well as simplicity - Used in many of the hackathons I organised.

> [!IMPORTANT]
> Even in this archive, v0.1 (which lemme be honest was a absolute mess and was me actually "learning" coding at the time for react etc, which is why it has been removed from the main branch, if you wish to check the absolute code mess, you can check this [commit](https://github.com/DefinetlyNotAI/Code_DUMP/tree/50fc5a5db749e6916eabf51fee76a1c47220e949/Banking%20website%20OLD/v0.1)

# Hackathon Banking API

A ready-to-use banking API server for hackathon projects. This Flask-based API provides a comprehensive set of features
for managing virtual currencies, wallets, and transactions.

## Features

- **Bank/Currency Management**
    - Setup new bank/currency name
    - Configure bank rules
    - Mint and burn currency

- **Wallet Operations**
    - Create new wallets
    - View wallet balances
    - Freeze, unfreeze, or burn wallets
    - Reset wallet balances

- **Transaction Processing**
    - Currency transfers with idempotency support
    - Transaction categorization
    - Transaction approval workflow
    - Refund requests

- **Role-Based Access Control**
    - Admin, User, and Guest roles
    - Proper permission enforcement

- **Reporting**
    - Public transaction logs
    - Private user logs
    - Audit logs for admin actions
    - Wallet leaderboard

- **User Management**
    - Password reset requests
    - User authentication

## Getting Started

### Prerequisites

- Python 3.8 or higher
- PostgreSQL database
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/DefinetlyNotAI/Code_DUMP.git
   ```
    Then `cd` to the directory.

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a .env file in the root directory with:
   ```
   POSTGRESQL_DB_URL=postgresql://username:password@localhost:5432/banking_db
   JWT_SECRET=your_jwt_secret_key
   FLASK_ENV=development
   ```

5. Initialize the database:
   ```
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

6. Create an admin user:
   ```
   flask create-admin --username admin --password secure_password
   ```

7. Run the server:
   ```
   flask run
   ```

The API will be available at http://localhost:5000

## API Documentation

For detailed API documentation, see the [API Documentation](https://your-deployed-app.com/api-docs) page.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
