"use client";

import { CaromState } from "@/types/game-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Plus, Minus, StepForward, AlertTriangle, Timer } from "lucide-react";
import { useEffect, useState } from "react";

interface RefereeScoreboardProps {
    state: CaromState;
    playerNames: [string, string];
    onScore: (player: 'p1' | 'p2', delta: number) => void;
    onSwitchTurn: () => void;
    onFoul: () => void;
    playSound: (type: 'beep' | 'alarm') => void;
}

export function RefereeScoreboard({
    state,
    playerNames,
    onScore,
    onSwitchTurn,
    onFoul,
    playSound
}: RefereeScoreboardProps) {
    // --- TIMER LOGIC ---
    // We handle timer locally for smoothness, sync with state when actions happen
    const [timeLeft, setTimeLeft] = useState(state.timerSettings?.limitSeconds || 40);

    useEffect(() => {
        if (state.timerStatus === 'idle') {
            setTimeLeft(state.timerSettings?.limitSeconds || 40);
        }
    }, [state.timerStatus, state.activePlayer, state.innings, state.timerSettings?.limitSeconds]);

    useEffect(() => {
        if (state.timerStatus !== 'running') return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    playSound('alarm');
                    // Trigger Time Foul? Or just alarm. Referee decides.
                    return 0;
                }
                // Auditory cues
                if (prev === 11) playSound('beep'); // Warn at 10 (actually tick before)
                if (prev <= 5 && prev > 0) playSound('beep');

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [state.timerStatus, playSound]);


    // Helper to get formatted Time
    const formatTime = (seconds: number) => {
        return `${seconds}s`;
    };

    const isP1Active = state.activePlayer === 'p1';
    const isP2Active = state.activePlayer === 'p2';

    return (
        <div className="h-full grid grid-cols-12 bg-black text-white">

            {/* PLAYER 1 COLUMN */}
            <div className={cn(
                "col-span-4 border-r border-neutral-800 flex flex-col relative transition-colors duration-500",
                isP1Active ? "bg-emerald-950/30" : "bg-neutral-950"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-neutral-800 text-center">
                    <h2 className="text-3xl font-black uppercase tracking-tight truncate">{playerNames[0]}</h2>
                    <div className="flex justify-between items-center mt-2 text-neutral-400 font-mono text-sm">
                        <span>Max: <b className="text-white">{state.p1HighRun || 0}</b></span>
                        <span>Avg: <b className="text-white">{state.innings > 0 ? (state.p1Score / state.innings).toFixed(3) : "0.000"}</b></span>
                    </div>
                </div>

                {/* Big Score */}
                <div className="flex-1 flex items-center justify-center relative">
                    <span className={cn(
                        "text-[12rem] font-black font-mono leading-none tracking-tighter tabular-nums select-none",
                        isP1Active ? "text-emerald-500" : "text-neutral-700"
                    )}>
                        {state.p1Score}
                    </span>
                    {state.lagWinner === 'p1' ? (
                        <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white shadow-[0_0_10px_white]"></div>
                    ) : (
                        <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-yellow-400 shadow-[0_0_10px_orange]"></div>
                    )}
                </div>

                {/* Controls - ONLY ACTIVE IF PLAYER IS ACTIVE */}
                <div className="p-4 grid grid-cols-2 gap-4 h-32">
                    <Button
                        disabled={!isP1Active}
                        onClick={() => onScore('p1', 1)}
                        className={cn("h-full text-5xl font-black rounded-xl", isP1Active ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-neutral-900 text-neutral-600")}
                    >
                        +1
                    </Button>
                    <Button
                        disabled={!isP1Active}
                        onClick={() => onScore('p1', -1)}
                        variant="secondary"
                        className="h-full text-3xl font-bold bg-neutral-900 text-neutral-500 hover:text-white"
                    >
                        -1
                    </Button>
                </div>
            </div>

            {/* CENTER CONTROL COLUMN */}
            <div className="col-span-4 flex flex-col border-r border-neutral-800 bg-neutral-900/50">
                {/* Stats Header */}
                <div className="h-32 p-4 grid grid-cols-2 gap-2 border-b border-neutral-800 bg-black">
                    <div className="bg-neutral-900 rounded-lg flex flex-col items-center justify-center border border-neutral-800">
                        <span className="text-neutral-500 text-xs uppercase tracking-widest">Entradas</span>
                        <span className="text-4xl font-mono text-white font-bold">{state.innings}</span>
                    </div>
                    <div className="bg-neutral-900 rounded-lg flex flex-col items-center justify-center border border-neutral-800">
                        <span className="text-neutral-500 text-xs uppercase tracking-widest">Tacada</span>
                        <span className="text-5xl font-mono text-amber-500 font-bold animate-pulse">{state.currentRun}</span>
                    </div>
                </div>

                {/* TIMER DISPLAY */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                    {state.timerSettings?.enabled && (
                        <div className="relative">
                            <div className={cn(
                                "text-[8rem] font-mono font-black leading-none tabular-nums transition-colors duration-300",
                                timeLeft <= 10 ? "text-red-500 animate-pulse" : (timeLeft <= 20 ? "text-amber-400" : "text-blue-400")
                            )}>
                                {formatTime(timeLeft)}
                            </div>
                            <div className="flex justify-center gap-4 mt-6">
                                {/* Timer Controls not fully wired yet to state but visual for now */}
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-full border-neutral-700 hover:bg-white/10">
                                    <Pause className="w-6 h-6" />
                                </Button>
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-full border-neutral-700 hover:bg-white/10">
                                    <RotateCcw className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {state.equalizingInning && (
                        <div className="absolute top-4 w-full text-center">
                            <span className="bg-red-600 text-white font-black text-sm uppercase px-4 py-1 rounded-full animate-bounce shadow-lg shadow-red-900/50">
                                Contrasalida / Equalizing Inning
                            </span>
                        </div>
                    )}
                </div>

                {/* MASTER CONTROLS */}
                <div className="p-4 grid gap-4 bg-black border-t border-neutral-800">
                    <Button
                        onClick={onSwitchTurn}
                        className="h-24 text-2xl uppercase font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-indigo-400"
                    >
                        <StepForward className="w-8 h-8 mr-2" />
                        Cambio de Turno
                    </Button>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={onFoul}
                            variant="destructive"
                            className="h-16 text-lg font-bold uppercase bg-red-900/50 border border-red-800 hover:bg-red-800"
                        >
                            <AlertTriangle className="w-5 h-5 mr-2" /> Falta
                        </Button>
                        <Button
                            variant="secondary"
                            className="h-16 text-lg font-bold uppercase bg-neutral-800 text-neutral-400 hover:text-white"
                        >
                            <Timer className="w-5 h-5 mr-2" /> Extensión
                        </Button>
                    </div>
                </div>
            </div>

            {/* PLAYER 2 COLUMN */}
            <div className={cn(
                "col-span-4 border-l border-neutral-800 flex flex-col relative transition-colors duration-500",
                isP2Active ? "bg-blue-950/30" : "bg-neutral-950"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-neutral-800 text-center">
                    <h2 className="text-3xl font-black uppercase tracking-tight truncate">{playerNames[1]}</h2>
                    <div className="flex justify-between items-center mt-2 text-neutral-400 font-mono text-sm">
                        <span>Max: <b className="text-white">{state.p2HighRun || 0}</b></span>
                        <span>Avg: <b className="text-white">{state.innings > 0 ? (state.p2Score / state.innings).toFixed(3) : "0.000"}</b></span>
                    </div>
                </div>

                {/* Big Score */}
                <div className="flex-1 flex items-center justify-center relative">
                    <span className={cn(
                        "text-[12rem] font-black font-mono leading-none tracking-tighter tabular-nums select-none",
                        isP2Active ? "text-blue-500" : "text-neutral-700"
                    )}>
                        {state.p2Score}
                    </span>
                    {state.lagWinner === 'p2' ? (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white shadow-[0_0_10px_white]"></div>
                    ) : (
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-yellow-400 shadow-[0_0_10px_orange]"></div>
                    )}
                </div>

                {/* Controls */}
                <div className="p-4 grid grid-cols-2 gap-4 h-32">
                    <Button
                        disabled={!isP2Active}
                        onClick={() => onScore('p2', 1)}
                        className={cn("h-full text-5xl font-black rounded-xl", isP2Active ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-neutral-900 text-neutral-600")}
                    >
                        +1
                    </Button>
                    <Button
                        disabled={!isP2Active}
                        onClick={() => onScore('p2', -1)}
                        variant="secondary"
                        className="h-full text-3xl font-bold bg-neutral-900 text-neutral-500 hover:text-white"
                    >
                        -1
                    </Button>
                </div>
            </div>

        </div>
    );
}
