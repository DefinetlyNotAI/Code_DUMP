// noinspection ExceptionCaughtLocallyJS,JSCheckFunctionSignatures

/**
 * Interactive Password Setup Script
 *
 * This script will:
 * 1. Ask you for your desired master password
 * 2. Generate a bcrypt hash
 * 3. Update the .env file automatically
 * 4. Test that everything works correctly
 */

import bcrypt from 'bcryptjs';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

function question(rl, query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║         WESMUN EMAIL - Master Password Setup               ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

    const rl = createInterface();

    try {
        // Step 1: Get password from user
        log('Step 1: Enter your desired master password', 'bright');
        log('(This will be used to login to the email dashboard)\n', 'blue');

        const password = await question(rl, 'Enter password: ');

        if (!password || password.trim().length === 0) {
            log('\n✗ Error: Password cannot be empty!', 'red');
            rl.close();
            process.exit(1);
        }

        if (password.length < 6) {
            log('\n⚠ Warning: Password is very short. Consider using a longer password for better security.', 'yellow');
            const confirm = await question(rl, 'Continue anyway? (y/n): ');
            if (confirm.toLowerCase() !== 'y') {
                log('\nSetup cancelled.', 'yellow');
                rl.close();
                process.exit(0);
            }
        }

        // Step 2: Confirm password
        log('\nStep 2: Confirm your password', 'bright');
        const confirmPassword = await question(rl, 'Re-enter password: ');

        if (password !== confirmPassword) {
            log('\n✗ Error: Passwords do not match!', 'red');
            rl.close();
            process.exit(1);
        }

        log('\n✓ Passwords match!', 'green');

        // Step 3: Generate hash
        log('\nStep 3: Generating bcrypt hash...', 'bright');
        log('(This may take a few seconds - bcrypt is intentionally slow for security)', 'blue');

        const hash = await bcrypt.hash(password, 10);

        log('✓ Hash generated successfully!', 'green');
        log(`\nGenerated hash: ${colors.cyan}${hash}${colors.reset}\n`);

        // Step 4: Update .env file
        log('Step 4: Updating .env file...', 'bright');

        const envPath = path.join(__dirname, '..', '.env');

        if (!fs.existsSync(envPath)) {
            log('✗ Error: .env file not found!', 'red');
            log(`Expected location: ${envPath}`, 'red');
            rl.close();
            process.exit(1);
        }

        // Read current .env file
        let envContent = fs.readFileSync(envPath, 'utf8');

        // Replace the hash line
        const hashRegex = /^MASTER_PASSWORD_BCRYPT_HASH=.*/m;
        if (hashRegex.test(envContent)) {
            envContent = envContent.replace(hashRegex, `MASTER_PASSWORD_BCRYPT_HASH=${hash}`);
            log('✓ Found and updated existing MASTER_PASSWORD_BCRYPT_HASH', 'green');
        } else {
            // Add it if it doesn't exist
            envContent = `MASTER_PASSWORD_BCRYPT_HASH=${hash}\n` + envContent;
            log('✓ Added MASTER_PASSWORD_BCRYPT_HASH to .env', 'green');
        }

        // Write back to .env
        fs.writeFileSync(envPath, envContent, 'utf8');
        log('✓ .env file updated successfully!', 'green');

        // Step 5: Verify everything works
        log('\nStep 5: Testing password verification...', 'bright');

        // Test 1: Verify the hash works with bcrypt
        log('  Test 1: Verifying hash with bcrypt.compare...', 'blue');
        const isValid = await bcrypt.compare(password, hash);
        if (isValid) {
            log('  ✓ Password verification successful!', 'green');
        } else {
            log('  ✗ Password verification failed!', 'red');
            throw new Error('Hash verification failed');
        }

        // Test 2: Re-read .env and verify
        log('  Test 2: Re-reading .env file and verifying...', 'blue');
        const updatedEnvContent = fs.readFileSync(envPath, 'utf8');
        const hashMatch = updatedEnvContent.match(/^MASTER_PASSWORD_BCRYPT_HASH=(.*)$/m);
        if (hashMatch && hashMatch[1] === hash) {
            log('  ✓ .env file contains correct hash!', 'green');
        } else {
            log('  ✗ .env file hash mismatch!', 'red');
            log(`  Expected: ${hash}`, 'red');
            log(`  Found: ${hashMatch ? hashMatch[1] : 'nothing'}`, 'red');
            throw new Error('.env file verification failed');
        }

        // Test 3: Verify the hash from .env works (unescape for verification)
        log('  Test 3: Verifying password against hash from .env...', 'blue');
        const envHash = hashMatch[1].replace(/\\\$/g, '$'); // Unescape for bcrypt
        const envHashValid = await bcrypt.compare(password, envHash);
        if (envHashValid) {
            log('  ✓ Password matches hash from .env!', 'green');
        } else {
            log('  ✗ Password does not match hash from .env!', 'red');
            throw new Error('Environment hash verification failed');
        }

        // Success!
        log('\n╔════════════════════════════════════════════════════════════╗', 'green');
        log('║                    ✓ SUCCESS!                              ║', 'green');
        log('╚════════════════════════════════════════════════════════════╝', 'green');

        log('\nYour master password has been set up successfully!', 'bright');
        log('\nNext steps:', 'bright');
        log('1. Restart your Next.js development server (if running)', 'blue');
        log('   Press Ctrl+C to stop, then run: npm run dev', 'blue');
        log('2. Navigate to the login page', 'blue');
        log('3. Login with your new password', 'blue');

        log('\n⚠ Important Security Notes:', 'yellow');
        log('• Keep your password secure and do not share it', 'yellow');
        log('• The .env file contains sensitive information - never commit it to git', 'yellow');
        log('• Make sure .env is in your .gitignore file', 'yellow');

    } catch (error) {
        log(`\n✗ Error: ${error.message}`, 'red');
        log('\nSetup failed. Please try again.', 'red');
        process.exit(1);
    } finally {
        rl.close();
    }
}

main().catch(console.error);
