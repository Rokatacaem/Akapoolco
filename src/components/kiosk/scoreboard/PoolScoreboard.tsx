"use strict";
import { Button } from "@/components/ui/button";
import { PoolState } from "@/types/game-state";
import { Undo2, Trophy, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableLiveStream } from "../TableLiveStream";

interface PoolScoreboardProps {
    state: PoolState;
    playerNames: [string, string];
    onUpdate: (newState: PoolState) => void;
    // Props for Video
    cameraTopUrl?: string | null;
    cameraFrontUrl?: string | null;
    onOrderClick?: () => void;
}

export function PoolScoreboard({
    state,
    playerNames,
    onUpdate,
    cameraTopUrl,
    cameraFrontUrl,
    onOrderClick
}: PoolScoreboardProps) {

    const handleWinRack = (winner: 'p1' | 'p2') => {
        const newState: PoolState = {
            ...state,
            p1Racks: winner === 'p1' ? state.p1Racks + 1 : state.p1Racks,
            p2Racks: winner === 'p2' ? state.p2Racks + 1 : state.p2Racks,
            history: [...state.history, winner]
        };
        onUpdate(newState);
    };

    const handleUndo = () => {
        if (state.history.length === 0) return;
        const lastWinner = state.history[state.history.length - 1];
        const newHistory = state.history.slice(0, -1);

        const newState: PoolState = {
            ...state,
            p1Racks: lastWinner === 'p1' ? state.p1Racks - 1 : state.p1Racks,
            p2Racks: lastWinner === 'p2' ? state.p2Racks - 1 : state.p2Racks,
            history: newHistory
        };
        onUpdate(newState);
    };

    return (
        <div className="h-full w-full grid grid-cols-12 gap-1 p-2 bg-black">
            {/* LEFT COLUMN (30% approx -> 3.5/12) - Player 1 */}
            <div className="col-span-3 flex flex-col h-full gap-2">
                <PlayerControl
                    name={playerNames[0]}
                    score={state.p1Racks}
                    colorClass="emerald"
                    onWin={() => handleWinRack('p1')}
                />
            </div>

            {/* CENTER COLUMN (40% approx -> 5/12) - Video & Actions */}
            <div className="col-span-6 flex flex-col h-full gap-2 px-1">
                {/* 1. Header Info */}
                <div className="flex justify-between items-center bg-zinc-900/80 rounded-lg p-3 border border-zinc-800 h-16">
                    <span className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Pool / Racks</span>

                    <div className="flex gap-1" title="Historial">
                        {state.history.slice(-10).map((winner, i) => (
                            <div key={i} className={cn(
                                "w-3 h-3 rounded-full",
                                winner === 'p1' ? "bg-emerald-500" : "bg-blue-500"
                            )} />
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUndo}
                        disabled={state.history.length === 0}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                        <Undo2 className="w-5 h-5 mr-1" />
                        Deshacer
                    </Button>
                </div>

                {/* 2. Video Feed */}
                <div className="flex-grow flex items-center justify-center bg-black rounded-xl overflow-hidden border border-zinc-800 relative">
                    <TableLiveStream
                        cameraTopUrl={cameraTopUrl}
                        cameraFrontUrl={cameraFrontUrl}
                    />
                </div>

                {/* 3. Action Buttons */}
                <div className="grid grid-cols-1 gap-2 h-24">
                    {/* For Pool, we might only need Order for now, unless we want a specific "End Rack" not tied to winner? No, winner wins rack. */}
                    <Button
                        onClick={onOrderClick}
                        className="h-full bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 flex items-center justify-center gap-2 text-lg"
                    >
                        <UtensilsCrossed className="w-6 h-6" />
                        <span className="font-bold uppercase">Solicitar Servicio a la Mesa</span>
                    </Button>
                </div>
            </div>

            {/* RIGHT COLUMN (30% approx -> 3.5/12) - Player 2 */}
            <div className="col-span-3 flex flex-col h-full gap-2">
                <PlayerControl
                    name={playerNames[1]}
                    score={state.p2Racks}
                    colorClass="blue"
                    onWin={() => handleWinRack('p2')}
                />
            </div>
        </div>
    );
}

// Optimized Player Control for Pool
function PlayerControl({ name, score, colorClass, onWin }: {
    name: string,
    score: number,
    colorClass: 'emerald' | 'blue',
    onWin: () => void
}) {
    const bgStyle = colorClass === 'emerald' ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-blue-950/20 border-blue-900/30';
    const textStyle = colorClass === 'emerald' ? 'text-emerald-500' : 'text-blue-500';
    const btnStyle = colorClass === 'emerald'
        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
        : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]';

    return (
        <div className={cn("h-full rounded-2xl border flex flex-col overflow-hidden", bgStyle)}>
            <div className={`p-3 text-center border-b ${colorClass === 'emerald' ? 'border-emerald-900/30' : 'border-blue-900/30'} bg-black/20`}>
                <div className="text-zinc-300 font-bold truncate text-lg uppercase tracking-wide">{name}</div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className={cn("text-[120px] lg:text-[150px] leading-none font-black font-mono tracking-tighter tabular-nums drop-shadow-2xl scale-y-110", textStyle)}>
                    {score}
                </div>
                <span className="text-xs uppercase tracking-[0.3em] font-bold opacity-40 mt-4">Sets Ganados</span>
            </div>

            <div className="p-3 pb-6">
                <Button
                    className={cn("w-full h-32 text-2xl font-black text-white rounded-xl active:scale-95 transition-all flex flex-col items-center justify-center gap-2", btnStyle)}
                    onClick={onWin}
                >
                    <Trophy className="w-10 h-10" />
                    GANÓ SET
                </Button>
            </div>
        </div>
    )
}
