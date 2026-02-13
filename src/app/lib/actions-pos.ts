'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';

export interface PosItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

// ----------------------------------------------------------------------
// 1. Process Direct Sale (Quick POS - No/Optional User, No Session)
// ----------------------------------------------------------------------
export async function processDirectSale(items: PosItem[], method: string, userId?: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'No autorizado' };

    if (items.length === 0) return { success: false, error: 'Carro vacío' };

    try {
        const activeShift = await prisma.shift.findFirst({ where: { status: 'OPEN' } });

        if (!activeShift) return { success: false, error: 'Caja Cerrada. Abra turno primero.' };

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await prisma.$transaction(async (tx) => {
            // Decrement Stock
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });

                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'PURCHASE', // Outgoing sale
                        quantity: -item.quantity,
                        reason: 'Venta Directa (POS)',
                        userId: session.user.id
                    }
                });
            }

            // Create Sale Record
            await tx.sale.create({
                data: {
                    shiftId: activeShift.id,
                    userId: undefined, // Clear legacy User ID
                    memberId: userId, // Map input "userId" to memberId
                    total: new Prisma.Decimal(total),
                    method: method,
                    type: 'CONSUMPTION',
                    items: items as unknown as Prisma.InputJsonValue,
                    metadata: { source: 'QuickPOS' }
                } as any
            });

            // Update Member Debt if method is ACCOUNT
            if (method === 'ACCOUNT') {
                if (!userId) throw new Error('Se requiere socio para venta Fiado');
                await tx.member.update({
                    where: { id: userId }, // "userId" is actually memberId
                    data: { currentDebt: { increment: total } }
                });
            }
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/products');

        return { success: true };
    } catch (error: any) {
        console.error('POS Error:', error);
        return { success: false, error: error.message || 'Error al procesar venta' };
    }
}

// ----------------------------------------------------------------------
// 2. Register Sale (Legacy/Table Adapter - Supports SessionId & Total Override)
// ----------------------------------------------------------------------
export async function registerSale(sessionId: string | null, items: PosItem[], total: number, method: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'No autorizado' };

    // Basic validation
    if (!items || items.length === 0) return { success: false, error: 'Carro vacío' };

    try {
        const activeShift = await prisma.shift.findFirst({ where: { status: 'OPEN' } });
        if (!activeShift) return { success: false, error: 'Caja Cerrada' };

        await prisma.$transaction(async (tx) => {
            // 1. Stock
            for (const item of items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            type: 'PURCHASE',
                            quantity: -item.quantity,
                            reason: sessionId ? 'Consumo Mesa' : 'Venta Rápida',
                            userId: session.user.id
                        }
                    });
                }
            }

            // 2. Sale Linked to Session
            await tx.sale.create({
                data: {
                    shiftId: activeShift.id,
                    sessionId: sessionId || undefined,
                    total: new Prisma.Decimal(total),
                    method: method,
                    type: 'CONSUMPTION',
                    items: items as unknown as Prisma.InputJsonValue,
                    metadata: { source: sessionId ? 'TableConsumption' : 'LegacyRegister' }
                } as any
            });
        });

        revalidatePath('/dashboard/cockpit');
        return { success: true };

    } catch (error: any) {
        console.error('RegisterSale Error:', error);
        return { success: false, error: error.message };
    }
}

// ----------------------------------------------------------------------
// 3. Get Products (For Selectors)
// ----------------------------------------------------------------------
export async function getProducts() {
    return await prisma.product.findMany({
        where: { stockControl: true },
        orderBy: { name: 'asc' }
    });
}
