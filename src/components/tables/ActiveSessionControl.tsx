/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ShoppingCart, DollarSign, StopCircle, RefreshCw, Plus, UserMinus } from "lucide-react";
import { SessionTimer } from './SessionTimer';
import { endSession, getPricingPreview } from "@/app/lib/actions-sessions";
import { leaveCardSession } from "@/app/lib/actions-card-tables";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { AddConsumptionDialog } from './AddConsumptionDialog';
import { CloseSessionDialog } from './CloseSessionDialog';
import { AddPlayerDialog } from './AddPlayerDialog';


// Interface must match what's passed from table.currentSession
interface ActiveSessionProps {
    table: {
        id: string;
        name: string;
        type: string;
        currentSession: any; // Using any for flexibility with serialized dates and mixed player structures
    };
    isOpen: boolean;
    onClose: () => void;
}

export function ActiveSessionControl({ table, isOpen, onClose }: ActiveSessionProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<any>(null); // Pricing preview data
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showAddConsumption, setShowAddConsumption] = useState(false);
    const [showCloseSession, setShowCloseSession] = useState(false);
    const [showAddPlayer, setShowAddPlayer] = useState(false);

    const session = table.currentSession;
    const isCardTable = table.type === 'CARDS';

    // Auto-refresh pricing preview every minute or when opened
    useEffect(() => {
        if (isOpen && session?.id) {
            loadPreview();
            const interval = setInterval(loadPreview, 60000); // Update every min
            return () => clearInterval(interval);
        }
    }, [isOpen, session?.id, refreshTrigger]);

    async function loadPreview() {
        if (!session?.id) return;
        try {
            const data = await getPricingPreview(session.id);
            setPreview(data);
        } catch (error) {
            console.error("Failed to load pricing", error);
        }
    }

    const handleLeaveSession = async (sessionPlayerId: string) => {
        if (!confirm('¿Retirar a este jugador de la mesa? Se calculará su deuda actual.')) return;

        setIsLoading(true);
        const result = await leaveCardSession(sessionPlayerId);
        setIsLoading(false);

        if (result.success) {
            toast.success(`Jugador retirado. Costo: $${result.cost}`);
            if (result.warning === 'ALERTA_MINIMO_JUGADORES') {
                toast.warning('¡Atención! La mesa ha quedado con menos del mínimo de jugadores.');
            }
            router.refresh();
            setRefreshTrigger(prev => prev + 1);
        } else {
            toast.error(result.error);
        }
    };

    if (!session) return null;

    // Determine players list (Backwards compatibility or new SessionPlayer model)
    // If sessionPlayers exists and has items, use it. Otherwise fallback to players JSON
    const activePlayers = (session.sessionPlayers && session.sessionPlayers.length > 0)
        ? session.sessionPlayers.filter((p: any) => p.status === 'ACTIVE')
        : (Array.isArray(session.players) ? session.players : []);

    const leftPlayers = (session.sessionPlayers || []).filter((p: any) => p.status === 'LEFT');

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-xl bg-slate-950 border-l border-white/10 text-white overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-2xl font-bold text-white flex gap-2 items-center">
                            {table.name}
                            <Badge variant="outline" className="ml-2 text-xs font-normal border-white/20">
                                {table.type.replace('_', ' ')}
                            </Badge>
                        </SheetTitle>
                        <Badge variant="secondary" className="bg-amber-900/50 text-amber-200 hover:bg-amber-900/50">
                            En Uso
                        </Badge>
                    </div>
                    <SheetDescription className="text-slate-400">
                        Control de sesión activa y consumo.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Timer Section */}
                    <div className="p-4 rounded-lg bg-slate-900/50 border border-white/5 flex flex-col items-center justify-center">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Tiempo de Mesa</span>
                        <div className="text-4xl font-mono font-bold text-amber-500 flex items-center gap-3">
                            <Clock className="w-8 h-8 opacity-50" />
                            <SessionTimer startTime={session.startTime} />
                        </div>
                    </div>

                    {/* Players Info */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium flex items-center gap-2 text-slate-300">
                                <Users className="w-4 h-4" /> Jugadores Activos
                            </h4>
                            {isCardTable && (
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-white/10" onClick={() => setShowAddPlayer(true)}>
                                    <Plus className="w-4 h-4 text-emerald-400" />
                                </Button>
                            )}
                        </div>

                        <div className="grid gap-2">
                            {activePlayers.map((p: any, idx: number) => (
                                <div key={idx} className="flex flex-col p-3 rounded bg-white/5 text-sm gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-emerald-100">
                                                {p.name || p.guestName || `Jugador ${idx + 1}`}
                                            </span>
                                            {p.role && <Badge variant="outline" className="text-[10px] h-5">{p.role}</Badge>}
                                        </div>
                                        {isCardTable && p.startTime && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-amber-400">
                                                    <SessionTimer startTime={p.startTime} />
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                    onClick={() => handleLeaveSession(p.id)}
                                                    title="Retirar Jugador"
                                                >
                                                    <UserMinus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {activePlayers.length === 0 && (
                                <div className="text-xs text-muted-foreground text-center py-2">Sin jugadores activos</div>
                            )}
                        </div>

                        {leftPlayers.length > 0 && (
                            <div className="mt-4 opacity-70">
                                <h5 className="text-xs font-semibold text-slate-500 mb-2 uppercase">Retirados</h5>
                                <div className="grid gap-1">
                                    {leftPlayers.map((p: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center px-2 py-1 rounded bg-slate-900/30 text-xs text-slate-400">
                                            <span>{p.name}</span>
                                            <span>${p.totalCost}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>



                    {/* Detailed Consumption Section */}
                    <div className="space-y-3 pr-12">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium flex items-center gap-2 text-slate-300">
                                <ShoppingCart className="w-4 h-4" /> Detalle de Consumo
                            </h4>
                        </div>

                        {/* 1. Table Orders (Pending Payment) */}
                        <div className="bg-slate-900/30 rounded border border-white/5 p-3 space-y-2">
                            <div className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
                                <span>Por Pagar (En Mesa)</span>
                                <span>Total: ${preview?.consumptionTotal || 0}</span>
                            </div>
                            {/* Prefer preview.pendingOrders (live from DB) over session.orders (prop) */}
                            {(!preview?.pendingOrders || (preview.pendingOrders as any[]).length === 0) ? (
                                (!session.orders || (session.orders as any[]).length === 0) ? (
                                    <div className="text-xs text-slate-600 italic">Sin pedidos pendientes.</div>
                                ) : (
                                    <div className="space-y-1">
                                        {(session.orders as any[]).map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between text-xs text-slate-300">
                                                <div className="flex flex-col">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    {item.orderedBy && (
                                                        <span className="text-[10px] text-emerald-400/80 italic">
                                                            ({item.orderedBy})
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-mono">${item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="space-y-1">
                                    {(preview.pendingOrders as any[]).map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-xs text-slate-300">
                                            <div className="flex flex-col">
                                                <span>{item.quantity}x {item.name}</span>
                                                {item.orderedBy && (
                                                    <span className="text-[10px] text-emerald-400/80 italic">
                                                        ({item.orderedBy})
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-mono">${item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Processed Sales (Fiado/Paid) */}
                        {preview?.processedSales && preview.processedSales.length > 0 && (
                            <div className="bg-slate-900/30 rounded border border-white/5 p-3 space-y-2">
                                <div className="text-xs font-semibold text-emerald-500/70 uppercase">Pagado / Cargado (Historial)</div>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                    {preview.processedSales.map((sale: any) => (
                                        <div key={sale.id} className="text-xs border-b border-white/5 last:border-0 pb-1 last:pb-0">
                                            <div className="flex justify-between text-slate-400 mb-0.5">
                                                <span>{sale.member?.name || sale.user?.name || 'Venta Directa'}</span>
                                                <span className="text-[10px]">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="pl-2 border-l-2 border-slate-700">
                                                {(sale.items as any[]).map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-slate-300">
                                                        <span>{item.quantity}x {item.name}</span>
                                                        <span className="font-mono text-slate-500">${item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Pricing Preview */}
                    <div className="space-y-3 pr-12">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium flex items-center gap-2 text-slate-300">
                                <DollarSign className="w-4 h-4" /> Detalle Total (Estimado)
                            </h4>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setPreview(null); loadPreview(); }}>
                                <RefreshCw className={`w-3 h-3 ${!preview ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>

                        {preview ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Tiempo Total</span>
                                    <span>${preview.timeCost}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Consumo Total</span>
                                    <span>${preview.consumptionTotal || 0}</span>
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="flex justify-between font-bold text-lg text-emerald-400">
                                    <span>Total Mesa</span>
                                    <span>${preview.total}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-xs text-muted-foreground">
                                Calculando tarifa...
                            </div>
                        )}
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="border-white/10 hover:bg-white/5 text-slate-300 relative"
                            onClick={() => setShowAddConsumption(true)}
                        >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Agregar Consumo
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-red-900/80 hover:bg-red-900 text-white"
                            onClick={() => {
                                loadPreview(); // Ensure latest data
                                setShowCloseSession(true);
                            }}
                            disabled={isLoading}
                        >
                            <StopCircle className="w-4 h-4 mr-2" />
                            Cerrar Mesa
                        </Button>
                    </div>
                </div>

                <SheetFooter className="mt-8">
                    {/* Footer content if needed */}
                </SheetFooter>
            </SheetContent>

            <AddConsumptionDialog
                sessionId={session.id}
                players={activePlayers}
                isCardTable={isCardTable}
                isOpen={showAddConsumption}
                onClose={() => setShowAddConsumption(false)}
                onSuccess={() => {
                    loadPreview(); // Refresh totals
                    router.refresh();
                }}
            />

            <CloseSessionDialog
                sessionId={session.id}
                tableName={table.name}
                preview={preview}
                isOpen={showCloseSession}
                onClose={() => setShowCloseSession(false)}
                onSuccess={() => {
                    onClose();
                    router.refresh();
                }}
            />

            <AddPlayerDialog
                sessionId={session.id}
                isOpen={showAddPlayer}
                onClose={() => setShowAddPlayer(false)}
                onSuccess={() => {
                    loadPreview();
                    router.refresh();
                }}
            />
        </Sheet >
    );
}
