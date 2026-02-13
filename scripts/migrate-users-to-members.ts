
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Starting migration: Users -> Members")

    // 1. Fetch all users who have Member-like data (or just all users to be safe?)
    // The user said: Admin/Staff should be effectively separated.
    // Logic:
    // - Iterate all users.
    // - Create a Member record for them copying the data.
    // - If we want to maintain history, we must link old sales/sessions to this new Member ID.

    const users = await prisma.user.findMany({
        include: {
            sales: true,
            sessionPlayers: true
        }
    })

    console.log(`Found ${users.length} users to potentialy migrate.`)

    for (const user of users) {
        console.log(`Processing user: ${user.name} (${user.email})`)

        // Check if member already exists (idempotency by rut or email)
        const existingMember = await prisma.member.findFirst({
            where: {
                OR: [
                    { rut: user.rut || undefined }, // RUT might be null
                    { email: user.email || undefined } // Email might be null? No, usually not for login users but maybe for pure members created as users
                ]
            }
        })

        if (existingMember) {
            console.log(`- Member already exists, skipping creation: ${existingMember.id}`)
            // Update relations if needed?
            await updateRelations(user.id, existingMember.id)
            continue;
        }

        // Map User Type to Member Type
        // UserType: SOCIO, SOCIO_FUNDADOR, CLIENTE
        // MemberType: SOCIO, SOCIO_FUNDADOR, CLIENTE (Same names)

        // Map User Status
        // UserStatus: ACTIVE, INACTIVE, SUSPENDED, DELETED
        // MemberStatus: ACTIVE, INACTIVE, BANNED, DELETED
        // Simple mapping.
        let memberStatus = 'ACTIVE';
        if (user.status === 'SUSPENDED') memberStatus = 'BANNED';
        else if (user.status === 'DELETED') memberStatus = 'DELETED';
        else if (user.status === 'INACTIVE') memberStatus = 'INACTIVE';

        const newMember = await prisma.member.create({
            data: {
                name: user.name,
                email: user.email,
                rut: user.rut,
                // phone: user.phone? User model didn't have phone? Check schema.
                // User model didn't have phone explicitly in schema viewed.
                image: user.image,
                type: user.type as any, // Enum mapping should match
                status: memberStatus as any,
                billingProfile: user.billingProfile,
                currentDebt: user.currentDebt,
                debtLimit: user.debtLimit,
                debtStatus: user.debtStatus,
                membershipExpiresAt: user.membershipExpiresAt
            }
        })

        console.log(`- Created Member: ${newMember.id}`)

        // Update Relations
        await updateRelations(user.id, newMember.id)
    }

    console.log("Migration completed.")
}

async function updateRelations(userId: string, memberId: string) {
    // Update Sales
    const salesUpdated = await prisma.sale.updateMany({
        where: { userId: userId },
        data: { memberId: memberId }
    })
    if (salesUpdated.count > 0) console.log(`  - Updated ${salesUpdated.count} sales.`)

    // Update SessionPlayers
    const sessionsUpdated = await prisma.sessionPlayer.updateMany({
        where: { userId: userId },
        data: { memberId: memberId }
    })
    if (sessionsUpdated.count > 0) console.log(`  - Updated ${sessionsUpdated.count} session players.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
