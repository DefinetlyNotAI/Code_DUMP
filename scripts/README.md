# Environment Setup Scripts

## Quick Start

### Complete Environment Setup (Recommended)

Run the interactive environment setup that handles everything:

```bash
npm run setup-env
```

Or directly:

```bash
node scripts/setup-env.js
```

This will set up:

- SESSION_SECRET (auto-generated)
- MASTER_PASSWORD_BCRYPT_HASH (interactive)
- IMAP_CONFIG (optional, interactive)

### Password-Only Setup

If you only need to update the password:

```bash
npm run setup-password
```

Or directly:

```bash
node scripts/setup-password.js
```

## setup-env.js - Complete Environment Setup

### What It Does

The script will:

1. ✅ Generate a SESSION_SECRET using `openssl rand -base64 32`
2. ✅ Ask you to enter your desired master password
3. ✅ Ask you to confirm the password
4. ✅ Generate a secure bcrypt hash (using 10 salt rounds) and base64 encode it
5. ✅ Ask if you want to update the IMAP configuration
6. ✅ If yes, open the current IMAP config in Notepad for editing
7. ✅ Wait for you to save and close Notepad
8. ✅ Convert the edited JSON to base64-encoded single line
9. ✅ Automatically update the `.env` file with all new values
10. ✅ Run comprehensive tests to ensure everything works

### IMAP Configuration Editing

When you choose to update the IMAP config:

1. The script decodes the current `IMAP_CONFIG` from base64
2. Formats it as readable JSON with proper line breaks
3. Saves it to a temporary `temp.json` file
4. Opens it in Notepad for you to edit
5. **You edit, save (Ctrl+S), and close Notepad**
6. The script validates the JSON
7. Converts it back to base64 in a single line
8. Updates the `.env` file
9. Cleans up the temporary file

### Example IMAP Config Format

```json
{
   "accounts": [
      {
         "id": "account1",
         "label": "Account 1",
         "imap": {
            "host": "imap.example.com",
            "port": 993,
            "secure": true,
            "user": "user@example.com",
            "password": "your-password"
         }
      }
   ]
}
```

## setup-password.js - Password-Only Setup

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

Step 3: Encoding hash to base64...
✓ Hash encoded successfully!

Step 4: Updating .env file...
✓ .env file updated successfully!

Step 5: Testing password verification...
  ✓ Password verification successful!e
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

- `setup-env.js` - **Recommended**: Complete environment setup (SESSION_SECRET + password + IMAP config)
- `setup-password.js` - Password-only setup (legacy)
- `test-password.js` - Test password verification
- `setup-password.js` - This interactive setup script (recommended)

