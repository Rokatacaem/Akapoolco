'use client';

import { useEffect, useState } from 'react';

interface SessionTimerProps {
    startTime: string; // ISO string
}

export function SessionTimer({ startTime }: SessionTimerProps) {
    const [elapsed, setElapsed] = useState('00:00:00');

    useEffect(() => {
        const start = new Date(startTime).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = now - start;

            if (diff < 0) {
                setElapsed('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const fmt = (n: number) => n.toString().padStart(2, '0');
            setElapsed(`${fmt(hours)}:${fmt(minutes)}:${fmt(seconds)}`);
        };

        updateTimer(); // Initial call
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [startTime]);

    return <span>{elapsed}</span>;
}
