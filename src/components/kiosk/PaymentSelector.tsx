'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payer {
    id: string; // sessionPlayerId
    name: string;
    isMember: boolean;
    image?: string | null;
}

interface PaymentSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    players: Payer[];
    onConfirm: (targetId?: string) => void;
    isSubmitting: boolean;
}

export function PaymentSelector({ isOpen, onClose, players, onConfirm, isSubmitting }: PaymentSelectorProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-slate-900 text-white border-white/10 sm:rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-center">Confirmar Pedido</DialogTitle>
                    <DialogDescription className="text-center text-slate-400">
                        Selecciona a quién cargar este consumo
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-4">
                    {/* Opción 1: MESA */}
                    <Button
                        variant="outline"
                        size="lg"
                        className={cn(
                            "h-20 justify-start text-lg border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500 transition-all",
                            "bg-emerald-950/20 text-emerald-100"
                        )}
                        onClick={() => onConfirm(undefined)}
                        disabled={isSubmitting}
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
                            <Users className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-semibold">Cuenta General (Mesa)</span>
                            <span className="text-xs text-emerald-400/70 font-normal">Se paga al cerrar la sesión</span>
                        </div>
                    </Button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink mx-4 text-[10px] tracking-widest text-slate-500 uppercase">O cargar a jugador</span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </div>

                    {/* Lista de Jugadores */}
                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {players.map(p => (
                            <Button
                                key={p.id}
                                variant="ghost"
                                className="h-16 justify-start bg-slate-800/50 hover:bg-blue-600/20 border border-transparent hover:border-blue-500/50"
                                onClick={() => onConfirm(p.id)}
                                disabled={isSubmitting}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3 font-bold text-sm shrink-0 overflow-hidden">
                                    {p.image ? (
                                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{p.name.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="flex flex-col items-start w-full overflow-hidden">
                                    <div className="flex items-center gap-2 w-full">
                                        <span className="truncate">{p.name}</span>
                                        {p.isMember && (
                                            <span className="shrink-0 text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 rounded-sm font-medium tracking-wider">
                                                SOCIO
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 font-normal">Cuenta Individual</span>
                                </div>
                                <div className="ml-auto opacity-0 group-hover:opacity-100">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center mt-2">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-slate-500 hover:text-white">
                        Cancelar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
