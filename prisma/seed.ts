import { PrismaClient, TableStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // 1. Admin User
    const password = await bcrypt.hash('admin123', 10)

    await prisma.user.upsert({
        where: { email: 'admin@clubsantiago.cl' },
        update: {},
        create: {
            email: 'admin@clubsantiago.cl',
            name: 'Admin Principal',
            password,
            role: 'ADMIN',
            type: 'SOCIO'
        },
    })

    // 2. Tables (Create 6 tables)
    const tables = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6 (VIP)']

    for (const name of tables) {
        await prisma.table.upsert({
            where: { name },
            update: {},
            create: {
                name,
                status: TableStatus.AVAILABLE
            }
        })
    }

    console.log('Seeding completed: Admin + Tables')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
