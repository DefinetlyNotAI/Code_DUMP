# Password Setup Script

## Quick Start

Run the interactive password setup:

```bash
npm run setup-password
```

Or directly:

```bash
node scripts/setup-password.js
```

## What It Does

The script will:

1. ✅ Ask you to enter your desired master password
2. ✅ Ask you to confirm the password
3. ✅ Generate a secure bcrypt hash (using 10 salt rounds)
4. ✅ Automatically update the `.env` file with the new hash
5. ✅ Run comprehensive tests to ensure everything works:
    - Verifies the hash with bcrypt
    - Re-reads the .env file to confirm it was updated
    - Tests that the password matches the hash from .env

## Security Notes

- The password is **never** logged or saved to disk (only the hash is saved)
- Bcrypt is intentionally slow (takes a few seconds) - this prevents brute-force attacks
- The hash is different each time you run it with the same password (this is normal and secure!)
- Keep your `.env` file secure and never commit it to git

## Example Output

```
╔════════════════════════════════════════════════════════════╗
║         WESMUN EMAIL - Master Password Setup              ║
╚════════════════════════════════════════════════════════════╝

Step 1: Enter your desired master password
(This will be used to login to the email dashboard)

Enter password: ********
✓ Passwords match!

Step 2: Generating bcrypt hash...
✓ Hash generated successfully!

Step 3: Updating .env file...
✓ .env file updated successfully!

Step 4: Testing password verification...
  ✓ Password verification successful!
  ✓ .env file contains correct hash!
  ✓ Password matches hash from .env!

╔════════════════════════════════════════════════════════════╗
║                    ✓ SUCCESS!                             ║
╚════════════════════════════════════════════════════════════╝
```

## Troubleshooting

### Script won't run

- Make sure you have Node.js installed
- Make sure you're in the project directory
- Make sure dependencies are installed: `npm install`

### "Password is very short" warning

- Use at least 6 characters (preferably 12+ for better security)
- You can bypass the warning by typing 'y' when prompted

### ".env file not found" error

- Make sure you're running the script from the project root
- Make sure the `.env` file exists in the project root

## After Setup

1. Restart your Next.js development server:
   ```bash
   # Stop the server (Ctrl+C if running)
   npm run dev
   ```

2. Navigate to the login page

3. Login with your new password

## Related Scripts

- `password_gen.js` - Simple password hash generator (non-interactive)
- `setup-password.js` - This interactive setup script (recommended)

