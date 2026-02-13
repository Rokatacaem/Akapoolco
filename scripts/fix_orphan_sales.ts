
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🔍 Checking for open shift...");

        // 1. Find Open Shift
        const activeShift = await prisma.shift.findFirst({
            where: { status: 'OPEN' }
        });

        if (!activeShift) {
            console.error("❌ No active shift found. Cannot link sales.");
            return;
        }

        console.log(`✅ Active Shift found: ${activeShift.id} (Started: ${activeShift.createdAt.toLocaleString()})`);

        // 2. Find Orphan Sales (Created after shift start, but no shiftId)
        // We look for sales created AFTER the shift started.
        const orphanSales = await prisma.sale.findMany({
            where: {
                shiftId: null,
                createdAt: {
                    gte: activeShift.createdAt
                }
            }
        });

        if (orphanSales.length === 0) {
            console.log("✅ No orphan sales found. Everything looks correct.");
            return;
        }

        console.log(`⚠️ Found ${orphanSales.length} orphan sales to recover.`);

        // 3. Update Sales
        const updateResult = await prisma.sale.updateMany({
            where: {
                id: { in: orphanSales.map(s => s.id) }
            },
            data: {
                shiftId: activeShift.id
            }
        });

        console.log(`✅ Successfully linked ${updateResult.count} sales to the active shift.`);

        // Log details
        orphanSales.forEach(s => {
            console.log(`   - Linked Sale ${s.id}: $${s.total} (${s.method})`);
        });

    } catch (error) {
        console.error("Error executing fix:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
