'use client';

import React from 'react';
import { PrintCategory } from "@prisma/client";

export interface TicketData {
    id: string; // Ticket ID
    tableName: string;
    serverName: string; // "Tablet 1" or User Name
    date: string; // ISO String
    category: PrintCategory; // 'BAR' | 'KITCHEN'
    items: {
        name: string;
        quantity: number;
        note?: string
    }[];
}

interface ThermalReceiptProps {
    data: TicketData;
}

export function ThermalReceipt({ data }: ThermalReceiptProps) {
    // Format date nicely
    const dateObj = new Date(data.date);
    const dateStr = dateObj.toLocaleDateString('es-CL');
    const timeStr = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    return (
        <div id={`ticket-${data.id}`} className="thermal-receipt p-2 font-mono text-black bg-white w-[300px] text-xs leading-tight mx-auto mb-8 border border-gray-200 shadow-sm print:shadow-none print:border-none print:mx-0 print:mb-0">
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: 80mm auto; }
                    body { margin: 0; padding: 0; background: white; }
                    .thermal-receipt { width: 100%; max-width: 80mm; border: none; shadow: none; }
                    .no-print { display: none !important; }
                }
            `}</style>

            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-black pb-2 mb-2">
                <h1 className="text-xl font-black uppercase tracking-wider">
                    *** {data.category === 'KITCHEN' ? 'COCINA' : data.category} ***
                </h1>
                <p className="text-base font-bold mt-1">{data.tableName}</p>
                <div className="flex justify-between text-[10px] mt-1 px-1">
                    <span>{dateStr} {timeStr}</span>
                    <span>{data.serverName}</span>
                </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2 mb-4">
                {data.items.map((item, idx) => (
                    <div key={idx} className="mb-1">
                        <div className="flex justify-between font-bold text-sm items-start">
                            <span className="mr-2">{item.quantity}</span>
                            <span className="flex-grow text-left">{item.name}</span>
                        </div>
                        {item.note && (
                            <div className="pl-6 text-[11px] italic font-bold uppercase mt-0.5">
                                ** {item.note}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-dashed border-black pt-2 text-center text-[10px]">
                <p>Club Santiago BSM</p>
                <p className="text-[9px] text-gray-500 mt-1">Ticket #{data.id.slice(-6).toUpperCase()}</p>
                <p className="mt-8 text-transparent select-none">.</p> {/* Padding final para corte */}
            </div>
        </div>
    );
}
