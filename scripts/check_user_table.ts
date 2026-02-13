
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Checking User table for "rodrigo"...');
    try {
        const users = await prisma.user.findMany({
            where: { name: { contains: 'rodrigo', mode: 'insensitive' } }
        });
        console.log('User Table - Results found:', users.length);
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
