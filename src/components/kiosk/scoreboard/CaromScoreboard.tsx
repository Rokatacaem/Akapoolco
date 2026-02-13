import { Button } from "@/components/ui/button";
import { CaromState } from "@/types/game-state";
import { StepForward, UtensilsCrossed, Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableLiveStream } from "../TableLiveStream";
import { useState, useEffect } from "react";
import { CaromSettingsDialog } from "./CaromSettingsDialog";
import { ShotClock } from "./ShotClock";

interface CaromScoreboardProps {
    state: CaromState;
    playerNames: [string, string];
    onUpdate: (newState: CaromState) => void;
    cameraTopUrl?: string | null;
    cameraFrontUrl?: string | null;
    onOrderClick?: () => void;
}

export function CaromScoreboard({
    state,
    playerNames,
    onUpdate,
    cameraTopUrl,
    cameraFrontUrl,
    onOrderClick
}: CaromScoreboardProps) {
    const [showSettings, setShowSettings] = useState(false);

    // Auto-open settings if it looks like a new game (Score 0-0, no Target, no Innings, no settings defined)
    // We use a simple effect that runs once on mount + dependencies if state changes (re-mount)
    useEffect(() => {
        // If no target score is set AND scores are 0 AND innings are 0, it's likely a new session that needs config.
        const isFreshGame = !state.targetScore && state.p1Score === 0 && state.p2Score === 0 && state.innings === 0 && !state.limitInnings;

        if (isFreshGame) {
            // Delay to avoid sync state update warning during mount
            setTimeout(() => setShowSettings(true), 0);
        }
    }, [state.targetScore, state.p1Score, state.p2Score, state.innings, state.limitInnings]); // Added dependencies to satisfy linter
    // If we depend on state it might pop up after a reset. Which is good!
    // But we need to be careful not to pop it up if user JUST closed it.
    // Let's stick to mount. If user resets via button, we can trigger it manually there.

    // Local turn state to reset clock when switching players
    const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
    const [resetTrigger, setResetTrigger] = useState(0);

    const updateScore = (player: 'p1' | 'p2', delta: number) => {
        const newState = { ...state };

        // Ensure high run tracking
        newState.p1HighRun = newState.p1HighRun || 0;
        newState.p2HighRun = newState.p2HighRun || 0;

        if (player === 'p1') {
            newState.p1Score = Math.max(0, newState.p1Score + delta);
            if (delta > 0) {
                newState.currentRun += delta;
                if (newState.currentRun > newState.p1HighRun) newState.p1HighRun = newState.currentRun;
            }
        } else {
            newState.p2Score = Math.max(0, newState.p2Score + delta);
            if (delta > 0) {
                newState.currentRun += delta;
                if (newState.currentRun > newState.p2HighRun) newState.p2HighRun = newState.currentRun;
            }
        }

        // Reset clock on score change (New Shot)
        // Only if delta > 0? Or always? Usually resetting on score adjustment is safer.
        setResetTrigger(prev => prev + 1);

        onUpdate(newState);
    };

    const nextInning = () => {
        onUpdate({
            ...state,
            innings: state.innings + 1,
            currentRun: 0
        });
        // Switch Clock Turn and Reset
        setCurrentPlayerIdx(prev => prev === 0 ? 1 : 0);
        setResetTrigger(prev => prev + 1);
    };

    const handleSettingsConfirm = (newSettings: Partial<CaromState>) => {
        // Merge settings and reset metrics if implied
        onUpdate({
            ...state,
            ...newSettings
        });
        setShowSettings(false);
        // Reset clock turn
        setCurrentPlayerIdx(0);
        setResetTrigger(prev => prev + 1);
    };

    // Calculate Averages
    const p1Avg = state.innings > 0 ? (state.p1Score / state.innings).toFixed(3) : "0.000";
    const p2Avg = state.innings > 0 ? (state.p2Score / state.innings).toFixed(3) : "0.000";

    // Winner Check
    const target = state.targetScore;
    const winner = target ? (state.p1Score >= target ? 0 : state.p2Score >= target ? 1 : null) : null;

    return (
        <div className="h-full w-full grid grid-cols-12 gap-1 p-2 bg-black relative">

            {/* Settings Dialog */}
            <CaromSettingsDialog
                open={showSettings}
                onOpenChange={setShowSettings}
                onConfirm={handleSettingsConfirm}
                currentSettings={state}
            />

            {/* Config Button (Overlay or corner) */}
            <div className="absolute top-4 left-4 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(true)}
                    className="opacity-20 hover:opacity-100 text-white"
                >
                    <Settings />
                </Button>
            </div>

            {/* LEFT COLUMN - Player 1 */}
            <div className="col-span-3 flex flex-col h-full gap-2 relative">
                <PlayerControl
                    name={playerNames[0]}
                    score={state.p1Score}
                    colorClass="emerald"
                    onIncrement={() => updateScore('p1', 1)}
                    onDecrement={() => updateScore('p1', -1)}
                    isTurn={currentPlayerIdx === 0 && !!state.timerSettings?.enabled}
                    highRun={state.p1HighRun || 0}
                    avg={p1Avg}
                    currentRun={currentPlayerIdx === 0 ? state.currentRun : 0}
                    showStats={!!state.limitInnings || !!state.timerSettings?.enabled} // Show stats if tournament mode hints
                />
            </div>

            {/* CENTER COLUMN */}
            <div className="col-span-6 flex flex-col h-full gap-2 px-1">
                {/* 1. Dashboard / Header */}
                <div className="grid grid-cols-3 bg-zinc-900/80 rounded-lg p-2 border border-zinc-800 items-center min-h-[80px]">
                    {/* Left Stats */}
                    <div className="flex flex-col items-center justify-center border-r border-zinc-800">
                        {state.targetScore && (
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase text-zinc-500 tracking-widest">Distancia</span>
                                <span className="text-xl font-bold text-white">{state.targetScore}</span>
                            </div>
                        )}
                    </div>

                    {/* Center: Innings & Timer */}
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Entradas</span>
                        <span className="text-4xl font-mono font-black text-amber-500 leading-none mb-1">{state.innings}</span>
                        {state.limitInnings && (
                            <span className="text-[10px] text-zinc-600">Max: {state.limitInnings}</span>
                        )}
                    </div>

                    {/* Right Stats: Run (Simplified or Removed if redundant, keeping for audience visibility) */}
                    <div className="flex flex-col items-center justify-center border-l border-zinc-800">
                        <span className="text-[10px] uppercase text-zinc-500 tracking-widest">Tacada Actual</span>
                        <span className="text-3xl font-bold text-white leading-none animate-pulse">{state.currentRun}</span>
                    </div>
                </div>

                {/* 2. Main Visual (Timer OR Video) */}
                <div className="flex-grow flex items-center justify-center bg-zinc-950 rounded-xl overflow-hidden border border-zinc-900 relative">
                    {/* If Timer is Enabled, show it overlaying or swapping? 
                         Let's overlay it nicely or put it in center if no video active.
                         For now, let's put Timer in the center if enabled, making video smaller or background?
                         Actually, user wants Camera Integration too.
                         Let's keep Video as main, and Timer as overlay component if enabled.
                     */}
                    <TableLiveStream
                        cameraTopUrl={cameraTopUrl}
                        cameraFrontUrl={cameraFrontUrl}
                    />

                    {/* Timer Overlay */}
                    {state.timerSettings?.enabled && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                            <ShotClock
                                initialSeconds={state.timerSettings.limitSeconds}
                                activePlayer={currentPlayerIdx === 0 ? 'p1' : 'p2'}
                                resetTrigger={resetTrigger}
                                onTimeout={() => { /* Play sound */ }}
                                key={`${state.innings}-${currentPlayerIdx}`} // Keep key for reliable mounting, resetTrigger for inner resets
                            />
                        </div>
                    )}

                    {/* Winner Overlay */}
                    {winner !== null && (
                        <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in zoom-in">
                            <Trophy className="w-24 h-24 text-yellow-400 mb-4 animate-bounce" />
                            <h2 className="text-4xl font-black text-white uppercase tracking-widest mb-2">Ganador</h2>
                            <h1 className={cn("text-6xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r", winner === 0 ? "from-emerald-400 to-green-600" : "from-blue-400 to-indigo-600")}>
                                {playerNames[winner]}
                            </h1>
                            <div className="mt-8">
                                <Button onClick={() => setShowSettings(true)} variant="outline">Nuevo Partido</Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Footer Action Buttons */}
                <div className="grid grid-cols-2 gap-2 h-20">
                    <Button
                        onClick={onOrderClick}
                        className="h-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center gap-2"
                    >
                        <UtensilsCrossed className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase">Servicio</span>
                    </Button>

                    <Button
                        onClick={nextInning}
                        className="h-full bg-amber-600 hover:bg-amber-500 text-black border border-amber-400 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    >
                        <StepForward className="w-6 h-6" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-sm font-black uppercase">Pasar Turno</span>
                            <span className="text-[10px] opacity-70">Siguiente Entrada</span>
                        </div>
                    </Button>
                </div>
            </div>

            {/* RIGHT COLUMN - Player 2 */}
            <div className="col-span-3 flex flex-col h-full gap-2">
                <PlayerControl
                    name={playerNames[1]}
                    score={state.p2Score}
                    colorClass="blue"
                    onIncrement={() => updateScore('p2', 1)}
                    onDecrement={() => updateScore('p2', -1)}
                    isTurn={currentPlayerIdx === 1 && !!state.timerSettings?.enabled}
                    highRun={state.p2HighRun || 0}
                    avg={p2Avg}
                    currentRun={currentPlayerIdx === 1 ? state.currentRun : 0}
                    showStats={!!state.limitInnings || !!state.timerSettings?.enabled}
                />
            </div>
        </div>
    );
}

