/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { prisma } from '@/lib/prisma';
import { TableStatus, TableType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { SessionData } from '@/lib/types';
import { Prisma } from '@prisma/client';
import { validateActiveShift } from './business-rules';

const FALLBACK_HOURLY_RATE = 4000;
const FALLBACK_MEMBER_RATE = 2000;

// Helper to extract rates from a Table object
function getTableRates(table: any) {
    return {
        client: Number(table.priceClient) || FALLBACK_HOURLY_RATE,
        member: Number(table.priceMember) || FALLBACK_MEMBER_RATE
    };
}

// Unified Logic for Cost Calculation
async function calculateSessionCost(activeSession: any) {
    const endTime = new Date();
    const rates = getTableRates(activeSession.table);

    let totalAmount = 0;
    let durationMin = 0;
    let timeCost = 0;

    // --- CARDS LOGIC (Individual Billing) ---
    if (activeSession.table.type === 'CARDS') {
        const start = new Date(activeSession.startTime);
        durationMin = Math.ceil((endTime.getTime() - start.getTime()) / 1000 / 60);

        // Try to use Relational SessionPlayers first (New Model)
        if (activeSession.sessionPlayers && activeSession.sessionPlayers.length > 0) {
            const sPlayers = activeSession.sessionPlayers.filter((p: any) => p.status === 'ACTIVE' || p.status === 'LEFT');

            sPlayers.forEach((p: any) => {
                // If player already left, use their stored cost. If active, calculate current cost.
                if (p.status === 'LEFT') {
                    totalAmount += Number(p.totalCost || 0);
                } else {
                    const pStart = new Date(p.startTime);
                    const pDurationMs = endTime.getTime() - pStart.getTime();
                    const pHours = pDurationMs / 1000 / 60 / 60;
                    // Use player's stored hourlyRate (snapshot) or fallback to table rate logic
                    const pRate = Number(p.hourlyRate) || rates.client;

                    totalAmount += Math.ceil(pHours * pRate);
                }
            });
        }
        // Fallback to JSON players (Legacy) - TO BE REMOVED eventually
        else {
            const players = (activeSession.players as any[]) || [];
            players.forEach(player => {
                if (player.startTime) {
                    const pStart = new Date(player.startTime);
                    const pDurationMs = endTime.getTime() - pStart.getTime();
                    const pHours = pDurationMs / 1000 / 60 / 60;

                    // Use Member type for rate logic if linked
                    const memberType = player.member?.type || 'CLIENTE'; // Need to ensure member is fetched
                    let pRate = (memberType === 'SOCIO' || memberType === 'SOCIO_FUNDADOR') ? rates.member : rates.client;
                    if (activeSession.isTraining) pRate *= 0.5;

                    totalAmount += Math.ceil(pHours * pRate);
                }
            });
        }
    }
    // --- POOL / SNOOKER LOGIC (Table Billing) ---
    else {
        const start = new Date(activeSession.startTime);
        const durationMs = endTime.getTime() - start.getTime();
        durationMin = Math.ceil(durationMs / 1000 / 60);
        const hours = durationMs / 1000 / 60 / 60;

        let rate = rates.client;

        // Check relational sessionPlayers for Members
        // We assume sessionPlayers are populated for Pool/Snooker too in new logic? 
        // Or we check the legacy JSON "players" which might have memberId now.
        // Let's check sessionPlayers (Relational) because startSession should create them.

        let hasMember = false;
        if (activeSession.sessionPlayers && activeSession.sessionPlayers.length > 0) {
            hasMember = activeSession.sessionPlayers.some((p: any) =>
                p.member?.type === 'SOCIO' || p.member?.type === 'SOCIO_FUNDADOR'
            );
        } else {
            // Fallback JSON (Legacy)
            const players = (activeSession.players as any[]) || [];
            hasMember = players.some((p: any) => p.role === 'SOCIO' || p.role === 'SOCIO_FUNDADOR');
        }

        if (hasMember) {
            rate = rates.member;
        }

        if (activeSession.isTraining) rate *= 0.5;

        timeCost = Math.ceil(hours * rate);
        totalAmount = timeCost;
    }

    // --- CONSUMPTION ---
    let consumptionTotal = 0;
    const orders = (activeSession.orders as any[]) || [];
    orders.forEach(item => {
        consumptionTotal += (item.price * item.quantity);
    });

    return {
        total: Math.ceil(totalAmount + consumptionTotal),
        timeCost: Math.ceil(totalAmount), // For Cards, this is sum of all players time costs
        consumptionTotal: consumptionTotal,
        duration: durationMin,
        endTime,
        appliedRate: activeSession.table.type === 'CARDS' ? 'INDIVIDUAL' : (activeSession.isTraining ? 'ENTRENAMIENTO' : (totalAmount < (durationMin / 60 * rates.client) ? 'SOCIO' : 'CLIENTE'))
    };
}

export async function startSession(tableId: string, data: SessionData) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await validateActiveShift();
    } catch (error: any) {
        return { success: false, error: error.message };
    }

    try {
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: { currentSession: true }
        });

        if (!table) {
            return { success: false, error: 'Mesa no encontrada' };
        }

        if (table.currentSession) {
            return { success: false, error: 'La mesa ya tiene una sesión activa' };
        }

        // Create Start Time constant
        const startTime = new Date();

        // Prepare Player Data (Relational SessionPlayer creation needs to happen inside transaction)
        // We just prepare the JSON for legacy support if needed, but the main logic is creating SessionPlayer relations.
        const playersJSON = (data.players || []).map((p: any) => ({
            ...p,
            startTime: startTime.toISOString(),
            isActive: true
        }));

        await prisma.$transaction(async (tx) => {
            const newSession = await tx.session.create({
                data: {
                    tableId: tableId,
                    startTime: startTime,
                    status: 'ACTIVE',
                    players: playersJSON as unknown as Prisma.InputJsonValue,
                    isTraining: data.isTraining,
                }
            });

            // Create SessionPlayers
            // data.players contains { id, name, role? } where id is memberId if registered
            if (data.players && data.players.length > 0) {
                for (const p of data.players) {
                    const isMember = p.id && String(p.id).length > 5;
                    const memberId = isMember ? String(p.id) : null;
                    // Always save name as snapshot/guestName for redundancy
                    const guestName = String(p.name);

                    await tx.sessionPlayer.create({
                        data: {
                            sessionId: newSession.id,
                            userId: null,
                            memberId: memberId,
                            guestName: guestName,
                            startTime: startTime,
                            status: 'ACTIVE'
                        }
                    });
                }
            }

            await tx.table.update({
                where: { id: tableId },
                data: {
                    status: TableStatus.OCCUPIED,
                    currentSessionId: newSession.id
                }
            });
        });

        revalidatePath('/dashboard/tables');
        return { success: true };
    } catch (error) {
        console.error('Error starting session:', error);
        return { success: false, error: 'Error al abrir la mesa' };
    }
}

