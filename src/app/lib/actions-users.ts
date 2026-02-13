/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { hasPermission } from "@/lib/permissions"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const userSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    role: z.enum(["ADMIN", "STAFF", "SUPERUSER"]),
    customPermissions: z.record(z.string(), z.boolean()).optional(),
})

export async function createUser(data: z.infer<typeof userSchema>) {
    const session = await auth()

    // 1. Authentication Check
    if (!session?.user?.id) {
        return { error: "No autorizado. Debe iniciar sesión." }
    }

    // 2. Permission Check
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!currentUser || !hasPermission(currentUser.role, "MANAGE_USERS")) {
        return { error: "Acceso denegado. No tiene permisos para crear usuarios." }
    }

    // 3. Logic Check
    if (data.role === "SUPERUSER" && currentUser.role !== "SUPERUSER") {
        return { error: "Solo un Superusuario puede crear otros Superusuarios." }
    }
    // Relaxed Rule: Admins can create Admins
    // if (data.role === "ADMIN" && currentUser.role !== "SUPERUSER") {
    //    return { error: "Solo un Superusuario puede crear Administradores." }
    // }

    // 4. Validation
    const validation = userSchema.safeParse(data)
    if (!validation.success) {
        // Use .issues for ZodError
        return { error: validation.error.issues[0].message }
    }

    const trustedData = validation.data

    try {
        // Check duplicate email
        const existing = await prisma.user.findUnique({ where: { email: trustedData.email } })
        if (existing) {
            return { error: "El correo electrónico ya está registrado." }
        }

        const hashedPassword = await bcrypt.hash(trustedData.password, 10)

        await prisma.user.create({
            data: {
                name: trustedData.name,
                email: trustedData.email,
                password: hashedPassword,
                role: trustedData.role,
                systemAccess: true,
                customPermissions: (trustedData.customPermissions ?? {}) as any
            }
        })

        revalidatePath("/dashboard/users")
        return { success: true, message: "Usuario creado exitosamente." }
    } catch (error: any) {
        console.error("Error creating user:", error)
        return { error: `Error al crear usuario: ${error.message}` } // Expose error for debugging
    }
}

export async function getUsers() {
    const session = await auth()
    if (!session?.user?.id) return []

    const users = await prisma.user.findMany({
        where: {
            systemAccess: true
        },
        orderBy: { createdAt: "desc" }
    })

    return users.map(user => ({
        ...user,
        currentDebt: user.currentDebt.toNumber(),
        debtLimit: user.debtLimit.toNumber()
    }))
}

export async function deleteUser(userId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autorizado" }

    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!currentUser || !hasPermission(currentUser.role, "MANAGE_USERS")) {
        return { error: "No tiene permisos para eliminar usuarios." }
    }

    if (userId === currentUser.id) {
        return { error: "No puede eliminarse a sí mismo." }
    }

    try {
        await prisma.user.delete({ where: { id: userId } })
        revalidatePath("/dashboard/users")
        return { success: true, message: "Usuario eliminado correctamente" }
    } catch (error) {
        return { error: "Error al eliminar usuario" }
    }
}

// --- PASSWORD MANAGEMENT ---

/**
 * Admin Action: Reset user password manually.
 */
export async function resetUserPassword(userId: string, newPassword: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    // Permission Check
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !hasPermission(currentUser.role, "MANAGE_USERS")) {
        return { error: "No tiene permisos para gestionar usuarios." };
    }

    // Self-reset prevention? Not strictly necessary for admins, but 'changeOwnPassword' is preferred.
    // Logic: Admin resets SOMEONE ELSE's password. 
    // If resetting own, they should use the other flow, but technically this works too.

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                // Reset limit counters when admin resets it?
                // Maybe yes, to unblock them.
                passwordChangeCount: 0,
                lastPasswordChangeDate: new Date()
            }
        });
        return { success: true, message: "Contraseña restablecida correctamente." };
    } catch (error) {
        console.error("Error resetting password:", error);
        return { error: "Error al restablecer contraseña." };
    }
}

/**
 * User Action: Change own password.
 * Rate Limit: Max 4 times per month.
 */
export async function changeOwnPassword(currentPassword: string, newPassword: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "No autorizado" };

    try {
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user || !user.password) return { error: "Usuario no encontrado." };

        // 1. Verify Current Password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return { error: "La contraseña actual es incorrecta." };

        // 2. Rate Limiting Logic
        const now = new Date();
        const lastChange = user.lastPasswordChangeDate ? new Date(user.lastPasswordChangeDate) : null;

        let currentCount = user.passwordChangeCount;

        // Reset count if new month
        if (lastChange) {
            if (lastChange.getMonth() !== now.getMonth() || lastChange.getFullYear() !== now.getFullYear()) {
                currentCount = 0;
            }
        }

        if (currentCount >= 4) {
            return { error: "Ha excedido el límite de 4 cambios de contraseña por mes." };
        }

        // 3. Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordChangeCount: currentCount + 1,
                lastPasswordChangeDate: now
            }
        });

        return {
            success: true,
            message: "Contraseña actualizada exitosamente.",
            remainingChanges: 4 - (currentCount + 1)
        };

    } catch (error) {
        console.error("Change password error:", error);
        return { error: "Error al cambiar la contraseña." };
    }
}
