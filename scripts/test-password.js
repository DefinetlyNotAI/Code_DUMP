/**
 * Test password verification
 *
 * Usage: node scripts/test-password.js "your-password"
 *
 * This will test your password against the base64-encoded hash in MASTER_PASSWORD_BCRYPT_HASH
 */

const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({path: '.env'});

const password = process.argv[2];

if (!password) {
    console.error('Usage: node scripts/test-password.js "your-password"');
    process.exit(1);
}

const base64Hash = process.env.MASTER_PASSWORD_BCRYPT_HASH;

if (!base64Hash) {
    console.error('ERROR: MASTER_PASSWORD_BCRYPT_HASH not found in environment');
    console.error('Make sure you have a .env file with MASTER_PASSWORD_BCRYPT_HASH set');
    process.exit(1);
}

console.log('Testing password...');
console.log('Password length:', password.length);
console.log('Password (first 3 chars):', password.substring(0, 3) + '***');
console.log('Base64 hash exists:', !!base64Hash);
console.log('Base64 hash length:', base64Hash.length);
console.log('Base64 hash (first 20 chars):', base64Hash.substring(0, 20) + '...');

// Decode the base64 hash
const hash = Buffer.from(base64Hash, 'base64').toString('utf8');
console.log('Decoded hash exists:', !!hash);
console.log('Decoded hash starts with $2:', hash.startsWith('$2'));
console.log('Decoded hash length:', hash.length);
console.log('Decoded hash format:', hash.substring(0, 7) + '...');

bcrypt.compare(password, hash).then(result => {
    console.log('\n' + '='.repeat(50));
    if (result) {
        console.log('✅ PASSWORD MATCHES!');
        console.log('The password is correct.');
    } else {
        console.log('❌ PASSWORD DOES NOT MATCH');
        console.log('The password is incorrect.');
        console.log('\nTroubleshooting:');
        console.log('1. Check for extra spaces or special characters');
        console.log('2. Verify the hash was generated correctly');
        console.log('3. Run scripts/setup-password.js to reset the password');
    }
    console.log('='.repeat(50));
}).catch(err => {
    console.error('Error comparing password:', err.message);
    process.exit(1);
});

