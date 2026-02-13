
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Verification...');

    // 1. Verify User Schema (membershipExpiresAt)
    const rut = '99999999-9';
    const email = 'test-member@example.com';

    // Clean up
    await prisma.user.deleteMany({ where: { rut } });

    const today = new Date();
    const nextYear = new Date(today.setFullYear(today.getFullYear() + 1));

    console.log('Creating Test User...');
    const user = await prisma.user.create({
        data: {
            name: 'Test Member',
            rut,
            email,
            type: 'SOCIO',
            membershipExpiresAt: nextYear,
            // required fields
            firstName: 'Test',
            lastNamePat: 'Member'
        }
    });

    console.log('User Created:', user.id);
    if (user.membershipExpiresAt) {
        console.log('✔ membershipExpiresAt saved correctly:', user.membershipExpiresAt);
    } else {
        console.error('❌ membershipExpiresAt missing!');
    }

    // 2. Verify Session Schema (isTraining)
    // Create a dummy table first
    const tableName = 'TestTable_' + Math.floor(Math.random() * 1000);
    const table = await prisma.table.create({
        data: { name: tableName, type: 'POOL' }
    });

    console.log('Creating Test Session with isTraining=true...');
    const session = await prisma.session.create({
        data: {
            tableId: table.id,
            startTime: new Date(),
            isTraining: true
        }
    });

    console.log('Session Created:', session.id);
    if (session.isTraining === true) {
        console.log('✔ isTraining saved correctly: true');
    } else {
        console.error('❌ isTraining failed or false:', session.isTraining);
    }

    // Clean up
    await prisma.session.delete({ where: { id: session.id } });
    await prisma.table.delete({ where: { id: table.id } });
    await prisma.user.delete({ where: { id: user.id } });

    console.log('Verification Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
