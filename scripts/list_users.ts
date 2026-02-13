
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Listing first 10 users...');
    try {
        const users = await prisma.user.findMany({
            take: 10
        });
        console.log('Total users found:', users.length);
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
