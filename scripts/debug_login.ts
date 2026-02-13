import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking Admin User...')
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@clubsantiago.cl' }
        })

        if (!user) {
            console.error('ERROR: Admin user NOT FOUND.')
            return
        }

        console.log('User found:', user.email, 'Role:', user.role)

        if (!user.password) {
            console.error('ERROR: User has no password.')
            return
        }

        // Check password
        const passwordMatches = await bcrypt.compare('TaCaEmMi0929', user.password)
        if (passwordMatches) {
            console.log('SUCCESS: Password matches.')
        } else {
            console.error('ERROR: Password does NOT match.')
        }

        // Check Secret
        if (!process.env.AUTH_SECRET) {
            console.warn('WARNING: AUTH_SECRET is not defined in process.env')
        } else {
            console.log('AUTH_SECRET is present.')
        }

    } catch (e) {
        console.error('Database Connection Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
