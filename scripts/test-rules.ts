
import { PrismaClient } from '@prisma/client'
import { isUserActiveMember, MEMBER_GRACE_PERIOD_DAYS } from '../src/app/lib/business-rules'
import { runDebtMonitor } from '../src/app/lib/actions-members'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting verification...')

    // 1. Create a user that SHOULD be expired (expired 31 days ago)
    const expiredDate = new Date()
    expiredDate.setDate(expiredDate.getDate() - (MEMBER_GRACE_PERIOD_DAYS + 1))

    const testUser = await prisma.user.create({
        data: {
            name: 'Test Expired User',
            rut: '88888888-8',
            type: 'SOCIO',
            status: 'ACTIVE',
            membershipExpiresAt: expiredDate,
            email: 'test-dynamic@example.com'
        }
    })

    console.log(`Created test user ${testUser.id} with expiry ${testUser.membershipExpiresAt} and status ${testUser.status}`)

    // 2. Check isUserActiveMember - Should be FALSE because of DATE, even if status is ACTIVE
    const isActiveMember = isUserActiveMember(testUser as any)
    console.log(`isUserActiveMember result: ${isActiveMember}`)

    if (isActiveMember === false) {
        console.log('SUCCESS: User is NOT active member (Financial benefits suspended)')
    } else {
        console.error('FAILURE: User is still active member despite expiration')
    }

    // 3. Run Debt Monitor - Should NOT change status
    await runDebtMonitor()

    const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } })
    console.log(`Updated user status after monitor: ${updatedUser?.status}`)

    if (updatedUser?.status === 'ACTIVE') {
        console.log('SUCCESS: User status remained ACTIVE')
    } else {
        console.error('FAILURE: User status was changed to ' + updatedUser?.status)
    }

    // Cleanup
    await prisma.user.delete({ where: { id: testUser.id } })
    console.log('Cleanup done')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
