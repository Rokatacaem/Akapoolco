
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Listing first 10 members...');
    try {
        const members = await prisma.member.findMany({
            take: 10
        });
        console.log('Total members found:', members.length);
        console.log(JSON.stringify(members, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
