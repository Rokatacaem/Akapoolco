'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ActiveTableData {
    id: string;
    tableId: string;
    tableName: string;
    startTime: string; // ISO String
    playerCount: number;
}

export function ActiveTablesWidget({ tables }: { tables: ActiveTableData[] }) {
    // Client-side timer for "Time Elapsed" visual effect
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const getTimeElapsed = (start: Date) => {
        const diff = new Date().getTime() - new Date(start).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="bg-slate-950 border-white/10 h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-slate-200 text-lg">Mesas Activas</CardTitle>
                    <Link href="/dashboard/cockpit">
                        <Badge variant="outline" className="cursor-pointer hover:bg-white/10">Ver Todas</Badge>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-y-auto min-h-[150px] pr-3">
                {tables.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No hay mesas ocupadas.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tables.map(table => (
                            <div key={table.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-white/5 mr-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <div>
                                        <div className="font-semibold text-white">{table.tableName}</div>
                                        <div className="text-xs text-slate-400">{table.playerCount} Jugador{table.playerCount !== 1 ? 'es' : ''}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono text-emerald-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {getTimeElapsed(new Date(table.startTime))}
                                    </div>
                                    <Link href={`/dashboard/cockpit?openTable=${table.tableId}`}>
                                        <span className="text-[10px] text-blue-400 hover:underline cursor-pointer">Gestionar</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
