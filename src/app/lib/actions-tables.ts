'use server';

import { prisma } from '@/lib/prisma'; // Corrected import
import { TableType, TableStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export async function createTable(data: { name: string; type: TableType; hourlyRate?: number; priceMember: number; priceClient: number }) {
    const session = await auth();
    if (session?.user?.role !== 'SUPERUSER' && session?.user?.role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Se requiere rol de Admin o Super Usuario' };
    }

    try {
        const table = await prisma.table.create({
            data: {
                name: data.name,
                type: data.type,
                status: TableStatus.AVAILABLE,
                hourlyRate: data.hourlyRate || data.priceClient, // Fallback logic
                priceMember: data.priceMember,
                priceClient: data.priceClient
            },
        });
        revalidatePath('/dashboard/tables');
        return { success: true, table };
    } catch (error) {
        console.error('Error creating table:', error);
        return { success: false, error: 'Error al crear la mesa' };
    }
}

export async function updateTable(id: string, data: { name: string; type: TableType; priceMember: number; priceClient: number }) {
    const session = await auth();
    if (session?.user?.role !== 'SUPERUSER' && session?.user?.role !== 'ADMIN') {
        return { success: false, error: 'No autorizado: Se requiere rol de Admin o Super Usuario' };
    }

    try {
        const table = await prisma.table.update({
            where: { id },
            data: {
                name: data.name,
                type: data.type,
                priceMember: data.priceMember,
                priceClient: data.priceClient,
                hourlyRate: data.priceClient // Keep consistent
            },
        });
        revalidatePath('/dashboard/tables');
        return { success: true, table };
    } catch (error) {
        console.error('Error updating table:', error);
        return { success: false, error: 'Error al actualizar la mesa' };
    }
}

export async function getTables() {
    try {
        const tables = await prisma.table.findMany({
            orderBy: { name: 'asc' },
            include: {
                currentSession: {
                    include: {
                        sessionPlayers: {
                            include: {
                                user: { select: { name: true, image: true, email: true } },
                                member: { select: { name: true } }
                            }
                        }
                    }
                },
            },
        });

        // Serialize dates for Client Components
        return tables.map(table => ({
            ...table,
            type: table.type.toString(), // Explicit conversion
            status: table.status.toString(),
            hourlyRate: Number(table.hourlyRate),
            priceMember: Number(table.priceMember),
            priceClient: Number(table.priceClient),
            currentSession: table.currentSession ? {
                ...table.currentSession,
                startTime: table.currentSession.startTime.toISOString(),
                endTime: table.currentSession.endTime?.toISOString() || null,
                createdAt: table.currentSession.createdAt.toISOString(),
                updatedAt: table.currentSession.updatedAt.toISOString(),
                totalAmount: Number(table.currentSession.totalAmount.toString()),
                sessionPlayers: table.currentSession.sessionPlayers.map(sp => ({
                    ...sp,
                    startTime: sp.startTime.toISOString(),
                    endTime: sp.endTime?.toISOString() || null,
                    createdAt: sp.createdAt.toISOString(),
                    updatedAt: sp.updatedAt.toISOString(),
                    hourlyRate: Number(sp.hourlyRate),
                    totalCost: Number(sp.totalCost),
                    // Flatten user name for easy display. Priority: User > Member > GuestName
                    name: (sp.user && sp.user.name) ? sp.user.name : ((sp.member && sp.member.name) ? sp.member.name : (sp.guestName || 'Desconocido')),
                    guestName: sp.guestName // Ensure this is passed through explicitly
                }))
            } : null,
        }));
    } catch (error) {
        console.error('Error fetching tables:', error);
        return [];
    }
}

export async function deleteTable(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { success: false, error: 'No autorizado' };
    }

    try {
        await prisma.table.delete({ where: { id } });
        revalidatePath('/dashboard/tables');
        return { success: true };
    } catch (error) {
        console.error('Error deleting table:', error);
        return { success: false, error: 'Error al eliminar la mesa' };
    }
}
