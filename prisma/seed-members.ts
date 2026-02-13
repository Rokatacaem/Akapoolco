import { PrismaClient, UserRole, UserType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('123456', 10)

    // 1. Members (Socios)
    const members = [
        { name: 'Juan Perez', email: 'juan@example.com', debt: false },
        { name: 'Maria Gonzalez', email: 'maria@example.com', debt: true },
        { name: 'Carlos Rodriguez', email: 'carlos@example.com', debt: false },
        { name: 'Ana Lopez', email: 'ana@example.com', debt: false },
        { name: 'Pedro Martinez', email: 'pedro@example.com', debt: true },
    ]

    console.log('Seeding Members...')

    for (const m of members) {
        await prisma.user.upsert({
            where: { email: m.email },
            update: {},
            create: {
                name: m.name,
                email: m.email,
                password, // Shared password for demo
                role: 'STAFF', // Regular user treated as Staff/User in this simplified model or create new role
                type: 'SOCIO',
                debtStatus: m.debt
            }
        })
    }

    console.log('Seeding completed')
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
