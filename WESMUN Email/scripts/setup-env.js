// noinspection ExceptionCaughtLocallyJS,JSCheckFunctionSignatures

/**
 * Interactive Environment Setup Script
 *
 * This script will:
 * 1. Generate a SESSION_SECRET using openssl
 * 2. Ask you for your desired master password
 * 3. Generate a bcrypt hash and base64 encode it
 * 4. Optionally allow you to update IMAP configuration
 * 5. Update the .env file automatically
 * 6. Test that everything works correctly
 */

import bcrypt from 'bcryptjs';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';
import {execSync, spawn} from 'child_process';

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
    magenta: '\x1b[35m',
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

/**
 * Validate password strength
 */
function validatePassword(password) {
    const errors = [];
    const warnings = [];

    if (!password || password.trim().length === 0) {
        errors.push('Password cannot be empty');
        return {valid: false, errors, warnings};
    }

    if (password.length < 6) {
        warnings.push('Password is very short (less than 6 characters). Consider using a longer password.');
    }

    if (password.length < 8) {
        warnings.push('Password should be at least 8 characters long for better security.');
    }

    // Check for common weak patterns
    if (/^[0-9]+$/.test(password)) {
        warnings.push('Password contains only numbers. Consider adding letters and special characters.');
    }

    if (/^[a-zA-Z]+$/.test(password)) {
        warnings.push('Password contains only letters. Consider adding numbers and special characters.');
    }

    if (/^(.)\1+$/.test(password)) {
        errors.push('Password cannot be all the same character.');
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'admin', 'qwerty', 'letmein', 'welcome'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('This is a commonly used password. Please choose a stronger one.');
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate JSON string
 */
function validateJSON(jsonString, fieldName = 'JSON') {
    const errors = [];

    if (!jsonString || jsonString.trim().length === 0) {
        errors.push(`${fieldName} cannot be empty`);
        return {valid: false, errors, parsed: null};
    }

    try {
        const parsed = JSON.parse(jsonString);

        if (typeof parsed !== 'object' || parsed === null) {
            errors.push(`${fieldName} must be a valid JSON object`);
            return {valid: false, errors, parsed: null};
        }

        return {valid: true, errors: [], parsed};
    } catch (error) {
        errors.push(`Invalid ${fieldName}: ${error.message}`);
        return {valid: false, errors, parsed: null};
    }
}

/**
 * Validate IMAP configuration
 */
function validateImapConfig(config) {
    const errors = [];
    const warnings = [];

    if (!config || typeof config !== 'object') {
        errors.push('IMAP configuration must be an object');
        return {valid: false, errors, warnings};
    }

    // Check for required fields in typical IMAP config
    const accounts = config.accounts || [];

    if (!Array.isArray(accounts)) {
        errors.push('Configuration must have an "accounts" array');
        return {valid: false, errors, warnings};
    }

    if (accounts.length === 0) {
        warnings.push('No accounts configured. Add at least one account to use the email client.');
    }

    if (Array.isArray(accounts) && accounts.length > 0) {
        accounts.forEach((account, index) => {
            const accountLabel = account.id || account.label || `Account ${index + 1}`;

            // Check for account-level required fields
            if (!account.id) {
                warnings.push(`${accountLabel}: Missing 'id' field`);
            }
            if (!account.label) {
                warnings.push(`${accountLabel}: Missing 'label' field`);
            }

            // Check for nested imap configuration object
            if (!account.imap || typeof account.imap !== 'object') {
                errors.push(`${accountLabel}: Missing 'imap' configuration object`);
                return; // Skip further validation for this account
            }

            const {host, port, user, password} = account.imap;

            // Validate imap fields
            if (!host || typeof host !== 'string') {
                warnings.push(`${accountLabel}: Missing or invalid 'imap.host' field`);
            }
            if (!port || typeof port !== 'number') {
                warnings.push(`${accountLabel}: Missing or invalid 'imap.port' field`);
            } else if (port < 1 || port > 65535) {
                errors.push(`${accountLabel}: Invalid 'imap.port' (must be between 1 and 65535)`);
            }
            if (!user || typeof user !== 'string') {
                warnings.push(`${accountLabel}: Missing or invalid 'imap.user' field`);
            }
            if (!password || typeof password !== 'string') {
                warnings.push(`${accountLabel}: Missing or invalid 'imap.password' field`);
            } else if (password.includes('your-') || password === 'placeholder') {
                warnings.push(`${accountLabel}: Password appears to be a placeholder. Update with real credentials.`);
            }

            // Check for TLS setting (optional but recommended)
            if (account.imap.tls === undefined) {
                // This is just informational, not a warning
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Wait for notepad process to close
 */
function waitForNotepadClose(filePath) {
    return new Promise((resolve, reject) => {
        const notepad = spawn('notepad.exe', [filePath], {
            stdio: 'inherit'
        });

        notepad.on('close', (code) => {
            resolve(code);
        });

        notepad.on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║         WESMUN EMAIL - Environment Setup                   ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

    const rl = createInterface();
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    const testData = {};
    let forceSetup = false; // Flag to force full setup when .env doesn't exist

    try {
        // Check if .env exists
        if (!fs.existsSync(envPath)) {
            log('ℹ .env file not found. Creating new configuration...', 'yellow');
            log(`Location: ${envPath}`, 'blue');
            envContent = '';
            forceSetup = true; // Force complete setup for new file
        } else {
            log('✓ Found existing .env file', 'green');
            // Read current .env file
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // ==========================================
        // Step 1: Generate SESSION_SECRET
        // ==========================================
        log('Step 1: Generating SESSION_SECRET', 'bright');
        log('(Using openssl rand -base64 32)\n', 'blue');

        let sessionSecret;
        try {
            sessionSecret = execSync('openssl rand -base64 32', {encoding: 'utf8'}).trim();
            log('✓ SESSION_SECRET generated successfully using openssl!', 'green');
        } catch (error) {
            log('⚠ Warning: openssl not available, using Node.js crypto fallback', 'yellow');
            try {
                const crypto = await import('crypto');
                sessionSecret = crypto.randomBytes(32).toString('base64');
                log('✓ SESSION_SECRET generated successfully using Node.js crypto!', 'green');
            } catch (cryptoError) {
                log('✗ Error generating SESSION_SECRET', 'red');
                throw cryptoError;
            }
        }

        log(`Generated secret: ${colors.cyan}${sessionSecret}${colors.reset}\n`);

        // Update SESSION_SECRET in env content
        const sessionSecretRegex = /^SESSION_SECRET=.*/m;
        if (sessionSecretRegex.test(envContent)) {
            envContent = envContent.replace(sessionSecretRegex, `SESSION_SECRET='${sessionSecret}'`);
            log('✓ Updated existing SESSION_SECRET', 'green');
        } else {
            envContent = `SESSION_SECRET='${sessionSecret}'\n` + envContent;
            log('✓ Added SESSION_SECRET to .env', 'green');
        }

        // ==========================================
        // Step 2: Ask if user wants to change password
        // ==========================================
        log('\nStep 2: Master Password Configuration', 'bright');
        log('(This password is used to login to the email dashboard)\n', 'blue');

        let changePassword = 'y';
        if (!forceSetup) {
            changePassword = await question(rl, 'Do you want to set/change the master password? (y/n): ');
        } else {
            log('New .env file detected - password setup is required.', 'yellow');
        }

        if (changePassword.toLowerCase() === 'y') {
            let passwordValid = false;
            let password = '';

            while (!passwordValid) {
                password = await question(rl, '\nEnter password: ');

                // Validate password
                const validation = validatePassword(password);

                if (!validation.valid) {
                    log('\n✗ Password validation failed:', 'red');
                    validation.errors.forEach(error => log(`  • ${error}`, 'red'));
                    log('', 'reset');
                    continue;
                }

                if (validation.warnings.length > 0) {
                    log('\n⚠ Password warnings:', 'yellow');
                    validation.warnings.forEach(warning => log(`  • ${warning}`, 'yellow'));
                    log('', 'reset');

                    const continueAnyway = await question(rl, 'Do you want to use this password anyway? (y/n): ');
                    if (continueAnyway.toLowerCase() !== 'y') {
                        continue;
                    }
                }

                // Step 3: Confirm password
                log('\nStep 3: Confirm your password', 'bright');
                const confirmPassword = await question(rl, 'Re-enter password: ');

                if (password !== confirmPassword) {
                    log('\n✗ Error: Passwords do not match! Please try again.', 'red');
                    continue;
                }

                log('\n✓ Passwords match!', 'green');
                passwordValid = true;
            }

            // ==========================================
            // Step 4: Generate password hash
            // ==========================================
            log('\nStep 4: Generating bcrypt hash...', 'bright');
            log('(This may take a few seconds - bcrypt is intentionally slow for security)', 'blue');

            const hash = await bcrypt.hash(password, 10);

            log('✓ Hash generated successfully!', 'green');
            log(`\nGenerated bcrypt hash: ${colors.cyan}${hash}${colors.reset}`);

            // Step 5: Base64 encode the hash
            log('\nStep 5: Encoding hash to base64...', 'bright');
            const base64Hash = Buffer.from(hash).toString('base64');
            log('✓ Hash encoded successfully!', 'green');
            log(`\nBase64-encoded hash: ${colors.cyan}${base64Hash}${colors.reset}\n`);

            // Update MASTER_PASSWORD_BCRYPT_HASH in env content
            const hashRegex = /^MASTER_PASSWORD_BCRYPT_HASH=.*/m;
            if (hashRegex.test(envContent)) {
                envContent = envContent.replace(hashRegex, `MASTER_PASSWORD_BCRYPT_HASH=${base64Hash}`);
                log('✓ Updated existing MASTER_PASSWORD_BCRYPT_HASH', 'green');
            } else {
                envContent = `MASTER_PASSWORD_BCRYPT_HASH=${base64Hash}\n` + envContent;
                log('✓ Added MASTER_PASSWORD_BCRYPT_HASH to .env', 'green');
            }

            // Store for verification later
            testData.password = password;
            testData.hash = hash;
        } else {
            log('Skipping password configuration. [Including Steps 3-5 for validation]', 'blue');
        }

        // ==========================================
        // Step 6: Ask about IMAP config
        // ==========================================
        log('\nStep 6: IMAP Configuration', 'bright');

        let updateImap = 'y';
        if (!forceSetup) {
            updateImap = await question(rl, 'Do you want to update/change IMAP config? (y/n): ');
        } else {
            log('New .env file detected - IMAP configuration is required.', 'yellow');
        }

        if (updateImap.toLowerCase() === 'y') {
            log('\nOpening IMAP configuration in Notepad...', 'blue');

            // Get current IMAP config from env
            const imapConfigMatch = envContent.match(/^IMAP_CONFIG=(.*)$/m);
            let currentImapConfig = {};

            if (imapConfigMatch && imapConfigMatch[1]) {
                try {
                    const decodedConfig = Buffer.from(imapConfigMatch[1], 'base64').toString('utf8');
                    currentImapConfig = JSON.parse(decodedConfig);
                    log('✓ Loaded existing IMAP configuration', 'green');
                } catch (error) {
                    log('⚠ Warning: Could not decode existing IMAP_CONFIG. Starting with empty config.', 'yellow');
                    log(`  Error details: ${error.message}`, 'yellow');
                }
            } else {
                log('ℹ No existing IMAP configuration found. Starting with template config.', 'blue');
                // Provide a proper template structure
                currentImapConfig = {
                    accounts: [
                        {
                            id: "account1",
                            label: "Email Account 1",
                            imap: {
                                host: "imap.gmail.com",
                                port: 993,
                                user: "your-email@gmail.com",
                                password: "your-app-password",
                                tls: true
                            }
                        }
                    ]
                };
            }

            // Write formatted JSON to temp file
            const tempJsonPath = path.join(__dirname, 'temp.json');
            const formattedJson = JSON.stringify(currentImapConfig, null, 2);
            fs.writeFileSync(tempJsonPath, formattedJson, 'utf8');

            log('✓ Temporary config file created: temp.json', 'green');
            log('\nIMPORTANT:', 'yellow');
            log('• Edit the IMAP configuration in Notepad', 'yellow');
            log('• Ensure valid JSON format (check brackets, quotes, commas)', 'yellow');
            log('• Save your changes (Ctrl+S)', 'yellow');
            log('• Close Notepad when done', 'yellow');
            log('\nWaiting for Notepad to close...', 'magenta');

            try {
                await waitForNotepadClose(tempJsonPath);
                log('\n✓ Notepad closed', 'green');

                // Read the edited JSON
                let editedJson;
                try {
                    editedJson = fs.readFileSync(tempJsonPath, 'utf8');
                } catch (readError) {
                    log('\n✗ Error: Could not read the temporary file!', 'red');
                    log(`  Error details: ${readError.message}`, 'red');
                    throw readError;
                }

                // Validate JSON structure
                log('\nValidating JSON structure...', 'blue');
                const jsonValidation = validateJSON(editedJson, 'IMAP Configuration');

                if (!jsonValidation.valid) {
                    log('\n✗ JSON validation failed:', 'red');
                    jsonValidation.errors.forEach(error => log(`  • ${error}`, 'red'));
                    log(`\n⚠ Temp file kept for debugging: ${tempJsonPath}`, 'yellow');
                    log('Please fix the JSON errors and run the script again.', 'yellow');
                    throw new Error('Invalid JSON configuration');
                }

                log('✓ JSON structure is valid', 'green');
                const parsedConfig = jsonValidation.parsed;

                // Validate IMAP-specific configuration
                log('Validating IMAP configuration...', 'blue');
                const imapValidation = validateImapConfig(parsedConfig);

                if (!imapValidation.valid) {
                    log('\n✗ IMAP configuration validation failed:', 'red');
                    imapValidation.errors.forEach(error => log(`  • ${error}`, 'red'));
                    log(`\n⚠ Temp file kept for debugging: ${tempJsonPath}`, 'yellow');
                    throw new Error('Invalid IMAP configuration');
                }

                if (imapValidation.warnings.length > 0) {
                    log('\n⚠ IMAP configuration warnings:', 'yellow');
                    imapValidation.warnings.forEach(warning => log(`  • ${warning}`, 'yellow'));

                    const proceedAnyway = await question(rl, '\nDo you want to proceed anyway? (y/n): ');
                    if (proceedAnyway.toLowerCase() !== 'y') {
                        log('\nIMAP configuration update cancelled.', 'yellow');
                        log(`⚠ Temp file kept for editing: ${tempJsonPath}`, 'yellow');
                        throw new Error('IMAP configuration update cancelled by user');
                    }
                }

                log('✓ IMAP configuration is valid', 'green');

                // Convert to base64 (single line)
                const base64Config = Buffer.from(JSON.stringify(parsedConfig)).toString('base64');

                log('✓ Configuration encoded successfully', 'green');
                log(`\nBase64-encoded config (first 100 chars): ${colors.cyan}${base64Config.substring(0, 100)}...${colors.reset}\n`);

                // Update IMAP_CONFIG in env content
                const imapRegex = /^IMAP_CONFIG=.*/m;
                if (imapRegex.test(envContent)) {
                    envContent = envContent.replace(imapRegex, `IMAP_CONFIG=${base64Config}`);
                    log('✓ Updated existing IMAP_CONFIG', 'green');
                } else {
                    envContent += `\nIMAP_CONFIG=${base64Config}`;
                    log('✓ Added IMAP_CONFIG to .env', 'green');
                }


                // Clean up temp file
                fs.unlinkSync(tempJsonPath);
                log('✓ Temporary file cleaned up', 'green');

            } catch (error) {
                log(`\n✗ Error during IMAP config update: ${error.message}`, 'red');
                throw error;
            }
        } else {
            log('Skipping IMAP configuration update.', 'blue');
        }

        // ==========================================
        // Step 7: Write .env file
        // ==========================================
        log('\nStep 7: Writing .env file...', 'bright');
        fs.writeFileSync(envPath, envContent, 'utf8');
        log('✓ .env file updated successfully!', 'green');

        // ==========================================
        // Step 8: Verify everything works
        // ==========================================
        if (changePassword && changePassword.toLowerCase() === 'y') {
            log('\nStep 8: Testing password verification...', 'bright');

            const password = testData.password;
            const hash = testData.hash;

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
            const base64Hash = Buffer.from(hash).toString('base64');
            const hashMatch = updatedEnvContent.match(/^MASTER_PASSWORD_BCRYPT_HASH=(.*)$/m);
            if (hashMatch && hashMatch[1] === base64Hash) {
                log('  ✓ .env file contains correct hash!', 'green');
            } else {
                log('  ✗ .env file hash mismatch!', 'red');
                log(`  Expected: ${base64Hash}`, 'red');
                log(`  Found: ${hashMatch ? hashMatch[1] : 'nothing'}`, 'red');
                throw new Error('.env file verification failed');
            }
        }

        // Success!
        log('\n╔════════════════════════════════════════════════════════════╗', 'green');
        log('║                    ✓ SUCCESS!                              ║', 'green');
        log('╚════════════════════════════════════════════════════════════╝', 'green');

        log('\nYour environment has been set up successfully!', 'bright');
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
        if (error.stack) {
            log(`\nStack trace: ${error.stack}`, 'red');
        }
        log('\nSetup failed. Please try again.', 'red');
        process.exit(1);
    } finally {
        rl.close();
    }
}

main().catch(console.error);

