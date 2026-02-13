"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { TableStatus } from "@prisma/client"

/**
 * Obtiene los detalles de una sesión activa para el checkout
 * 
 * Calcula el tiempo transcurrido, costo por tiempo y suma el consumo de productos.
 * 
 * @param sessionId - ID de la sesión a consultar
 * @returns Objeto con duración, totales y ventas asociadas
 * @throws Error si la sesión no existe
 * 
 * @example
 * ```ts
 * const details = await getSessionDetails('session-id')
 * console.log(details.grandTotal) // 5000
 * ```
 */
export async function getSessionDetails(sessionId: string) {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { sales: true }
    })

    if (!session) throw new Error("Session not found")

    const now = new Date()
    const start = session.startTime
    const durationMs = now.getTime() - start.getTime()
    const durationMin = Math.floor(durationMs / 60000)

    // Mock Rate: $100 / min
    const timeTotal = durationMin * 100

    const consumptionTotal = session.sales.reduce((acc, sale) => acc + Number(sale.total), 0)

    return {
        durationMin,
        timeTotal,
        consumptionTotal,
        grandTotal: timeTotal, // We only charge for time here, assuming consumption was paid. If consumption is just a display, total to pay is time.
        sales: session.sales
    }
}

/**
 * Procesa el checkout y cierre de una sesión de mesa
 * 
 * Verifica límite de crédito si es pago con cuenta, crea registro de venta,
 * cierra la sesión y libera la mesa.
 * 
 * @param sessionId - ID de la sesión a cerrar
 * @param method - Método de pago: CASH, CARD, o ACCOUNT (fiado)
 * @param memberId - ID del socio (requerido si method=ACCOUNT)
 * 
 * @returns {Promise<{success: true} | {error: string}>}
 *          - success: Checkout completado, mesa liberada
 *          - error: Mensaje de error (límite excedido, socio no encontrado, etc.)
 * 
 * @security
 * - Valida límite de crédito antes de cargar a cuenta
 * - Actualiza deuda del socio atómicamente
 * - Revalida rutas afectadas para actualizar UI
 * 
 * @example
 * ```ts
 * const result = await processCheckout('session-id', 'ACCOUNT', 'member-id')
 * if (result.error) {
 *   alert(result.error)
 * }
 * ```
 */
export async function processCheckout(sessionId: string, method: string, memberId?: string) {
    const details = await getSessionDetails(sessionId)
    const amountToPay = details.timeTotal // Only charging time.

    if (amountToPay <= 0) {
        // Just close functionality if 0? Or maybe minimum charge.
    }

    try {
        if (method === 'ACCOUNT') {
            if (!memberId) return { error: "Member identifier required for account charge." }

            const member = await prisma.member.findUnique({ where: { id: memberId } })
            if (!member) return { error: "Member not found." }

            const currentDebt = Number(member.currentDebt) || 0
            const debtLimit = Number(member.debtLimit) || 0

            if (currentDebt + amountToPay > debtLimit) {
                return { error: `Excedería el límite de crédito (Cupo: $${debtLimit.toLocaleString()})` }
            }

            // Update Debt
            await prisma.member.update({
                where: { id: memberId },
                data: {
                    currentDebt: { increment: amountToPay },
                    debtStatus: true // Mark as having debt
                }
            })
        }

        // Create Sale Record
        await prisma.sale.create({
            data: {
                sessionId,
                total: amountToPay,
                method,
                userId: undefined,
                memberId: memberId, // Link to Member
                items: JSON.stringify([{ name: `Table Time (${details.durationMin} min)`, price: amountToPay, quantity: 1 }])
            }
        })

        // Close Session
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                endTime: new Date(),
                status: 'CLOSED',
                totalAmount: details.grandTotal, // Time
                durationMin: details.durationMin
            }
        })

        // Free Table
        const session = await prisma.session.findUnique({ where: { id: sessionId } })
        if (session) {
            await prisma.table.update({
                where: { id: session.tableId },
                data: { status: TableStatus.AVAILABLE, currentSessionId: null }
            })
        }

        revalidatePath('/dashboard/cockpit')
        revalidatePath('/dashboard/members') // Update debt badges
        return { success: true }

    } catch (e) {
        console.error(e)
        return { error: "Transaction failed." }
    }
}
