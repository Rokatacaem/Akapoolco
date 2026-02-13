'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Layers, CreditCard } from 'lucide-react';

interface StatCardsProps {
    stats: {
        shiftTotal: number;
        activeTables: number;
        totalTables: number;
        totalDebt: number;
    } | null;
}

export function StatCards({ stats }: StatCardsProps) {
    if (!stats) return <div className="text-white">Cargando métricas...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-slate-950 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                        Turno Actual
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">${stats.shiftTotal.toLocaleString('es-CL')}</div>
                    <p className="text-xs text-muted-foreground">
                        Ventas registradas hoy
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-slate-950 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                        Ocupación
                    </CardTitle>
                    <Layers className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">
                        {stats.activeTables} <span className="text-base font-normal text-slate-500">/ {stats.totalTables}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Mesas activas ahora
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-slate-950 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                        Deuda Total
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">${stats.totalDebt.toLocaleString('es-CL')}</div>
                    <p className="text-xs text-muted-foreground">
                        Cuentas por cobrar
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
