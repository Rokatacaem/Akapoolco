
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Admin Permissions and User Creation...");

    // 1. Check the "Admin Principal" role
    const adminEmail = "admin@clubsantiago.cl"; // Inferred from screenshot
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!admin) {
        console.error("Admin user not found!");
    } else {
        console.log(`Admin User Found: ${admin.name}, Role: ${admin.role}`);

        // Check if logic allows creation
        // Copied logic from actions-users.ts:
        // if (data.role === "ADMIN" && currentUser.role !== "SUPERUSER")

        const targetRole = "ADMIN";
        if (targetRole === "ADMIN" && admin.role !== "SUPERUSER") {
            console.log("❌ SIMULATION FAILED: Only SUPERUSER can create ADMINs.");
            console.log(`Current user role is ${admin.role}, but needs SUPERUSER.`);
        } else {
            console.log("✅ Role Check Passed.");
        }
    }

    // 2. Try to create a dummy user directly with Prisma to check DB constraints
    console.log("\nAttempting DB Insert...");
    const dummyEmail = "test_creation_debug@example.com";

    // Clean up if exists
    await prisma.user.deleteMany({ where: { email: dummyEmail } });

    try {
        const hashedPassword = await bcrypt.hash("123456", 10);
        const newUser = await prisma.user.create({
            data: {
                name: "Test Debug User",
                email: dummyEmail,
                password: hashedPassword,
                role: "ADMIN",
                systemAccess: true,
                // Not setting rut, type, etc. relying on defaults
            }
        });
        console.log("✅ DB Insert Success:", newUser.id);

        // Clean up
        await prisma.user.delete({ where: { id: newUser.id } });
        console.log("Cleaned up test user.");

    } catch (e: any) {
        console.error("❌ DB Insert Failed:", e.message);
        if (e.code) console.error("Error Code:", e.code);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
