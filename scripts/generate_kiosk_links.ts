
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const tables = await prisma.table.findMany({
        orderBy: {
            name: 'asc'
        }
    });

    const baseUrl = "https://club-santiago-bsm.vercel.app";
    let output = `Found ${tables.length} tables in database.\n\n🔗 ENLACES KIOSCO (Marcadores):\n\n`;

    const ballGameTypes = ['POOL', 'POOL_INTL', 'NINE_BALL', 'POOL_CHILENO', 'SNOOKER', 'CARAMBOLA'];

    tables.forEach(table => {
        const typeStr = table.type as string;

        // Explicitly exclude Cards and Poker
        if (typeStr === 'CARDS' || typeStr === 'POKER') return;

        if (ballGameTypes.includes(typeStr)) {
            const url = `/table/${table.id}`;
            const fullUrl = `${baseUrl}${url}`;
            output += `🎱 ${table.name} (${typeStr.replace('_', ' ')})\n`;
            output += `   Link: ${fullUrl}\n\n`;
        }
    });

    fs.writeFileSync(path.join(process.cwd(), 'kiosk_links.txt'), output);
    console.log("Links written to kiosk_links.txt");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
