'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingTickets, markTicketPrinted } from '@/app/lib/actions-kiosk';
import { ThermalReceipt, TicketData } from './ThermalReceipt';
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from 'sonner';

export function PrintQueueManager() {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [loading, setLoading] = useState(false);
    const [printingTicketId, setPrintingTicketId] = useState<string | null>(null);

    // Polling Logic
    const fetchTickets = useCallback(async () => {
        setLoading(true);
        const pending = await getPendingTickets();
        setTickets(pending as any); // Cast for simplicity due to date string/date obj mismatch
        setLoading(false);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchTickets();
        const interval = setInterval(fetchTickets, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [fetchTickets]);

    const handlePrint = async (ticket: TicketData) => {
        setPrintingTicketId(ticket.id);

        // Wait for render update (in case we hide/show specific tickets, though here we render mapped)
        setTimeout(() => {
            window.print(); // Browser Print Dialog

            // In a real Kiosk setup:
            // 1. We might use a silent print extension/service.
            // 2. Here we ask confirmation or auto-confirm after print dialogue closes.

            // For this demo, we assume success after print dialog opens
            /* 
               Ideally, we show a "Did it print?" dialog. 
               For flow speed, I'll allow manual marking.
            */
        }, 500);
    };

    const confirmPrinted = async (ticketId: string) => {
        const res = await markTicketPrinted(ticketId);
        if (res.success) {
            toast.success("Ticket marcado como impreso");
            setTickets(prev => prev.filter(t => t.id !== ticketId));
            setPrintingTicketId(null);
        } else {
            toast.error("Error al actualizar estado");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8 no-print">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Printer className="w-8 h-8" />
                    Cola de Impresión
                </h1>
                <Button onClick={fetchTickets} variant="outline" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Queue Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
                {tickets.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                        No hay tickets pendientes
                    </div>
                )}

                {tickets.map(ticket => (
                    <div key={ticket.id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-100 p-3 border-b flex justify-between items-center">
                            <span className="font-bold text-sm">{ticket.category}</span>
                            <span className="text-xs text-slate-500">{ticket.date.substring(11, 16)}</span>
                        </div>

                        <div className="p-4 flex-grow flex justify-center bg-gray-50">
                            {/* Preview, scaled down visually */}
                            <div className="transform scale-90 origin-top">
                                <ThermalReceipt data={ticket} />
                            </div>
                        </div>

                        <div className="p-3 bg-white border-t flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => handlePrint(ticket)}
                            >
                                <Printer className="w-4 h-4 mr-2" />
                                Imprimir
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => confirmPrinted(ticket.id)}
                            >
                                <CheckCircle className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hidden Print Area - Only renders the 'printingTicketId' one to force single ticket print */}
            <div className="hidden print:block print:absolute print:top-0 print:left-0">
                {printingTicketId && tickets.find(t => t.id === printingTicketId) && (
                    <ThermalReceipt data={tickets.find(t => t.id === printingTicketId)!} />
                )}
            </div>

            <style jsx global>{`
                @media print {
                    /* Hide everything except the ticket container */
                    body * {
                        visibility: hidden;
                    }
                    .thermal-receipt, .thermal-receipt * {
                        visibility: visible;
                    }
                    .thermal-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
            `}</style>
        </div>
    );
}
