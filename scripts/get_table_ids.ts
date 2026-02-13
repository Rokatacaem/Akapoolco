
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tables = await prisma.table.findMany({
        select: { id: true, name: true, status: true }
    });
    console.log("=== LISTA DE MESAS ===");
    tables.forEach(t => {
        console.log(`${t.name}: ${t.id} (${t.status})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
