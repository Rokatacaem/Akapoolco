
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Seeding member "Rodrigo"...');
    try {
        const member = await prisma.member.create({
            data: {
                name: 'Rodrigo TestUser',
                rut: '12345678-9',
                email: 'rodrigo@test.com',
                type: 'SOCIO',
                billingProfile: 'ACTIVE',
                debtLimit: 50000,
                currentDebt: 0,
                membershipExpiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            }
        });
        console.log('Created member:', member);
    } catch (e) {
        console.error('Error creating member (might already exist):', e);
    }
}

main();
