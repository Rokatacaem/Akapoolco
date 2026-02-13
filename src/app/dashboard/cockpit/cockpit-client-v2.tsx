'use client';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { TableCard } from "@/components/tables/TableCard";
import { NewTableDialog } from "@/components/tables/NewTableDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { id: 'ALL', label: 'TODAS' },
    { id: 'POOL', label: 'POOL' },
];

interface CockpitClientProps {
    tables: any[];
    userRole: string | undefined;
    userName: string | undefined;
}

export function CockpitClient({ tables, userRole, userName }: CockpitClientProps) {
    const [activeTab, setActiveTab] = useState('ALL');
    const searchParams = useSearchParams();
    const openTableId = searchParams.get('openTable');

    // Filter tables: only show POOL tables, and apply tabs
    const visibleTables = tables.filter(t => t.type === 'POOL');

    const filteredTables = visibleTables.filter(table => {
        if (activeTab === 'ALL') return true;
        return table.type === activeTab;
    });

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-8 overflow-y-auto relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />

            <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                        Panel de Control (Mesas)
                    </h1>
                    <p className="text-slate-400 text-sm">Consola de Operaciones en Tiempo Real</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-white">{userName}</p>
                        <p className="text-xs text-emerald-400">Caja ABIERTA</p>
                    </div>
                    {(userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
                        <NewTableDialog />
                    )}
                    <div className="w-10 h-10 rounded-full bg-blue-900/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold">
                        {userName ? userName.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                </div>
            </header>

            <div className="relative z-10 mb-6">
                <Tabs defaultValue="ALL" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-slate-900/50 border border-white/10 p-1 mb-4 h-auto flex-wrap justify-start">
                        {CATEGORIES.map(cat => (
                            <TabsTrigger
                                key={cat.id}
                                value={cat.id}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md text-slate-400 hover:text-white hover:bg-white/5",
                                    activeTab === cat.id && "bg-emerald-600 text-white"
                                )}
                            >
                                {cat.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {filteredTables.map(table => (
                    <TableCard
                        key={table.id}
                        userRole={userRole}
                        table={table}
                        autoOpen={openTableId === table.id}
                    />
                ))}
                {filteredTables.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                        <p>No hay mesas de tipo {CATEGORIES.find(c => c.id === activeTab)?.label} disponibles.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
