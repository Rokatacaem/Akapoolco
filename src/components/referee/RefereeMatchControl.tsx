"use client";

import { useEffect, useState, useRef } from "react";
import { CaromState } from "@/types/game-state"; // We focus on Carom for now as requested context implied Carom/3-Cushion
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { updateGameState, finalizeMatch } from "@/app/lib/actions-kiosk";
import { toast } from "sonner";
import { RefereeScoreboard } from "./RefereeScoreboard";
import { ArrowLeft, Trophy, AlertTriangle, Timer, Play, Pause, RotateCcw } from "lucide-react";

interface RefereeMatchControlProps {
    sessionId: string;
    initialState: CaromState;
    playerNames: [string, string];
    tableId: string;
}

export function RefereeMatchControl({ sessionId, initialState, playerNames, tableId }: RefereeMatchControlProps) {
    const router = useRouter();
    const [state, setState] = useState<CaromState>(initialState);
    const [initModalOpen, setInitModalOpen] = useState(!state.matchStatus || state.matchStatus === 'WARMUP');
    const [refereeName, setRefereeName] = useState(state.refereeName || "");
    const [lagWinner, setLagWinner] = useState<'p1' | 'p2' | null>(state.lagWinner || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Audio Refs
    const audioBeepRef = useRef<HTMLAudioElement | null>(null);
    const audioAlarmRef = useRef<HTMLAudioElement | null>(null);

    // --- SOUND EFFECTS ---
    useEffect(() => {
        audioBeepRef.current = new Audio('/sounds/beep-short.mp3');
        audioAlarmRef.current = new Audio('/sounds/alarm.mp3');
    }, []);

    const playSound = (type: 'beep' | 'alarm') => {
        if (type === 'beep') audioBeepRef.current?.play().catch(() => { });
        if (type === 'alarm') audioAlarmRef.current?.play().catch(() => { });
    };

    // --- SYNC WITH SERVER ---
    // Debounce state updates to server
    useEffect(() => {
        const timer = setTimeout(() => {
            if (state !== initialState) {
                updateGameState(sessionId, state).catch(console.error);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [state, sessionId]); // initialState excluded to avoid loop, we assume optimistic local is truth

    // --- GAME LOGIC HANDLERS ---

    const handleInitConfirm = () => {
        if (!refereeName || !lagWinner) {
            toast.error("Complete todos los campos");
            return;
        }

        const newState: CaromState = {
            ...state,
            refereeName,
            lagWinner,
            matchStatus: 'PLAYING',
            activePlayer: lagWinner, // Lag winner starts
            startPlayer: lagWinner,
            innings: 0,
            currentRun: 0,
            p1Score: 0,
            p2Score: 0,
            timerStatus: 'running', // Auto-start clock? Maybe 'idle' first. Let's say 'idle'.
        };

        // Setup initial timer reset
        if (state.timerSettings?.enabled) {
            newState.timerStatus = 'idle';
        }

        setState(newState);
        updateGameState(sessionId, newState);
        setInitModalOpen(false);
    };

    const handleScore = (player: 'p1' | 'p2', delta: number) => {
        if (state.matchStatus !== 'PLAYING' && state.matchStatus !== 'LAG') return;
        if (player !== state.activePlayer) { // Strict Rule: Only active player scores
            // Unless we allow penalty on opponent? Usually in carom, you just score your own.
            // Let's enforce active player only for +1. -1 is correction.
            if (delta > 0) {
                toast.error("Solo el jugador activo puede sumar puntos");
                return;
            }
        }

        const newState = { ...state };

        if (player === 'p1') {
            newState.p1Score = Math.max(0, newState.p1Score + delta);
            if (delta > 0) {
                newState.currentRun = (newState.currentRun || 0) + delta;
                if (newState.currentRun > (newState.p1HighRun || 0)) newState.p1HighRun = newState.currentRun;
            } else {
                // Correction
                newState.currentRun = Math.max(0, (newState.currentRun || 0) + delta);
            }
        } else {
            newState.p2Score = Math.max(0, newState.p2Score + delta);
            if (delta > 0) {
                newState.currentRun = (newState.currentRun || 0) + delta;
                if (newState.currentRun > (newState.p2HighRun || 0)) newState.p2HighRun = newState.currentRun;
            } else {
                newState.currentRun = Math.max(0, (newState.currentRun || 0) + delta);
            }
        }

        // Check Win Condition (Immediate validation)
        checkWinCondition(newState);
        setState(newState);
    };

    const switchTurn = () => {
        // Validation: Cannot switch if current run > 0? No, you can miss after scoring.

        const newState = { ...state };
        const nextPlayer = state.activePlayer === 'p1' ? 'p2' : 'p1';

        // Increment Innings Logic:
        // In Carom, inning increments when the SECOND player finishes their turn (completing the round).
        // Or is it when the Start Player finishes?
        // Standard: Inning 1 = P1 turn, then P2 turn. When P2 finishes, Inning 1 ends.

        // If the player finishing now is the one who played LAST in the sequence...
        // Let's assume P1 started.
        // P1 ends -> P2 active (Inning 1 bottom).
        // P2 ends -> P1 active (Inning 2 top).

        // So if (nextPlayer === startPlayer), we just completed a full round -> Increment inning.
        // Wait, standard convention is:
        // Inning 1: Player A (Run), Player B (Run). 
        // When Player B finishes, we move to Inning 2.

        if (nextPlayer === state.startPlayer) {
            newState.innings = (newState.innings || 0) + 1;
        }

        newState.activePlayer = nextPlayer;
        newState.currentRun = 0;
        newState.timerStatus = 'idle'; // Reset clock, wait for 'Resume' or Auto-start
        // Auto-start clock usually? In referee mode, maybe we want explicit start or auto.
        // Let's set to 'running' for flow, 40s Countdown starts.
        if (state.timerSettings?.enabled) {
            newState.timerStatus = 'running';
        }

        setState(newState);
    };

    const handleFoul = () => {
        // Carom Foul: Usually ends turn, no points deduction standardly, but rules vary.
        // Assuming "End Turn" functionality + optional penalty input if needed.
        // For now: Just switch turn (Miss).
        toast("Falta registrada - Cambio de turno");
        switchTurn();
    };

    // --- CHECK WIN CONDITION ---
    const checkWinCondition = (currentState: CaromState) => {
        if (!currentState.targetScore) return;

        const p1Finished = currentState.p1Score >= currentState.targetScore;
        const p2Finished = currentState.p2Score >= currentState.targetScore;

        if (p1Finished || p2Finished) {
            // "Contrasalida" (Equalizing Inning) Logic
            // If Start Player finishes, Opponent gets one last chance (Equalizing Inning).
            // If Second Player finishes, game over immediately.

            const isStartPlayer = currentState.activePlayer === currentState.startPlayer;

            if (isStartPlayer && (p1Finished || p2Finished) && !currentState.equalizingInning) {
                // Activate Equalizing Inning for the OTHER player
                toast("¡Distancia alcanzada! Turno de contrasalida.");
                currentState.equalizingInning = true;
                switchTurn(); // Force switch to opponent for their last shots
            } else if (currentState.equalizingInning) {
                // We are IN the equalizing inning.
                // If the equalizer misses (switches turn) or reaches target...
                // Wait, checkWinCondition is called on Score. 
                // If equalizer reaches target -> DRAW (or Penalties).
                // If equalizer misses -> Original Winner wins.
                // This logic effectively happens when the turn ends or score updates.

                // If Active Player (Equalizer) >= Target -> DRAW/TIE
                if (p1Finished && p2Finished) {
                    // EMPATE
                    // finishMatch('DRAW');
                }
            } else {
                // Second Player finished naturally -> WIN
                // finishMatch('SCORE');
            }
        }
    };

    const handleFinishMatch = async (forceWinner?: 'p1' | 'p2') => {
        if (!confirm("¿Finalizar el partido y cerrar mesa?")) return;
        setIsSubmitting(true);

        // Determine Winner Logic based on state
        const winnerId = null;
        if (forceWinner) {
            // W.O. or explicit
            // Map 'p1'/'p2' to DB IDs? We don't have them in props easily, need from session or just logic.
            // We'll leave winner determination to backend or pass implicit 'p1'/'p2' string if backend handles it.
            // For now, let's just close it.
        } else {
            // Score based
        }

        await finalizeMatch(sessionId, undefined, 'SCORE', state);
        setIsSubmitting(false);
        router.push('/dashboard/referee');
    };

    return (
        <div className="h-full flex flex-col bg-neutral-950">
            {/* Header / Info Bar */}
            <div className="bg-neutral-900 border-b border-neutral-800 p-2 flex justify-between items-center text-xs text-neutral-400">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Salir
                </Button>
                <div className="flex gap-4">
                    <span>Juez: <span className="text-white font-bold">{state.refereeName || "Sin Asignar"}</span></span>
                    <span>Mesa: <span className="text-white font-bold">{playerNames[0]} vs {playerNames[1]}</span></span>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={() => handleFinishMatch('p1')}>W.O.</Button>
                    <Button variant="outline" size="sm" onClick={() => handleFinishMatch()}>Finalizar</Button>
                </div>
            </div>

            {/* Initialization Modal */}
            <Dialog open={initModalOpen} onOpenChange={setInitModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Inicialización de Partido - {tableId}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nombre del Juez</Label>
                            <Input
                                placeholder="Ingrese su nombre"
                                value={refereeName}
                                onChange={(e) => setRefereeName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Ganador del Arrime (Lag)</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={lagWinner === 'p1' ? 'default' : 'outline'}
                                    className={lagWinner === 'p1' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                                    onClick={() => setLagWinner('p1')}
                                >
                                    {playerNames[0]} (Blanca)
                                </Button>
                                <Button
                                    variant={lagWinner === 'p2' ? 'default' : 'outline'}
                                    className={lagWinner === 'p2' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                                    onClick={() => setLagWinner('p2')}
                                >
                                    {playerNames[1]} (Amarilla)
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleInitConfirm} disabled={!refereeName || !lagWinner}>
                            Iniciar Partido
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Scoreboard UI */}
            <div className="flex-1 overflow-hidden relative">
                <RefereeScoreboard
                    state={state}
                    playerNames={playerNames}
                    onScore={handleScore}
                    onSwitchTurn={switchTurn}
                    onFoul={handleFoul}
                    playSound={playSound}
                />
            </div>
        </div>
    );
}
