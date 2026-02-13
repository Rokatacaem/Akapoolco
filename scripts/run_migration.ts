
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Manual Migration: Users -> Members (CLI Mode)");

    try {
        const users = await prisma.user.findMany({
            include: {
                sales: true,
                sessionPlayers: true
            }
        });

        console.log(`Found ${users.length} users to process.`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            // Check if member already exists (idempotency by rut or email)
            // Handle null RUT/Email carefully: if both are null, we might create duplicates if we strictly check 'undefined'. 
            // Ideally users have one or the other.

            const existingMember = await prisma.member.findFirst({
                where: {
                    OR: [
                        { rut: user.rut || 'NON_EXISTENT_RUT' },
                        { email: user.email || 'NON_EXISTENT_EMAIL' }
                    ]
                }
            });

            let memberId = existingMember?.id;

            if (existingMember) {
                console.log(`Skipping existing member: ${existingMember.name} (User ID: ${user.id})`);
                skippedCount++;
            } else {
                // Map User Status
                let memberStatus = 'ACTIVE';
                if (user.status === 'SUSPENDED') memberStatus = 'BANNED';
                else if (user.status === 'DELETED') memberStatus = 'DELETED';
                else if (user.status === 'INACTIVE') memberStatus = 'INACTIVE';

                console.log(`Creating member for: ${user.name}`);

                const newMember = await prisma.member.create({
                    data: {
                        name: user.name,
                        email: user.email,
                        rut: user.rut,
                        image: user.image,
                        type: user.type as any,
                        status: memberStatus as any,
                        billingProfile: user.billingProfile,
                        currentDebt: user.currentDebt,
                        debtLimit: user.debtLimit,
                        debtStatus: user.debtStatus,
                        membershipExpiresAt: user.membershipExpiresAt
                    }
                });
                memberId = newMember.id;
                createdCount++;
            }

            if (memberId) {
                // Update Relations (Idempotent update)
                // We update them to link to the new MemberId
                if (user.sales.length > 0) {
                    await prisma.sale.updateMany({
                        where: { userId: user.id },
                        data: { memberId: memberId }
                    });
                }
                if (user.sessionPlayers.length > 0) {
                    await prisma.sessionPlayer.updateMany({
                        where: { userId: user.id },
                        data: { memberId: memberId }
                    });
                }
            }
        }

        console.log(`Migration Completed. Created: ${createdCount}, Skipped: ${skippedCount}`);

    } catch (error: any) {
        console.error("Migration Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
