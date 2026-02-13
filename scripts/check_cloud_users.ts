
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking User table in Cloud DB...');
    try {
        const userCount = await prisma.user.count();
        console.log('User Count:', userCount);

        if (userCount > 0) {
            const firstUsers = await prisma.user.findMany({ take: 5 });
            console.log('Sample Users:', JSON.stringify(firstUsers, null, 2));
        }

        const memberCount = await prisma.member.count();
        console.log('Member Count:', memberCount);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
