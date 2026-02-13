"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendShiftReport } from "@/lib/email"

// Helper to serialize Prisma objects (Decimal to Number)
function serializeShift(shift: any) {
    if (!shift) return null;
    return {
        ...shift,
        initialAmount: Number(shift.initialAmount),
        finalAmount: shift.finalAmount ? Number(shift.finalAmount) : null,
        sales: shift.sales?.map((sale: any) => ({
            ...sale,
            total: Number(sale.total)
        }))
    };
}

export async function openShift(userId: string, initialAmount: number) {
    try {
        // Check if there is already an open shift (globally or for this user? Usually globally for one cash drawer)
        // System Manager Rules imply One Global Shift for the business usually, or per point of sale.
        // Assuming single point of sale logic for now.
        const activeShift = await prisma.shift.findFirst({
            where: { status: "OPEN" }
        })

        if (activeShift) {
            return { error: "Ya existe un turno abierto." }
        }

        const shift = await prisma.shift.create({
            data: {
                startUserId: userId,
                initialAmount,
                status: "OPEN"
            }
        })

        revalidatePath('/dashboard/shifts')

        // Notify Admin
        await sendShiftReport('OPEN', {
            user: userId,
            initialAmount
        });

        return { success: true, shift: serializeShift(shift) }
    } catch (error) {
        console.error("Failed to open shift:", error)
        return { error: "Error al abrir turno" }
    }
}

export async function closeShift(shiftId: string, userId: string, finalAmount: number) {
    try {
        const shift = await prisma.shift.update({
            where: { id: shiftId },
            data: {
                endUserId: userId,
                finalAmount,
                closedAt: new Date(),
                status: "CLOSED"
            }
        })

        revalidatePath('/dashboard/shifts')

        // Notify Admin
        await sendShiftReport('CLOSE', {
            user: userId,
            initialAmount: shift.initialAmount, // From updated record return? No, update returns the object
            finalAmount,
            totalSales: 0 // TODO: Calculate this if needed
        });

        return { success: true, shift: serializeShift(shift) }
    } catch (error) {
        console.error("Failed to close shift:", error)
        return { error: "Error al cerrar turno" }
    }
}

export async function getCurrentShift() {
    try {
        return await prisma.shift.findFirst({
            where: { status: "OPEN" },
            include: {
                startUser: true,
                sales: true
            }
        })
    } catch (error) {
        return null
    }
}

export async function getActiveShiftDetails() {
    try {
        const activeShift = await prisma.shift.findFirst({
            where: { status: "OPEN" },
            include: {
                sales: {
                    include: { user: { select: { name: true } } }
                }
            }
        })

        if (!activeShift) return null

        // Aggregations
        const summary = {
            total: 0,
            cash: 0,
            card: 0,
            transfer: 0,
            byType: {
                CONSUMPTION: 0,
                DEBT_PAYMENT: 0,
                MEMBERSHIP: 0
            },
            salesCount: activeShift.sales.length
        }

        activeShift.sales.forEach(sale => {
            const amount = Number(sale.total)
            summary.total += amount

            // By Method
            if (sale.method === 'CASH') summary.cash += amount
            else if (sale.method === 'CARD') summary.card += amount
            else if (sale.method === 'TRANSFER') summary.transfer += amount

            // By Type
            // Cast to string to avoid specific enum index issues if types aren't fully reloaded
            const saleType = (sale as any).type || 'CONSUMPTION';

            if (summary.byType[saleType as keyof typeof summary.byType] !== undefined) {
                summary.byType[saleType as keyof typeof summary.byType] += amount
            } else {
                summary.byType['CONSUMPTION'] += amount
            }
        })

        return {
            shift: serializeShift(activeShift),
            summary
        }

    } catch (error) {
        console.error("Error fetching shift details:", error)
        return null
    }
}

export async function getShiftSummary(shiftId: string) {
    const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
        include: {
            sales: {
                include: { user: { select: { name: true } } }
            },
            startUser: true,
            endUser: true
        }
    })

    if (!shift) return null;

    // Recalculate summaris for closed shifts same way
    const summary = {
        total: 0,
        cash: 0,
        card: 0,
        transfer: 0,
        byType: {
            CONSUMPTION: 0,
            DEBT_PAYMENT: 0,
            MEMBERSHIP: 0
        },
        salesCount: shift.sales.length
    }

    shift.sales.forEach(sale => {
        const amount = Number(sale.total)
        summary.total += amount
        if (sale.method === 'CASH') summary.cash += amount
        else if (sale.method === 'CARD') summary.card += amount
        else if (sale.method === 'TRANSFER') summary.transfer += amount

        const saleType = (sale as any).type || 'CONSUMPTION';
        if (summary.byType[saleType as keyof typeof summary.byType] !== undefined) {
            summary.byType[saleType as keyof typeof summary.byType] += amount
        } else {
            summary.byType['CONSUMPTION'] += amount
        }
    })

    return { shift: serializeShift(shift), summary }
}
