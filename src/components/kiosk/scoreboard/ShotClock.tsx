'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShotClockProps {
    initialSeconds: number;
    isRunning?: boolean;
    activePlayer?: string;
    resetTrigger?: number;
    onTimeout?: () => void;
    onReset?: () => void; // Called when reset button is clicked manually
}

export function ShotClock({ initialSeconds, isRunning, onTimeout, onReset }: ShotClockProps) {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    const [isPaused, setIsPaused] = useState(!isRunning);

    const onTimeoutRef = useRef(onTimeout);

    useEffect(() => {
        onTimeoutRef.current = onTimeout;
    }, [onTimeout]);

    // Timer Logic
    useEffect(() => {
        if (isPaused) return;
        // logic moved inside interval to rely on state

        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 0) return 0;
                const next = prev - 1;
                if (next === 0 && onTimeoutRef.current) {
                    onTimeoutRef.current();
                }
                return Math.max(0, next);
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused]); // Removed secondsLeft and onTimeout

    // Reset when initialSeconds changes (new turn)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSecondsLeft(initialSeconds);
        setIsPaused(!isRunning);
    }, [initialSeconds, isRunning]);

    // Visuals
    const isWarning = secondsLeft <= 10;
    const isCritical = secondsLeft <= 5;

    const handleExtension = () => {
        setSecondsLeft(prev => prev + 30); // Standard extension
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={cn(
                "w-24 h-24 rounded-full border-4 flex items-center justify-center relative shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-500",
                isCritical ? "border-red-600 bg-red-950/50 animate-pulse" :
                    isWarning ? "border-amber-500 bg-amber-950/50" : "border-zinc-700 bg-black/50"
            )}>
                <span className={cn(
                    "text-4xl font-black font-mono tracking-tighter",
                    isCritical ? "text-red-500" : isWarning ? "text-amber-500" : "text-white"
                )}>
                    {secondsLeft}
                </span>

                {/* Progress Ring (Simplified) */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none opacity-20">
                    <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="4" fill="none" className={isWarning ? "text-amber-500" : "text-emerald-500"} strokeDasharray="100" strokeDashoffset={100 - (secondsLeft / initialSeconds * 100)} />
                </svg>
            </div>

            <div className="flex gap-1 scale-90">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPaused(!isPaused)}
                    className="h-8 w-8 rounded-full border border-zinc-700 hover:bg-zinc-800"
                >
                    {isPaused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4 text-amber-500" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setSecondsLeft(initialSeconds); onReset?.(); }}
                    className="h-8 w-8 rounded-full border border-zinc-700 hover:bg-zinc-800"
                >
                    <RotateCcw className="w-4 h-4 text-white" />
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExtension}
                    className="h-8 px-2 rounded-full border border-zinc-700 hover:bg-zinc-800 text-xs font-bold text-zinc-400"
                >
                    +30s
                </Button>
            </div>
        </div>
    );
}
