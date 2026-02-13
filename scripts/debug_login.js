const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Load environment variables

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Admin User (JS Script)...');
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@clubsantiago.cl' }
        });

        if (!user) {
            console.error('ERROR: Admin user NOT FOUND in database.');
        } else {
            console.log('User found:', user.email);
            console.log('Role:', user.role);
            console.log('System Access:', user.systemAccess);

            const passwordMatches = await bcrypt.compare('TaCaEmMi0929', user.password);
            if (passwordMatches) {
                console.log('SUCCESS: Password matches.');
            } else {
                console.error('ERROR: Password does NOT match.');
            }
        }

        if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
            console.warn('WARNING: Neither AUTH_SECRET nor NEXTAUTH_SECRET is defined in process.env');
        } else {
            console.log('Secret is present.');
        }

    } catch (e) {
        console.error('Database/Script Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
