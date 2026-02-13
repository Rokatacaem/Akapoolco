
import { prisma } from '../src/lib/prisma';
import { searchMembers } from '../src/app/lib/actions-members';

async function main() {
    console.log('Searching for "rodrigo"...');
    try {
        const results = await searchMembers('rodrigo');
        console.log('Results found:', results.length);
        console.log(JSON.stringify(results, null, 2));

        // Also double check strictly in DB if searchMembers has some filtering that hides it
        const dbCheck = await prisma.member.findMany({
            where: { name: { contains: 'rodrigo', mode: 'insensitive' } }
        });
        console.log('Direct DB Check found:', dbCheck.length);
    } catch (e) {
        console.error(e);
    }
}

main();
