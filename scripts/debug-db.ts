import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to DB...');
    try {
        const tables = await prisma.table.findMany({
            include: { currentSession: true }
        });
        console.log('Fetched tables successfully:', tables.length);
        tables.forEach((t: any) => {
            console.log(`Table: ${t.name}, Type: ${t.type}, Status: ${t.status}`);
            if (t.currentSession) {
                console.log(` - Session Amount: ${t.currentSession.totalAmount} (${typeof t.currentSession.totalAmount})`);

                // Test serialization manual
                const amount = t.currentSession.totalAmount;
                // Verify if it is Decimal object
                console.log(` - Is Decimal? ${amount && typeof amount.toString === 'function'}`);

                const serialized = Number(t.currentSession.totalAmount.toString());
                console.log(` - Serialized Amount: ${serialized}`);
            }
        });
    } catch (e) {
        console.error('Error fetching tables:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
