require('dotenv').config();

console.log('Checking Environment Variables...');

const missing = [];
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) missing.push('AUTH_SECRET/NEXTAUTH_SECRET');
if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');

if (missing.length > 0) {
    console.error('MISSING VARIABLES:', missing.join(', '));
} else {
    console.log('All critical variables (AUTH_SECRET, DATABASE_URL) are confirmed present.');
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL.substring(0, 10) + '...');
}
