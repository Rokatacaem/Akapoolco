'use client';

import { useState, useEffect, useRef } from 'react';
import { getKioskState } from '@/app/lib/actions-kiosk';

// Types for the hook return
export interface KioskState {
    status: string; // AVAILABLE, OCCUPIED, etc.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionData: any | null; // Using any for agility, ideally strictly typed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ads: any[];
}

export function useTableSync(tableId: string, initialData: KioskState) {
    const [state, setState] = useState<KioskState>(initialData);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const errorCount = useRef(0);

    useEffect(() => {
        // Polling logic
        const intervalMs = state.status === 'OCCUPIED' ? 5000 : 30000;

        const interval = setInterval(async () => {
            try {
                // Fetch new state
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newData: any = await getKioskState(tableId);

                if (newData.error) {
                    errorCount.current++;
                    console.warn(`Sync error (${errorCount.current}):`, newData.error);
                    return;
                }

                errorCount.current = 0;

                // Simple comparison to update state if needed
                // Deep comparison would be better for performance to avoid re-renders
                // but for now, we just update.
                setState(prev => {
                    // Check if status changed or important data changed
                    if (JSON.stringify(prev) !== JSON.stringify(newData)) {
                        setLastUpdated(new Date());
                        return newData;
                    }
                    return prev;
                });
            } catch (err) {
                console.error("Sync fetch exception", err);
            }
        }, intervalMs);

        return () => clearInterval(interval);
    }, [tableId, state.status]);

    return { ...state, lastUpdated };
}
