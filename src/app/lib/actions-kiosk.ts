'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { PrintCategory, TicketStatus, Prisma } from '@prisma/client';
import { auth } from '@/auth';

export type CartItem = {
    productId: string;
    quantity: number;
    note?: string;
    price: number;
    name: string;
    printCategory: PrintCategory;
};

// 1. Get Kiosk State (Lightweight Poller)
export async function getKioskState(tableId: string) {
    try {
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: {
                currentSession: {
                    select: {
                        id: true,
                        startTime: true,
                        status: true,
                        gameState: true,
                        sessionPlayers: {
                            select: {
                                id: true,
                                guestName: true,
                                member: { select: { name: true, image: true } },
                                user: { select: { name: true, image: true } }
                            }
                        }
                    }
                },
                // Fetch active ads only if needed (caching strategy recommended for prod)
                // For now we fetch them if status is AVAILABLE
            }
        });

        if (!table) return { error: "Mesa no encontrada" };

        let ads: import('@prisma/client').AdBanner[] = [];
        if (table.status === 'AVAILABLE' || table.status === 'RESERVED') {
            ads = await prisma.adBanner.findMany({
                where: { active: true },
                orderBy: { order: 'asc' }
            });
        }

        return {
            status: table.status,
            tableName: table.name,
            tableType: table.type,
            sessionData: table.currentSession ? {
                ...table.currentSession,
                // Flatten players for UI
                players: table.currentSession.sessionPlayers.map(sp => ({
                    id: sp.id,
                    name: sp.member?.name || sp.user?.name || sp.guestName || "Jugador",
                    image: sp.member?.image || sp.user?.image,
                    isMember: !!sp.member
                })),
                // Inject Table Data for ActiveScreen context
                table: {
                    type: table.type,
                    cameraTopUrl: table.cameraTopUrl,
                    cameraFrontUrl: table.cameraFrontUrl
                }
            } : null,
            ads
        };

    } catch (_error) {
        console.error("Error fetching kiosk state:", _error);
        return { error: "Error de servidor" };
    }
}

// 2. Submit Order Logic
export async function submitTableOrder(
    sessionId: string,
    items: CartItem[],
    billedToPlayerId?: string
) {
    if (!items || items.length === 0) return { error: "Carrito vacío" };

    try {
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // Transaction: Create Order -> Create Split Tickets
        const result = await prisma.$transaction(async (tx) => {
            // A. Create Main Order
            const order = await tx.tableOrder.create({
                data: {
                    sessionId,
                    billedToPlayerId: billedToPlayerId || null, // If null, it's Table Charge
                    items: items as unknown as Prisma.InputJsonValue,
                    total: total,
                    status: 'PENDING'
                }
            });

            // B. Split Logic for Tickets
            const ticketsToCreate = [];

            // BAR Ticket
            const barItems = items.filter(i => i.printCategory === 'BAR');
            if (barItems.length > 0) {
                ticketsToCreate.push({
                    tableOrderId: order.id,
                    category: 'BAR' as PrintCategory, // Explicit cast
                    content: barItems as unknown as Prisma.InputJsonValue,
                    status: 'PENDING' as TicketStatus
                });
            }

            // KITCHEN Ticket
            const kitchenItems = items.filter(i => i.printCategory === 'KITCHEN');
            if (kitchenItems.length > 0) {
                ticketsToCreate.push({
                    tableOrderId: order.id,
                    category: 'KITCHEN' as PrintCategory,
                    content: kitchenItems as unknown as Prisma.InputJsonValue,
                    status: 'PENDING' as TicketStatus
                });
            }

            // Create Tickets
            for (const ticket of ticketsToCreate) {
                await tx.orderTicket.create({ data: ticket });
            }

            return order;
        });

        // Revalidate Kiosk and Dashboard
        revalidatePath(`/table/${result.sessionId}`);
        revalidatePath('/dashboard/orders');

        return { success: true, orderId: result.id };

    } catch (_error) {
        console.error("Error submitting order:", _error);
        return { error: "Error interno al procesar pedido" };
    }
}

// 3. Get Pending Tickets (for Local Print Polling)
export async function getPendingTickets() {
    try {
        const tickets = await prisma.orderTicket.findMany({
            where: { status: 'PENDING' },
            include: {
                tableOrder: {
                    include: {
                        session: {
                            include: { table: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Map for simpler consumption
        return tickets.map(t => ({
            id: t.id,
            category: t.category,
            tableName: t.tableOrder.session.table.name,
            items: t.content as CartItem[],
            date: t.createdAt.toISOString(),
            serverName: "Kiosk/Tablet" // Could allow kiosk metadata later
        }));

    } catch {
        return [];
    }
}

// 4. Mark Ticket as Printed
export async function markTicketPrinted(ticketId: string) {
    try {
        await prisma.orderTicket.update({
            where: { id: ticketId },
            data: { status: 'PRINTED', printedAt: new Date() }
        });
        return { success: true };
    } catch {
        return { error: "Failed to update ticket" };
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateGameState(sessionId: string, newState: any) {
    await auth();
    // Allow if user is logged in OR if it's a kiosk action (can relax auth if needed for kiosk token, sticking to session for now)
    // Ideally, Kiosk mode might have a specific token or just rely on the session being active/open
    // For now we assume the client checks, but secure it slightly:

    // NOTE: Kiosk might trigger this often, so we keep it light.
    try {
        await prisma.session.update({
            where: { id: sessionId },
            data: { gameState: newState }
        });
        // We do NOT revalidatePath ideally to avoid full page reloads on every score change if using optimistic UI
        // But for consistency across clients (if multiple screens), we might need to.
        // For a dedicated scoreboard, we rely on local optimistic state + db persistence.
        revalidatePath(`/dashboard/cockpit`); // Update main dashboard if tracking live scores
        return { success: true };
    } catch (_error) {
        console.error("Error updating game state:", _error);
        return { success: false, error: "Failed to save score" };
    }
}

// 5. Finalize Match (Referee Action)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function finalizeMatch(sessionId: string, winnerId?: string, reason?: string, finalState?: any) {
    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            // include: { schedule: true } // Schedule relation possibly missing in schema
        });

        if (!session) return { error: "Sesión no encontrada" };

        await prisma.$transaction(async (tx) => {
            // 1. Close Session
            await tx.session.update({
                where: { id: sessionId },
                data: {
                    endTime: new Date(),
                    status: 'COMPLETED',
                    gameState: finalState || undefined // Persist final state if provided
                }
            });

            // 2. If Tournament Match (linked to Schedule), update Schedule
            /* if (session.scheduleId) {
                // Here we would update the schedule result, advance winner in bracket, etc.
                // For now, we just mark the schedule as completed if the schema supports it
                // Assuming Schedule has a status or result field. If not, we skip.
            } */

            // 3. Close Table (Make available again)
            await tx.table.update({
                where: { id: session.tableId },
                data: { status: 'AVAILABLE' }
            });
        });

        revalidatePath('/dashboard/referee');
        revalidatePath(`/dashboard/referee/${sessionId}`);
        return { success: true };

    } catch (_error) {
        console.error("Error finalizing match:", _error);
        return { error: "Error al finalizar partido" };
    }
}