interface PlayerControlProps {
    name: string;
    score: number;
    colorClass: 'emerald' | 'blue';
    onIncrement: () => void;
    onDecrement: () => void;
    isTurn: boolean;
    highRun: number;
    avg: string;
    showStats: boolean;
    currentRun: number;
}

function PlayerControl({ name, score, colorClass, onIncrement, onDecrement, isTurn, highRun, avg, showStats, currentRun }: PlayerControlProps) {
    const isEmerald = colorClass === 'emerald';
    const baseBorder = isEmerald ? 'border-emerald-900/30' : 'border-blue-900/30';
    const activeRing = isTurn ? (isEmerald ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : 'ring-2 ring-blue-500 shadow-blue-500/20') : '';

    return (
        <div className={cn("h-full rounded-2xl border flex flex-col overflow-hidden bg-zinc-950 transition-all duration-300", baseBorder, activeRing)}>
            {/* Name Header */}
            <div className={cn("p-4 text-center border-b flex flex-col justify-center", baseBorder, isTurn && "bg-white/5")}>
                <div className="text-white font-bold truncate text-lg uppercase tracking-wide">{name}</div>
                {isTurn && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest animate-pulse">Jugando</span>}
            </div>

            {/* Stats Check: Only show if Tournament Mode items are active */}
            {showStats && (
                <div className="grid grid-cols-2 text-[10px] text-zinc-500 border-b border-zinc-900 divide-x divide-zinc-900 bg-black/40">
                    <div className="p-1 text-center">
                        <span className="block uppercase tracking-wider text-[9px] opacity-70">Tacada</span>
                        {/* Highlights Current Run if active, else shows High Run? 
                            User asked for "suma de las tacadas en una misma entrada".
                            If it is their turn, we show currentRun.
                        */}
                        <span className={cn("font-mono text-white", isTurn && currentRun > 0 && "text-amber-500 font-bold")}>
                            {isTurn ? currentRun : highRun}
                            {isTurn && <span className="text-[8px] text-zinc-600 block leading-none">Actual</span>}
                            {!isTurn && <span className="text-[8px] text-zinc-600 block leading-none">Max</span>}
                        </span>
                    </div>
                    <div className="p-1 text-center">
                        <span className="block uppercase tracking-wider text-[9px] opacity-70">Promedio</span>
                        <span className="font-mono text-white">{avg}</span>
                    </div>
                </div>
            )}

            {/* Score */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-transparent to-black/40">
                <div className={cn("text-[100px] lg:text-[130px] leading-none font-black font-mono tracking-tighter tabular-nums drop-shadow-2xl", isEmerald ? "text-emerald-500" : "text-blue-500")}>
                    {score}
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 gap-2 p-3 pb-6">
                <Button
                    className={cn("h-28 text-6xl font-black text-white rounded-2xl active:scale-95 transition-all shadow-lg border-t border-white/10",
                        isEmerald ? "bg-emerald-700 hover:bg-emerald-600" : "bg-blue-700 hover:bg-blue-600"
                    )}
                    onClick={onIncrement}
                >
                    +
                </Button>

                <Button
                    variant="ghost"
                    className="h-16 border-2 border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-3xl font-bold rounded-xl"
                    onClick={onDecrement}
                >
                    -
                </Button>
            </div>
        </div>
    )
}