export async function addSessionConsumption(sessionId: string, items: { productId: string, name: string, price: number, quantity: number }[], targetUserId?: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'No autorizado' };

    try {
        await validateActiveShift();
    } catch (error: any) {
        return { success: false, error: error.message };
    }

    try {
        const activeSession = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { orders: true, status: true }
        });

        if (!activeSession || activeSession.status !== 'ACTIVE') {
            return { success: false, error: 'Sesión no activa' };
        }

        // Fetch Active Shift
        const activeShift = await prisma.shift.findFirst({ where: { status: 'OPEN' } });

        await prisma.$transaction(async (tx) => {
            // 1. Deduct Stock (Always)
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });

                // Log Movement
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'ADJUSTMENT',
                        quantity: -item.quantity,
                        reason: `Consumo ${targetUserId ? 'Jugador' : 'Mesa'} (Session ${sessionId})`,
                        userId: session.user.id
                    }
                });
            }

            // 2. Charge Logic
            if (targetUserId) {
                // targetUserId is effectively targetMemberId now
                const memberId = targetUserId;

                const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                // Create Sale associated with Member
                await tx.sale.create({
                    data: {
                        sessionId: sessionId,
                        userId: undefined,
                        memberId: memberId,
                        total: new Prisma.Decimal(total),
                        method: 'ACCOUNT',
                        shiftId: activeShift?.id, // Link to Active Shift
                        items: items as unknown as Prisma.InputJsonValue
                    }
                });

                // Update Member Debt
                await tx.member.update({
                    where: { id: memberId },
                    data: { currentDebt: { increment: total } }
                });

            } else {
                // Charge to Table (Add to Orders)
                const currentOrders = (activeSession.orders as any[]) || [];
                const newOrders = [...currentOrders, ...items];

                // Consider migrating this to TableOrder eventually
                await tx.session.update({
                    where: { id: sessionId },
                    data: { orders: newOrders }
                });
            }
        });

        revalidatePath('/dashboard/tables');
        return { success: true };
    } catch (error: any) {
        console.error('Error adding consumption:', error);
        return { success: false, error: error.message || 'Error desconocido al agregar consumo' };
    }
}

