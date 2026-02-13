'use client';

import { useState, useTransition } from 'react';
import { updateGameState } from '@/app/lib/actions-kiosk';
import ShotClock from './ShotClock';
import { RotateCcw, ArrowLeftRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
// Defining minimal SessionData structure based on inference if not importing
interface Props {
    session: any; // Using any for session to avoid complex type matching right now, will refine
    onExit?: () => void;
}

import { CaromState } from '@/types/game-state';

export default function MatchReferee({ session, onExit }: Props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isPending, startTransition] = useTransition();

    // 1. Initial State Initialization
    // We expect session.gameState to match CaromState structure
    const getInitialState = (): CaromState => {
        const defaultState: CaromState = {
            gameType: 'CAROM',
            p1Score: 0,
            p2Score: 0,
            innings: 0,
            currentRun: 0,
            activePlayer: 'p1',
            timerStatus: 'idle',
            extensions: { p1: 2, p2: 2 }
        };
        return (session.gameState as CaromState) || defaultState;
    };

    const [gameState, setGameState] = useState<CaromState>(getInitialState);
    const [resetTrigger, setResetTrigger] = useState(0);

    // Sync with Server Logic (Optimistic)
    const updateServer = (newState: CaromState) => {
        setGameState(newState);
        startTransition(async () => {
            await updateGameState(session.id, newState);
        });
    };

    // Identifiers
    const p1 = session.sessionPlayers?.[0];
    const p2 = session.sessionPlayers?.[1];

    const p1Name = p1?.member?.name || p1?.user?.name || p1?.guestName || 'Jugador 1';
    const p2Name = p2?.member?.name || p2?.user?.name || p2?.guestName || 'Jugador 2';

    // Layout
    const [layout, setLayout] = useState<'standard' | 'swapped'>('standard');

    // Limits
    const limit = gameState.targetScore || 0;
    const maxInnings = gameState.limitInnings || 0;

    // Derived
    const isFinished = (limit > 0 && (gameState.p1Score >= limit || gameState.p2Score >= limit)) ||
        (maxInnings > 0 && gameState.innings >= maxInnings);

    // Timer Sync
    // We update the timer status in the game state so other clients can see "PAUSED"
    const handleTimerStatusChange = (status: 'idle' | 'running' | 'paused' | 'timeout') => {
        if (status !== gameState.timerStatus) {
            updateServer({ ...gameState, timerStatus: status });
        }
    };

    // Game Logic
    const handleUpdate = (p1Delta: number, p2Delta: number, inningDelta: number) => {
        if (isFinished && (p1Delta > 0 || p2Delta > 0)) return;

        const newState = { ...gameState };

        let newCurrentRun = newState.currentRun;
        let newHighRunP1 = newState.p1HighRun || 0;
        let newHighRunP2 = newState.p2HighRun || 0;

        // Run Logic
        if (p1Delta > 0 || p2Delta > 0) {
            newCurrentRun += (p1Delta + p2Delta);
        }

        // Reset run if turn changes
        if (inningDelta > 0) {
            newCurrentRun = 0;
        }

        // High Run Check
        if (p1Delta > 0 && newCurrentRun > newHighRunP1) newHighRunP1 = newCurrentRun;
        if (p2Delta > 0 && newCurrentRun > newHighRunP2) newHighRunP2 = newCurrentRun;

        // Apply
        newState.p1Score = Math.max(0, (newState.p1Score || 0) + p1Delta);
        newState.p2Score = Math.max(0, (newState.p2Score || 0) + p2Delta);
        newState.innings = Math.max(0, (newState.innings || 0) + inningDelta);
        newState.currentRun = newCurrentRun;
        newState.p1HighRun = newHighRunP1;
        newState.p2HighRun = newHighRunP2;

        setResetTrigger(prev => prev + 1); // Reset timer on any score/turn change
        updateServer(newState);
    };

    const toggleTurn = () => {
        if (isFinished) return;

        const nextPlayer = gameState.activePlayer === 'p1' ? 'p2' : 'p1';
        // Logic: Increment inning when switching from P2 back to P1 (completing the inning)
        const inningDelta = gameState.activePlayer === 'p2' ? 1 : 0;

        const newState: CaromState = {
            ...gameState,
            activePlayer: nextPlayer,
            innings: (gameState.innings || 0) + inningDelta,
            currentRun: 0,
            timerStatus: 'idle', // Reset timer status
        };

        setResetTrigger(prev => prev + 1);
        updateServer(newState);
    };

    // UI Helpers
    const getPlayerData = (side: 'left' | 'right') => {
        const isP1 = (layout === 'standard' && side === 'left') || (layout === 'swapped' && side === 'right');
        if (isP1) {
            return {
                key: 'p1',
                name: p1Name,
                score: gameState.p1Score,
                active: gameState.activePlayer === 'p1',
                ballColor: 'text-white'
            };
        } else {
            return {
                key: 'p2',
                name: p2Name,
                score: gameState.p2Score,
                active: gameState.activePlayer === 'p2',
                ballColor: 'text-yellow-400'
            };
        }
    };

    const left = getPlayerData('left');
    const right = getPlayerData('right');

    return (
        <div className="flex flex-col h-full bg-black text-white p-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <button onClick={onExit} className="text-slate-500 hover:text-white text-sm uppercase font-bold tracking-wider">
                    &larr; Salir
                </button>
                <div className="text-center">
                    <span className="text-xs text-orange-500 font-bold uppercase tracking-widest block">Modo Referí</span>
                    <span className="text-slate-400 text-xs">{limit > 0 ? `A ${limit} Puntos` : 'Entrenamiento'}</span>
                </div>
                <button onClick={() => setLayout(l => l === 'standard' ? 'swapped' : 'standard')} className="text-slate-500 hover:text-white" aria-label="Cambiar lados">
                    <ArrowLeftRight size={20} />
                </button>
            </div>

            {/* Shot Clock */}
            <ShotClock
                initialSeconds={gameState.timerSettings?.limitSeconds || 40}
                activePlayer={gameState.activePlayer || 'p1'}
                resetTrigger={resetTrigger}
                onStatusChange={handleTimerStatusChange}
            />

            {/* Innings */}
            <div className="flex justify-center -mt-4 mb-6 relative z-20">
                <div className="bg-slate-900 border border-slate-700 rounded-xl px-8 py-2 flex flex-col items-center shadow-2xl">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Entrada</span>
                    <span className="text-4xl font-mono font-bold text-white leading-none">
                        {(gameState.innings || 0) + 1}
                    </span>
                </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-4 flex-1">
                {[left, right].map((p, idx) => (
                    <div key={idx} className={cn(
                        "relative flex flex-col rounded-2xl border-2 transition-all overflow-hidden",
                        p.active ? "border-blue-500 bg-blue-900/10" : "border-slate-800 bg-slate-900/40 opacity-50 grayscale-[0.5]"
                    )}>
                        {/* Name Header */}
                        <div className="p-4 bg-slate-900/80 border-b border-white/5 flex flex-col text-center">
                            <span className={cn("text-xs font-bold uppercase tracking-widest mb-1", p.ballColor)}>
                                {p.key === 'p1' ? 'Bola Blanca' : 'Bola Amarilla'}
                            </span>
                            <h2 className="text-lg font-bold truncate">{p.name}</h2>
                        </div>

                        {/* Score Display */}
                        <div className="flex-1 flex items-center justify-center py-6">
                            <span className="text-8xl font-black tabular-nums">{p.score}</span>
                        </div>

                        {/* Controls */}
                        <div className="p-4 grid grid-cols-2 gap-3 z-10">
                            <button
                                onClick={() => handleUpdate(p.key === 'p1' ? -1 : 0, p.key === 'p2' ? -1 : 0, 0)}
                                className="py-4 rounded-xl bg-slate-800 text-slate-400 font-bold hover:bg-red-900/50 hover:text-red-400 disabled:opacity-50"
                                disabled={!p.active}
                            >
                                -1
                            </button>
                            <button
                                onClick={() => handleUpdate(p.key === 'p1' ? 1 : 0, p.key === 'p2' ? 1 : 0, 0)}
                                className="py-4 rounded-xl bg-slate-700 text-white font-bold hover:bg-green-600 shadow-lg disabled:opacity-50"
                                disabled={!p.active}
                            >
                                +1
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Turn Switch */}
            <div className="mt-6 flex justify-center">
                <button
                    onClick={toggleTurn}
                    className="flex items-center gap-3 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-bold shadow-lg shadow-orange-900/20 active:scale-95 transition-all w-full max-w-sm justify-center"
                >
                    <RotateCcw size={20} />
                    Cambiar Turno
                </button>
            </div>

            {/* Winner Overlay */}
            {isFinished && (
                <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 text-center max-w-md w-full animate-in zoom-in duration-300">
                        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-6">¡Partido Finalizado!</h2>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-black/30 p-4 rounded-xl">
                                <div className="text-xs text-slate-500 font-bold mb-1">{p1Name}</div>
                                <div className={cn("text-3xl font-black", gameState.p1Score > gameState.p2Score ? "text-green-500" : "text-white")}>
                                    {gameState.p1Score}
                                </div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-xl">
                                <div className="text-xs text-slate-500 font-bold mb-1">{p2Name}</div>
                                <div className={cn("text-3xl font-black", gameState.p2Score > gameState.p1Score ? "text-green-500" : "text-white")}>
                                    {gameState.p2Score}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onExit}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
                        >
                            Volver al Menú
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
