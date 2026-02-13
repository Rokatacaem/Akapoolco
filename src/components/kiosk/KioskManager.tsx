'use client';

import { useTableSync } from '@/hooks/useTableSync';
import { IdleScreen } from './IdleScreen';
import { ActiveScreen } from './ActiveScreen';
import { Loader2 } from 'lucide-react';

interface KioskManagerProps {
    tableId: string;
    initialData: any;
}

export function KioskManager({ tableId, initialData }: KioskManagerProps) {
    const { status, sessionData, ads } = useTableSync(tableId, initialData);

    // STATES
    if (status === 'AVAILABLE' || status === 'RESERVED') {
        return <IdleScreen
            ads={ads}
            tableName={initialData.tableName}
            tableType={initialData.tableType}
        />;
    }

    if (status === 'OCCUPIED' && sessionData) {
        return <ActiveScreen session={sessionData} />;
    }

    if (status === 'CLEANING') {
        return (
            <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center text-white">
                <div className="animate-spin mb-4">
                    <Loader2 className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold">Preparando Mesa...</h2>
            </div>
        );
    }

    // Default Loading / Error
    return (
        <div className="h-screen w-full bg-black flex items-center justify-center text-slate-500">
            <span className="animate-pulse">Cargando Sistema...</span>
        </div>
    );
}
