
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://neondb_owner:npg_pIBo5tqmhR4u@ep-icy-glitter-ahr2ssdx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require",
        },
    },
});

async function main() {
    console.log('Testing connection to Cloud Database...');
    try {
        const count = await prisma.member.count();
        console.log('Connection Successful! Member count:', count);
    } catch (e) {
        console.error('Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
