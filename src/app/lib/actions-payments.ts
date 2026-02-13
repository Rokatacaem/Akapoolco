'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { SaleType, Prisma } from '@prisma/client';

// Helper to get active shift
async function getActiveShiftId() {
    const shift = await prisma.shift.findFirst({
        where: { status: 'OPEN' },
        select: { id: true }
    });
    return shift?.id;
}

export async function processDebtPayment(userId: string, amount: number, method: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'No autorizado' };

    if (amount <= 0) return { success: false, error: 'Monto inválido' };

    const shiftId = await getActiveShiftId();
    if (!shiftId) return { success: false, error: 'No hay turno activo. Debe abrir caja primero.' };

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Create Sale Record
            await tx.sale.create({
                data: {
                    userId,
                    shiftId,
                    total: new Prisma.Decimal(amount),
                    method, // CASH, CARD, TRANSFER
                    type: 'DEBT_PAYMENT',
                    items: [{ name: 'Abono a Deuda', price: amount, quantity: 1 }],
                    metadata: { processedBy: session.user.email }
                }
            });

            // 2. Decrease User Debt
            await tx.user.update({
                where: { id: userId },
                data: {
                    currentDebt: { decrement: amount }
                }
            });
        });

        revalidatePath('/dashboard/users');
        revalidatePath('/dashboard/shifts');
        return { success: true };
    } catch (error) {
        console.error('Error paying debt:', error);
        return { success: false, error: 'Error al procesar el pago' };
    }
}

export async function processMembershipPayment(userId: string, months: number, amount: number, method: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'No autorizado' };

    const shiftId = await getActiveShiftId();
    if (!shiftId) return { success: false, error: 'No hay turno activo.' };

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, error: 'Usuario no encontrado' };

        // Calculate new expiration date
        const currentExpire = user.membershipExpiresAt && user.membershipExpiresAt > new Date()
            ? new Date(user.membershipExpiresAt)
            : new Date();

        const newExpire = new Date(currentExpire);
        newExpire.setMonth(newExpire.getMonth() + months);

        await prisma.$transaction(async (tx) => {
            // 1. Register Sale
            await tx.sale.create({
                data: {
                    userId,
                    shiftId,
                    total: new Prisma.Decimal(amount),
                    method,
                    type: 'MEMBERSHIP',
                    items: [{ name: `Renovación Membresía (${months} meses)`, price: amount, quantity: 1 }],
                    metadata: {
                        previousExpire: currentExpire,
                        newExpire: newExpire
                    }
                }
            });

            // 2. Update User Membership
            await tx.user.update({
                where: { id: userId },
                data: {
                    membershipExpiresAt: newExpire,
                    // If they weren't a member type, maybe upgrade them? 
                    // Keeping simple: assuming manual role check or they are already SOCIO
                }
            });
        });

        revalidatePath('/dashboard/users');
        revalidatePath('/dashboard/shifts');
        return { success: true, newExpire };
    } catch (error) {
        console.error('Error paying membership:', error);
        return { success: false, error: 'Error al procesar membresía' };
    }
}