export async function getPricingPreview(sessionId: string) {
    try {
        const activeSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                table: true,
                sessionPlayers: {
                    include: { member: true }
                }
            }
        });

        if (!activeSession || activeSession.status !== 'ACTIVE') {
            return { success: false, error: 'Sesión no válida' };
        }

        const calculation = await calculateSessionCost(activeSession);

        // Fetch Processed Sales (Fiado/Direct charges linked to this session)
        const processedSales = await prisma.sale.findMany({
            where: {
                sessionId: sessionId,
                type: 'CONSUMPTION'
            },
            include: {
                member: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return {
            success: true,
            ...calculation,
            processedSales,
            pendingOrders: activeSession.orders // Sync fix: Return actual items from DB
        };
    } catch (error) {
        console.error('Error calculating preview:', error);
        return { success: false, error: 'Error al calcular precio' };
    }
}

export async function endSession(sessionId: string, payments?: { amount: number, method: string, userId?: string }[]) {
    const session = await auth();
    if (!session?.user) {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await validateActiveShift();
    } catch (error: any) {
        return { success: false, error: error.message };
    }

    try {
        const activeSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                table: true,
                sessionPlayers: {
                    include: { member: true }
                }
            }
        });

        if (!activeSession || activeSession.status !== 'ACTIVE') {
            return { success: false, error: 'Sesión no válida o ya cerrada' };
        }

        const endTime = new Date();
        const calculation = await calculateSessionCost(activeSession);

        const totalToPay = calculation.total;

        // Payment Validation
        if (payments && payments.length > 0) {
            const sum = payments.reduce((acc, p) => acc + p.amount, 0);
            // Allow small margin error? No, exact matches.
            if (Math.abs(sum - totalToPay) > 50) { // Tolerance 50 pesos
                return { success: false, error: `El total de pagos ($${sum}) no coincide con el total a pagar ($${totalToPay})` };
            }
        } else {
            // Default 1 payment cash/generic if not provided (Legacy fallback)
            payments = [{ amount: totalToPay, method: 'CASH' }];
        }

        // Fetch Active Shift
        const activeShift = await prisma.shift.findFirst({ where: { status: 'OPEN' } });

        await prisma.$transaction(async (tx) => {
            // 1. Close Session
            await tx.session.update({
                where: { id: sessionId },
                data: {
                    endTime: endTime,
                    status: 'CLOSED',
                    durationMin: calculation.duration,
                    totalAmount: new Prisma.Decimal(totalToPay)
                }
            });

            // 2. Free Table
            await tx.table.update({
                where: { id: activeSession.tableId },
                data: {
                    status: TableStatus.AVAILABLE,
                    currentSessionId: null
                }
            });

            // 3. Create Sales (Split Payments)
            // ... (Orders logic kept same)

            for (const payment of payments!) {
                await tx.sale.create({
                    data: {
                        sessionId: sessionId,
                        total: new Prisma.Decimal(payment.amount),
                        method: payment.method,
                        userId: undefined,
                        memberId: payment.userId,
                        shiftId: activeShift?.id, // Link to Active Shift
                        items: [
                            { name: "Cierre de Mesa (Pago Parcial/Total)", price: payment.amount, quantity: 1 }
                        ]
                    }
                });

                // If ACCOUNT payment (Fiado), increment Debt on Member
                if (payment.method === 'ACCOUNT' && payment.userId) {
                    await tx.member.update({
                        where: { id: payment.userId }, // Assuming payment.userId is memberId passed from frontend
                        data: { currentDebt: { increment: payment.amount } }
                    });
                }
            }
        });

        revalidatePath('/dashboard/tables');
        return { success: true, total: totalToPay };

    } catch (error: any) {
        console.error('Error ending session:', error);
        return { success: false, error: 'Error al cerrar la mesa: ' + error.message };
    }
}

export async function getActiveSession(tableId: string) {
    try {
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: {
                currentSession: true
            }
        });

        if (!table?.currentSession) return null;

        return {
            ...table.currentSession,
            players: table.currentSession.players as unknown as SessionData['players']
        };
    } catch (error) {
        return null;
    }
}




