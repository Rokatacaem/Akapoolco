/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, Monitor } from 'lucide-react';
import { SessionTimer } from './SessionTimer';
import { OpenTableDialog } from './OpenTableDialog';
import { ActiveSessionControl } from './ActiveSessionControl';
import { EditTableDialog } from './EditTableDialog';
import { Button } from '@/components/ui/button';

// Match the type from actions-tables (serialized)
interface TableWithSession {
    id: string;
    name: string;
    type: string;
    status: string;
    hourlyRate?: number;
    priceMember?: number;
    priceClient?: number;
    currentSession: {
        id: string;
        startTime: string;
        endTime?: string | null;
        [key: string]: any;
    } | null;
}

interface TableCardProps {
    table: TableWithSession;
    userRole?: string;
    autoOpen?: boolean;
}

export function TableCard({ table, userRole, autoOpen }: TableCardProps) {
    const isAvailable = table.status === 'AVAILABLE';
    const [showOpenDialog, setShowOpenDialog] = useState(false);
    const [showControlSheet, setShowControlSheet] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const [estimatedCost, setEstimatedCost] = useState(0);

    // Auto-open if requested via URL
    useEffect(() => {
        if (autoOpen) {
            if (isAvailable) {
                setTimeout(() => setShowOpenDialog(true), 0);
            } else if (table.currentSession) {
                setTimeout(() => setShowControlSheet(true), 0);
            }
        }
    }, [autoOpen, isAvailable, table.currentSession]);

    // Simple ticker for estimated cost in card
    useEffect(() => {
        if (table.currentSession && !isAvailable) {
            const calculateEstimate = () => {
                const start = new Date(table.currentSession!.startTime);
                const now = new Date();
                const durationHours = (now.getTime() - start.getTime()) / 1000 / 60 / 60;

                // Simplified estimate: uses client price of table (or member if we knew)..
                // Just as a visual guide.
                const rate = Number(table.priceClient) || 4000;
                setEstimatedCost(Math.ceil(durationHours * rate));
            };
            // Initial calculation
            setTimeout(calculateEstimate, 0);

            const interval = setInterval(calculateEstimate, 60000);
            return () => clearInterval(interval);
        }
    }, [table.currentSession, isAvailable, table.priceClient]);


    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERUSER';

    const handleClick = () => {
        if (isAvailable) {
            setShowOpenDialog(true);
        } else if (table.status === 'OCCUPIED' && table.currentSession) {
            setShowControlSheet(true);
        }
    };

    return (
        <>
            <Card
                className={`hover:shadow-md transition-shadow cursor-pointer relative group ${isAvailable ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-amber-500'
                    }`}
                onClick={handleClick}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            {table.name}
                            {table.type !== 'CARDS' && table.type !== 'POKER' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-500 hover:text-emerald-400"
                                    title="Abrir Pantalla / Marcador"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/table/${table.id}`, '_blank');
                                    }}
                                >
                                    <Monitor className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        {isAdmin && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white hover:bg-slate-800"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEditDialog(true);
                                }}
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <Badge variant="outline" className="text-[10px] font-normal border-slate-700 text-slate-400">
                            {table.status === 'AVAILABLE' ? 'Disponible' : 'Ocupada'}
                        </Badge>
                        <span className="text-xs text-muted-foreground uppercase">{table.type.replace('_', ' ')}</span>
                    </div>

                    <div className="flex flex-col gap-1 text-xs text-slate-500 mb-2">
                        {table.priceClient && (
                            <div className="flex justify-between">
                                <span>Cliente:</span>
                                <span className="font-mono text-slate-300">${Number(table.priceClient).toLocaleString('es-CL')}</span>
                            </div>
                        )}
                        {table.priceMember && (
                            <div className="flex justify-between">
                                <span>Socio:</span>
                                <span className="font-mono text-emerald-400">${Number(table.priceMember).toLocaleString('es-CL')}</span>
                            </div>
                        )}
                    </div>

                    {!isAvailable && table.currentSession ? (
                        <div className="flex items-center space-x-2 text-amber-600 font-mono text-xl justify-center mt-2">
                            <Clock className="w-5 h-5" />
                            <SessionTimer startTime={table.currentSession.startTime} />
                        </div>
                    ) : (
                        <div className="text-sm text-green-600 font-medium flex items-center justify-center h-[28px] mt-2">
                            Lista para usar
                        </div>
                    )}

                    {!isAvailable && table.currentSession && table.type !== 'CARDS' && (
                        <div className="text-[10px] text-slate-500 text-center mt-1">
                            ~${estimatedCost.toLocaleString()} (Est.)
                        </div>
                    )}
                </CardContent>
            </Card>

            <OpenTableDialog
                tableId={table.id}
                tableName={table.name}
                tableType={table.type}
                priceClient={table.priceClient}
                priceMember={table.priceMember}
                isOpen={showOpenDialog}
                onClose={() => setShowOpenDialog(false)}
            />

            <ActiveSessionControl
                table={table}
                isOpen={showControlSheet}
                onClose={() => setShowControlSheet(false)}
            />

            <EditTableDialog
                table={table}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />
        </>
    );
}
