
"use client";

import { Button } from "@/components/ui/button";
import { SnookerState } from "@/types/game-state";
import { UtensilsCrossed, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableLiveStream } from "../TableLiveStream";

interface SnookerScoreboardProps {
    state: SnookerState;
    playerNames: [string, string];
    onUpdate: (newState: SnookerState) => void;
    cameraTopUrl?: string | null;
    cameraFrontUrl?: string | null;
    onOrderClick?: () => void;
}

export function SnookerScoreboard({
    state,
    playerNames,
    onUpdate,
    cameraTopUrl,
    cameraFrontUrl,
    onOrderClick
}: SnookerScoreboardProps) {

    const updateScore = (player: 'p1' | 'p2', delta: number) => {
        const newState = { ...state };
        if (player === 'p1') {
            newState.p1Score = Math.max(0, newState.p1Score + delta);
            // Auto Update Break? Maybe simple manual break tracking separate from score is too complex for now.
        } else {
            newState.p2Score = Math.max(0, newState.p2Score + delta);
        }
        onUpdate(newState);
    };

    const handleFrameWin = (winner: 'p1' | 'p2') => {
        if (confirm(`¿Confirmar que ${winner === 'p1' ? playerNames[0] : playerNames[1]} ganó el Frame? (Puntajes se reinician)`)) {
            onUpdate({
                ...state,
                p1Frames: winner === 'p1' ? state.p1Frames + 1 : state.p1Frames,
                p2Frames: winner === 'p2' ? state.p2Frames + 1 : state.p2Frames,
                p1Score: 0,
                p2Score: 0,
                currentBreak: 0
            });
        }
    };

    return (
        <div className="h-full w-full grid grid-cols-12 gap-1 p-2 bg-black text-white">

            {/* Player 1 */}
            <div className="col-span-3 h-full">
                <PlayerColumn
                    name={playerNames[0]}
                    score={state.p1Score}
                    frames={state.p1Frames}
                    colorClass="emerald"
                    onUpdateScore={(d: number) => updateScore('p1', d)}
                    onWinFrame={() => handleFrameWin('p1')}
                />
            </div>

            {/* Center */}
            <div className="col-span-6 flex flex-col h-full gap-2 px-1">
                {/* Header / Break Info */}
                <div className="flex justify-between items-center bg-zinc-900/80 rounded-lg p-3 border border-zinc-800 h-16">
                    <span className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Snooker</span>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Frames</span>
                        <span className="font-bold text-xl text-amber-400">{state.p1Frames} - {state.p2Frames}</span>
                    </div>
                    <span className="text-zinc-500 text-sm font-mono uppercase tracking-widest">Break: --</span>
                </div>

                {/* Video */}
                <div className="flex-grow flex items-center justify-center bg-black rounded-xl overflow-hidden border border-zinc-800 relative">
                    <TableLiveStream
                        cameraTopUrl={cameraTopUrl}
                        cameraFrontUrl={cameraFrontUrl}
                    />
                </div>

                {/* Footer Controls */}
                <div className="h-24 w-full grid grid-cols-1 gap-2">
                    <Button
                        onClick={onOrderClick}
                        className="w-full h-full bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/20 text-indigo-300 gap-2 text-lg"
                    >
                        <UtensilsCrossed className="w-6 h-6" />
                        <span>Carta / Servicio</span>
                    </Button>
                </div>
            </div>

            {/* Player 2 */}
            <div className="col-span-3 h-full">
                <PlayerColumn
                    name={playerNames[1]}
                    score={state.p2Score}
                    frames={state.p2Frames}
                    colorClass="blue"
                    onUpdateScore={(d: number) => updateScore('p2', d)}
                    onWinFrame={() => handleFrameWin('p2')}
                />
            </div>
        </div>
    );
}

function PlayerColumn({ name, score, frames, colorClass, onUpdateScore, onWinFrame }: {
    name: string,
    score: number,
    frames: number,
    colorClass: 'emerald' | 'blue',
    onUpdateScore: (delta: number) => void,
    onWinFrame: () => void
}) {
    const bgStyle = colorClass === 'emerald' ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-blue-950/20 border-blue-900/30';
    const textStyle = colorClass === 'emerald' ? 'text-emerald-500' : 'text-blue-500';

    return (
        <div className={cn("h-full rounded-2xl border flex flex-col overflow-hidden", bgStyle)}>
            <div className={`p-3 text-center border-b ${colorClass === 'emerald' ? 'border-emerald-900/30' : 'border-blue-900/30'} bg-black/20 flex justify-between items-center`}>
                <div className="text-zinc-200 font-bold truncate text-lg uppercase tracking-wide">{name}</div>
                <div className="text-xs bg-black/40 px-2 py-1 rounded text-white/70">Frames: {frames}</div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className={cn("text-[90px] leading-none font-black font-mono tracking-tighter tabular-nums drop-shadow-2xl scale-y-110", textStyle)}>
                    {score}
                </div>
            </div>

            <div className="p-3 grid grid-cols-2 gap-2">
                <Button onClick={() => onUpdateScore(1)} className="h-16 text-2xl font-black bg-zinc-800 text-white rounded-lg hover:bg-zinc-700">+1</Button>
                <Button onClick={() => onUpdateScore(-1)} className="h-16 text-2xl font-black bg-zinc-900 text-zinc-500 rounded-lg hover:bg-zinc-800 hover:text-white">-1</Button>

                {/* Preset Scores for Snooker Balls? Space limited. Let's stick to simple +1/-1 or +X popover later */}
                <Button onClick={() => onUpdateScore(4)} className="bg-amber-700 hover:bg-amber-600 text-white font-bold h-12 col-span-2 text-lg">Marrón (4)</Button>
                <Button onClick={() => onUpdateScore(5)} className="bg-blue-700 hover:bg-blue-600 text-white font-bold h-12 col-span-2 text-lg">Azul (5)</Button>
                <Button onClick={() => onUpdateScore(6)} className="bg-pink-600 hover:bg-pink-500 text-white font-bold h-12 col-span-2 text-lg">Rosa (6)</Button>
                <Button onClick={() => onUpdateScore(7)} className="bg-black text-white border border-zinc-700 font-bold h-12 col-span-2 text-lg">Negra (7)</Button>

                <Button
                    onClick={onWinFrame}
                    className="col-span-2 mt-4 bg-white text-black hover:bg-slate-200 font-black uppercase text-sm h-12 tracking-wider"
                >
                    <Flag className="w-4 h-4 mr-2" />
                    Ganó Frame
                </Button>
            </div>
        </div>
    )
}
