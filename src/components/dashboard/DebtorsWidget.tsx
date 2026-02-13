'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Banknote } from "lucide-react";
import { useState } from "react";
import { DebtPaymentDialog } from "@/components/shifts/DebtPaymentDialog";
import { useRouter } from "next/navigation";

interface Debtor {
    id: string;
    name: string;
    currentDebt: number; // Decimal string or number
    image: string | null;
}

export function DebtorsWidget({ debtors }: { debtors: Debtor[] }) {
    const [showPayDialog, setShowPayDialog] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
    const router = useRouter();

    const handlePayClick = (debtor?: Debtor) => {
        setSelectedDebtor(debtor || null);
        setShowPayDialog(true);
    };

    return (
        <>
            <Card className="bg-slate-950 border-white/10 h-full border-t-red-900/50 border-t-2 flex flex-col">
                <CardHeader className="pb-3">
                    <CardTitle className="text-slate-200 text-lg flex justify-between items-center">
                        <span>Cobranza (Top 10)</span>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950"
                            onClick={() => handlePayClick()}
                        >
                            <Banknote className="h-4 w-4" />
                            <span className="sr-only">Pagar</span>
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 overflow-y-auto min-h-[300px] pr-2 scrollbar-hide">
                    {debtors.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            No hay deudores registrados.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {debtors.map((debtor) => (
                                <div
                                    key={debtor.id}
                                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-all group border border-transparent hover:border-white/5 gap-3 cursor-pointer"
                                    onClick={() => handlePayClick(debtor)}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <Avatar className="h-9 w-9 border border-white/10 shadow-sm flex-shrink-0">
                                            <AvatarImage src={debtor.image || undefined} />
                                            <AvatarFallback className="text-xs bg-indigo-950/50 text-indigo-300 font-medium">
                                                {debtor.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate" title={debtor.name}>
                                                {debtor.name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider truncate">Cliente</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-sm font-bold text-red-400">
                                            ${Number(debtor.currentDebt).toLocaleString('es-CL')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <DebtPaymentDialog
                isOpen={showPayDialog}
                onClose={() => setShowPayDialog(false)}
                onSuccess={() => router.refresh()}
                initialUser={selectedDebtor}
            />
        </>
    );
}
