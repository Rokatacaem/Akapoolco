/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

/**
 * Migrates data from User table to Member table.
 * Restricted to ADMIN/SUPERUSER.
 * 
 * Logic:
 * 1. Iterates all Users.
 * 2. Checks if Member with same RUT or Email exists.
 * 3. If not, creates Member.
 * 4. Updates Sales and SessionPlayers to point to new Member.
 */
export async function migrateUsersToMembers() {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "No autorizado" }
    }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (currentUser?.role !== "SUPERUSER" && currentUser?.role !== "ADMIN") {
        return { error: "Requiere privilegios de Administrador" }
    }

    console.log("Starting Manual Migration: Users -> Members")

    try {
        const users = await prisma.user.findMany({
            include: {
                sales: true,
                sessionPlayers: true
            }
        })

        let createdCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            // Check if member already exists (idempotency by rut or email)
            const existingMember = await prisma.member.findFirst({
                where: {
                    OR: [
                        { rut: user.rut || undefined },
                        { email: user.email || undefined }
                    ]
                }
            })

            let memberId = existingMember?.id;

            if (existingMember) {
                skippedCount++;
            } else {
                // Map User Status
                let memberStatus = 'ACTIVE';
                if (user.status === 'SUSPENDED') memberStatus = 'BANNED';
                else if (user.status === 'DELETED') memberStatus = 'DELETED';
                else if (user.status === 'INACTIVE') memberStatus = 'INACTIVE';

                const newMember = await prisma.member.create({
                    data: {
                        name: user.name,
                        email: user.email,
                        rut: user.rut,
                        image: user.image,
                        type: user.type as any,
                        status: memberStatus as any,
                        billingProfile: user.billingProfile,
                        currentDebt: user.currentDebt,
                        debtLimit: user.debtLimit,
                        debtStatus: user.debtStatus,
                        membershipExpiresAt: user.membershipExpiresAt
                    }
                })
                memberId = newMember.id;
                createdCount++;
            }

            if (memberId) {
                // Update Relations (Idempotent update)
                if (user.sales.length > 0) {
                    await prisma.sale.updateMany({
                        where: { userId: user.id },
                        data: { memberId: memberId }
                    })
                }
                if (user.sessionPlayers.length > 0) {
                    await prisma.sessionPlayer.updateMany({
                        where: { userId: user.id },
                        data: { memberId: memberId }
                    })
                }
            }
        }

        revalidatePath("/dashboard/members")
        revalidatePath("/dashboard/users")

        return {
            success: true,
            message: `Migración completada. Creados: ${createdCount}, Omitidos (ya existían): ${skippedCount}`
        }

    } catch (error: any) {
        console.error("Migration Error:", error)
        return { error: `Error en migración: ${error.message}` }
    }
}
