'use server';

import { prisma } from '@/lib/prisma';
import { unstable_noStore as noStore } from 'next/cache';

export async function getDashboardStats() {
    noStore(); // Dynamic data
    try {
        // 1. Shift Stats (Active Shift)
        const activeShift = await prisma.shift.findFirst({
            where: { status: 'OPEN' },
            include: { sales: true }
        });

        const shiftTotal = activeShift?.sales.reduce((acc, sale) => acc + Number(sale.total), 0) || 0;

        // 2. Active Tables
        const activeTablesCount = await prisma.session.count({
            where: { status: 'ACTIVE' }
        });

        const totalTables = await prisma.table.count();

        // 3. Total Debt
        const debtAgg = await prisma.user.aggregate({
            _sum: { currentDebt: true },
            where: { currentDebt: { gt: 0 } }
        });

        return {
            shiftTotal,
            activeTables: activeTablesCount,
            totalTables,
            totalDebt: Number(debtAgg._sum.currentDebt || 0)
        };
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return null;
    }
}

export async function getDebtorsWatchlist() {
    noStore();
    try {
        const debtors = await prisma.user.findMany({
            where: { currentDebt: { gt: 0 } },
            orderBy: { currentDebt: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                currentDebt: true,
                image: true
            }
        });
        return debtors;
    } catch (error) {
        return [];
    }
}

export async function getActiveTablesSummary() {
    noStore();
    try {
        const sessions = await prisma.session.findMany({
            where: { status: 'ACTIVE' },
            include: {
                table: { select: { name: true } },
                sessionPlayers: true // Just count them
            },
            orderBy: { startTime: 'desc' }
        });

        // Simple summary mapping
        return (sessions as any[]).map(s => ({
            id: s.id,
            tableId: s.tableId,
            tableName: s.table.name,
            startTime: s.startTime.toISOString(), // Serialize for safe transport
            totalAmount: Number(s.totalAmount),
            playerCount: s.sessionPlayers.length
        }));
    } catch (error) {
        return [];
    }
}
