
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying Prisma Client...')

    // Check models exist in client instance
    if (!prisma.shift) {
        console.error('❌ prisma.shift is undefined')
        process.exit(1)
    } else {
        console.log('✅ prisma.shift exists')
    }

    if (!prisma.stockMovement) {
        console.error('❌ prisma.stockMovement is undefined')
        process.exit(1)
    } else {
        console.log('✅ prisma.stockMovement exists')
    }

    // Check types? (Runtime check of fields is harder without creating)
    // We can try to count shifts to see if it throws
    try {
        await prisma.shift.count()
        console.log('✅ prisma.shift.count() worked')
    } catch (e) {
        console.error('❌ prisma.shift.count() failed', e)
        process.exit(1)
    }

    console.log('Verification successful.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
