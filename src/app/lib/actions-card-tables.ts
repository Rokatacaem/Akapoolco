'use server';

import { prisma } from '@/lib/prisma';
import { TableStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { Prisma } from '@prisma/client';

// Tipos auxiliares
type PlayerInput = {
    userId?: string;
    guestName?: string;
};

// Eliminar constante hardcoded
// const HOURLY_RATE_PER_PERSON = 2000; 

export async function startCardSession(tableId: string, players: PlayerInput[]) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'No autorizado' };

    if (players.length < 2) {
        return { success: false, error: 'Se requieren mínimo 2 jugadores para iniciar' };
    }

    try {
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: { currentSession: true }
        });

        if (!table) return { success: false, error: 'Mesa no encontrada' };
        if (table.currentSession) return { success: false, error: 'Mesa ocupada' };

        // Obtener IDs de usuarios (ahora Members) registrados para buscar sus tipos
        const memberIds = players.map(p => p.userId).filter(Boolean) as string[];
        const members = await prisma.member.findMany({
            where: { id: { in: memberIds } },
            select: { id: true, type: true, name: true } // Fetch name too
        });

        // Map para búsqueda rápida de tipo de usuario
        const memberMap = new Map(members.map(m => [m.id, m]));

        await prisma.$transaction(async (tx) => {
            // 1. Crear Session
            const newSession = await tx.session.create({
                data: {
                    tableId,
                    startTime: new Date(),
                    status: 'ACTIVE',
                    isTraining: false,
                    // Creamos los SessionPlayers iniciales
                    sessionPlayers: {
                        create: players.map(p => {
                            let rate = table.priceClient; // Por defecto Cliente

                            let memberName = p.guestName;

                            if (p.userId) {
                                const member = memberMap.get(p.userId);
                                if (member) {
                                    // Si es socio o socio fundador, usa precio socio
                                    if (member.type === 'SOCIO' || member.type === 'SOCIO_FUNDADOR') {
                                        rate = table.priceMember;
                                    }
                                    if (!memberName) memberName = member.name; // Fallback/Snapshot key
                                }
                            }

                            return {
                                userId: undefined, // Clear legacy User ID
                                memberId: p.userId, // Map input ID to memberId
                                guestName: memberName,
                                startTime: new Date(),
                                status: 'ACTIVE',
                                hourlyRate: rate // Usar precio específico
                            };
                        })
                    }
                }
            });

            // 2. Ocupar Mesa
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
        console.error('Error starting card session:', error);
        return { success: false, error: 'Error al iniciar mesa de cartas' };
    }
}

export async function joinCardSession(sessionId: string, player: PlayerInput) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'No autorizado' };

    try {
        // Necesitamos la mesa para saber los precios
        const activeSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { table: true }
        });

        if (!activeSession || !activeSession.table) return { success: false, error: 'Sesión o mesa no encontrada' };

        let rate = activeSession.table.priceClient; // Default: precio cliente

        let guestName = player.guestName;

        if (player.userId) {
            const member = await prisma.member.findUnique({
                where: { id: player.userId },
                select: { type: true, name: true }
            });
            if (member) {
                if (member.type === 'SOCIO' || member.type === 'SOCIO_FUNDADOR') {
                    rate = activeSession.table.priceMember;
                }
                if (!guestName) guestName = member.name;
            }
        }

        await prisma.sessionPlayer.create({
            data: {
                sessionId,
                userId: undefined,
                memberId: player.userId, // Link to Member
                guestName: guestName,
                startTime: new Date(),
                status: 'ACTIVE',
                hourlyRate: rate
            }
        });

        revalidatePath('/dashboard/tables');
        return { success: true };
    } catch (error) {
        console.error('Error joining session:', error);
        return { success: false, error: 'Error al agregar jugador' };
    }
}

export async function leaveCardSession(sessionPlayerId: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'No autorizado' };

    try {
        // 1. Obtener datos del jugador y sesión
        const sPlayer = await prisma.sessionPlayer.findUnique({
            where: { id: sessionPlayerId },
            include: { session: true }
        });

        if (!sPlayer || sPlayer.endTime) return { success: false, error: 'Jugador no encontrado o ya retirado' };

        const endTime = new Date();
        const startTime = new Date(sPlayer.startTime);

        // Cálculo Costo
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = durationMs / 1000 / 60 / 60;
        const rate = Number(sPlayer.hourlyRate);

        // Regla de Cobro: (Hora Salida - Hora Entrada) * Tarifa
        // Mínimo? Podríamos cobrar mínimo 15 mins o algo, pero la regla dice "Exactamente lo justo"
        const cost = Math.ceil(durationHours * rate);

        // Actualizar SessionPlayer
        await prisma.sessionPlayer.update({
            where: { id: sessionPlayerId },
            data: {
                endTime,
                status: 'LEFT',
                totalCost: new Prisma.Decimal(cost)
            }
        });

        // Verificar Mínimo de jugadores en mesa
        const activeCount = await prisma.sessionPlayer.count({
            where: {
                sessionId: sPlayer.sessionId,
                status: 'ACTIVE'
            }
        });

        revalidatePath('/dashboard/tables');

        return {
            success: true,
            cost,
            warning: activeCount < 2 ? 'ALERTA_MINIMO_JUGADORES' : null
        };

    } catch (error) {
        console.error('Error leaving session:', error);
        return { success: false, error: 'Error al retirar jugador' };
    }
}

export async function addOrderToPlayer(sessionId: string, sessionPlayerId: string, items: { productId: string, name: string, price: number, quantity: number }[]) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'No autorizado' };

    try {
        const activeSession = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { orders: true, status: true }
        });

        if (!activeSession || activeSession.status !== 'ACTIVE') {
            return { success: false, error: 'Sesión no activa' };
        }

        // 1. Deduct Stock (Always)
        for (const item of items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } }
            });
            // Log Movement
            await prisma.stockMovement.create({
                data: {
                    productId: item.productId,
                    type: 'ADJUSTMENT',
                    quantity: -item.quantity,
                    reason: `Consumo Jugador Mesa Carta (Session ${sessionId})`,
                    userId: session.user.id
                }
            });
        }

        // 2. Add to Session Orders with Player Tag
        const currentOrders = (activeSession.orders as any[]) || [];
        const newOrders = [
            ...currentOrders,
            ...items.map(item => ({
                ...item,
                sessionPlayerId, // Link to the specific player in the session
                addedAt: new Date().toISOString()
            }))
        ];

        await prisma.session.update({
            where: { id: sessionId },
            data: { orders: newOrders }
        });

        revalidatePath('/dashboard/tables');
        return { success: true };

    } catch (error) {
        console.error('Error adding order to player:', error);
        return { success: false, error: 'Error al agregar consumo' };
    }
}
