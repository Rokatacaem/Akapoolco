
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const sales = await prisma.sale.findMany({
        where: {
            shiftId: { not: null }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log("Last 5 Linked Sales:");
    sales.forEach(s => console.log(`${s.id} - Shift: ${s.shiftId} - Total: ${s.total}`));

    const orphan = await prisma.sale.count({
        where: { shiftId: null }
    });
    console.log(`Orphan sales count: ${orphan}`);
}

main();
