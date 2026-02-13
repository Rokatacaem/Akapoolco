
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to connect to the database...');
        await prisma.$connect();
        console.log('Successfully connected to the database.');

        // Simple query to verify read access
        const userCount = await prisma.user.count();
        console.log(`Connection verified. Found ${userCount} users.`);

    } catch (error) {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
