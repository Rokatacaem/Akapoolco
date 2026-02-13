import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChileanState } from "@/types/game-state";
import { RotateCcw, Target, Monitor, UtensilsCrossed, AlertTriangle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChileanGame } from "@/hooks/useChileanGame";
import { PoolBallIcon } from "./PoolBallIcon";
import { Switch } from "@/components/ui/switch";
import { TableLiveStream } from "../TableLiveStream";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ChileanPoolScoreboardProps {
    state: ChileanState;
    playerNames: [string, string];
    players?: { name: string; image?: string | null }[];
    onUpdate: (newState: ChileanState) => void;
    cameraTopUrl?: string | null;
    cameraFrontUrl?: string | null;
    onOrderClick?: () => void;
}

export function ChileanPoolScoreboard({
    state,
    playerNames,
    players,
    onUpdate,
    cameraTopUrl,
    cameraFrontUrl,
    onOrderClick
}: ChileanPoolScoreboardProps) {
    // UI State for "Assignment Mode"
    // false = Player 1, true = Player 2
    const [assignToP2, setAssignToP2] = useState(false);

    // UI State for Swapped Names (Who is actually sitting at Left vs Right)
    const [isSwapped, setIsSwapped] = useState(false);

    // UI State for Foul Dialog
    const [foulPlayer, setFoulPlayer] = useState<0 | 1 | null>(null);

    // UI State for Camera View
    const [showCamera, setShowCamera] = useState(false);

    // Game Logic Hook
    const metrics = useChileanGame(state);

    // Derived Visual Names
    const leftName = isSwapped ? playerNames[1] : playerNames[0];
    const rightName = isSwapped ? playerNames[0] : playerNames[1];

    // Handlers
    const handleBallClick = (ball: number) => {
        const newState = { ...state };
        const isAvailable = state.availableBalls.includes(ball);
        const isP1 = state.p1Balls.includes(ball);
        const isP2 = state.p2Balls.includes(ball);

        // Simple assignment based on target swapper
        // If !assignToP2 (Left Target) 
        // -> If !isSwapped: P1. If isSwapped: P2.
        const targetIsP2 = (!assignToP2 && isSwapped) || (assignToP2 && !isSwapped);

        if (isAvailable) {
            newState.availableBalls = state.availableBalls.filter(b => b !== ball);
            if (!targetIsP2) {
                newState.p1Balls = [...state.p1Balls, ball].sort((a, b) => a - b);
            } else {
                newState.p2Balls = [...state.p2Balls, ball].sort((a, b) => a - b);
            }
        } else if (isP1) {
            newState.p1Balls = state.p1Balls.filter(b => b !== ball);
            newState.availableBalls = [...state.availableBalls, ball].sort((a, b) => a - b);
        } else if (isP2) {
            newState.p2Balls = state.p2Balls.filter(b => b !== ball);
            newState.availableBalls = [...state.availableBalls, ball].sort((a, b) => a - b);
        }

        onUpdate(newState);
    };

    // New Foul Handler: Opens Dialog
    const handleFoulClick = (visualSide: 'left' | 'right') => {
        // Left = Swapped ? P2 : P1
        const isP2 = (visualSide === 'left' && isSwapped) || (visualSide === 'right' && !isSwapped);
        setFoulPlayer(isP2 ? 1 : 0);
    };

    // Confirm Foul: Applies variable points
    const confirmFoul = (ballValue: number) => {
        if (foulPlayer === null) return;

        const newState = { ...state };
        if (foulPlayer === 0) {
            newState.p1FoulPoints += ballValue;
        } else {
            newState.p2FoulPoints += ballValue;
        }
        onUpdate(newState);
        setFoulPlayer(null);
    };

    // --- GAME CONTROL ---

    // 1. Full Reset (New Match)
    const handleResetMatch = () => {
        if (confirm("¿Comenzar NUEVO PARTIDO? (Todos los puntajes a 0)")) {
            onUpdate({
                gameType: 'CHILEAN',
                availableBalls: Array.from({ length: 15 }, (_, i) => i + 1),
                p1Balls: [],
                p2Balls: [],
                p1FoulPoints: 0,
                p2FoulPoints: 0,
                p1GamesWon: 0,
                p2GamesWon: 0
            });
        }
    }

    // 2. Win Set (Finish Rack, Increment Set, Reset Board)
    const handleWinSet = (visualSide: 'left' | 'right') => {
        const isP2 = (visualSide === 'left' && isSwapped) || (visualSide === 'right' && !isSwapped);
        const winnerName = isP2 ? playerNames[1] : playerNames[0];

        if (confirm(`¿Finalizar Mano/Set? Ganador: ${winnerName}`)) {
            const newState = {
                ...state,
                availableBalls: Array.from({ length: 15 }, (_, i) => i + 1),
                p1Balls: [],
                p2Balls: [],
                p1FoulPoints: 0,
                p2FoulPoints: 0,
                // Increment Sets
                p1GamesWon: (state.p1GamesWon || 0) + (!isP2 ? 1 : 0),
                p2GamesWon: (state.p2GamesWon || 0) + (isP2 ? 1 : 0),
            };
            onUpdate(newState);
        }
    }

    // Static list of all 15 balls for grid rendering
    const ALL_BALLS = Array.from({ length: 15 }, (_, i) => i + 1);

    return (
        <div className="h-full w-full flex flex-col bg-[#1a472a] relative overflow-hidden font-sans">
            {/* Green Felt Texture Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, transparent 20%, #000 130%)' }}></div>

            {/* Top Bar: Assignment Switcher */}
            <div className="z-10 bg-black/40 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/10 shadow-xl relative">

                {/* Left Controls */}
                <div className="absolute left-4 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSwapped(!isSwapped)}
                        className="border-white/20 text-indigo-300 hover:text-white hover:bg-white/10 text-xs uppercase font-bold tracking-wider"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" /> Rotar Lados
                    </Button>
                </div>

                <div className="flex items-center gap-4 mx-auto bg-black/60 p-2 px-6 rounded-full border border-white/10">
                    <span className={cn("font-bold transition-colors uppercase tracking-wider text-sm", !assignToP2 ? "text-emerald-400" : "text-zinc-500")}>
                        {leftName}
                    </span>

                    <Switch
                        checked={assignToP2}
                        onCheckedChange={setAssignToP2}
                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-emerald-600 scale-125 border-2 border-white/20"
                    />

                    <span className={cn("font-bold transition-colors uppercase tracking-wider text-sm", assignToP2 ? "text-blue-400" : "text-zinc-500")}>
                        {rightName}
                    </span>
                </div>

                <div className="absolute right-4">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleResetMatch}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest shadow-lg shadow-emerald-900/50"
                    >
                        NUEVO PARTIDO
                    </Button>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 grid grid-cols-12 p-4 gap-6 z-10 min-h-0">

                {/* Player Left Panel */}
                <div className="col-span-3 flex flex-col gap-4 h-full">
                    <PlayerCard
                        name={leftName}
                        rawScore={isSwapped ? metrics.p2RawScore : metrics.p1RawScore}
                        netScore={isSwapped ? metrics.p2NetScore : metrics.p1NetScore}
                        penalty={isSwapped ? (metrics.p2NetScore - metrics.p2RawScore) : (metrics.p1NetScore - metrics.p1RawScore)}
                        balls={isSwapped ? state.p2Balls : state.p1Balls}
                        colorClass="emerald"
                        onFoul={() => handleFoulClick('left')}
                        isActive={!assignToP2}
                        isWinner={isSwapped ? (metrics.winner === 'p2') : (metrics.winner === 'p1')}
                        setsWon={isSwapped ? (state.p2GamesWon || 0) : (state.p1GamesWon || 0)}
                        onWinSet={() => handleWinSet('left')}
                    />
                </div>

                {/* Center Table (Balls Grid or Camera) */}
                <div className="col-span-6 flex flex-col bg-black/20 rounded-3xl border border-white/5 p-6 shadow-inner relative h-full">
                    {/* Header Controls */}
                    <div className="absolute top-4 left-0 w-full flex justify-between px-6 z-20 pointer-events-none">
                        <span className="bg-black/60 text-emerald-100/90 text-sm px-4 py-1 rounded-full uppercase tracking-wider font-bold border border-emerald-500/30 backdrop-blur-md pointer-events-auto shadow-lg">
                            Mesa en Juego: {metrics.pointsRemaining} Ptos
                        </span>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowCamera(!showCamera)}
                            className="pointer-events-auto h-8 bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400/50 shadow-lg backdrop-blur-md gap-2"
                        >
                            {showCamera ? (
                                <>
                                    <Target className="w-4 h-4" /> Ver Mesa
                                </>
                            ) : (
                                <>
                                    <Monitor className="w-4 h-4" /> Ver Cámara
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="flex-1 flex items-center justify-center pt-10">
                        {showCamera ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <TableLiveStream
                                    cameraTopUrl={cameraTopUrl}
                                    cameraFrontUrl={cameraFrontUrl}
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 gap-4 scale-100 transition-transform">
                                {ALL_BALLS.map(ball => {
                                    const isAvailable = state.availableBalls.includes(ball);
                                    const isOwned = !isAvailable;

                                    const ownerKey = state.p1Balls.includes(ball) ? 'p1' : (state.p2Balls.includes(ball) ? 'p2' : null);

                                    let ownerLabel = '';
                                    let ownerColor = '';

                                    if (ownerKey === 'p1') {
                                        // P1 is Green (Left) unless swapped
                                        // If not swapped: P1=Left(Green). Swapped: P1=Right(Blue)
                                        ownerLabel = !isSwapped ? 'JUG A' : 'JUG B';
                                        ownerColor = !isSwapped ? "bg-emerald-900 text-emerald-400" : "bg-blue-900 text-blue-400";
                                    } else if (ownerKey === 'p2') {
                                        ownerLabel = !isSwapped ? 'JUG B' : 'JUG A';
                                        ownerColor = !isSwapped ? "bg-blue-900 text-blue-400" : "bg-emerald-900 text-emerald-400";
                                    }

                                    return (
                                        <div key={ball} className="relative group">
                                            <PoolBallIcon
                                                value={ball}
                                                size="xl"
                                                className={cn(
                                                    "transition-all duration-300 shadow-2xl",
                                                    !isAvailable && "opacity-20 scale-90 grayscale blur-[1px]",
                                                    // Hover effect
                                                    isAvailable && "hover:scale-110 hover:z-20 cursor-pointer"
                                                )}
                                                onClick={() => handleBallClick(ball)}
                                            />
                                            {isOwned && (
                                                <div className={cn(
                                                    "absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 rounded-full border border-white/20 whitespace-nowrap z-20 shadow-lg",
                                                    ownerColor
                                                )}>
                                                    {ownerLabel}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Player Right Panel */}
                <div className="col-span-3 flex flex-col gap-4 h-full">
                    <PlayerCard
                        name={rightName}
                        rawScore={isSwapped ? metrics.p1RawScore : metrics.p2RawScore}
                        netScore={isSwapped ? metrics.p1NetScore : metrics.p2NetScore}
                        penalty={isSwapped ? (metrics.p1NetScore - metrics.p1RawScore) : (metrics.p2NetScore - metrics.p2RawScore)}
                        balls={isSwapped ? state.p1Balls : state.p2Balls}
                        colorClass="blue"
                        onFoul={() => handleFoulClick('right')}
                        isActive={assignToP2}
                        isWinner={isSwapped ? (metrics.winner === 'p1') : (metrics.winner === 'p2')}
                        setsWon={isSwapped ? (state.p1GamesWon || 0) : (state.p2GamesWon || 0)}
                        onWinSet={() => handleWinSet('right')}
                    />
                </div>
            </div>

            {/* Bottom Service Bar */}
            <div className="h-16 bg-black/60 border-t border-white/10 flex items-center justify-center z-20 backdrop-blur-sm">
                <Button
                    variant="ghost"
                    className="text-indigo-300 hover:text-indigo-100 font-bold tracking-widest gap-2 opacity-50 hover:opacity-100 uppercase"
                    onClick={onOrderClick}
                >
                    <UtensilsCrossed className="w-5 h-5" /> Solicitar Servicio
                </Button>
            </div>

            {/* Foul Penalty Picker Dialog */}
            <Dialog open={foulPlayer !== null} onOpenChange={(open) => !open && setFoulPlayer(null)}>
                <DialogContent className="max-w-2xl bg-zinc-900/95 backdrop-blur-xl border-red-900/50 text-white shadow-2xl z-50">
                    <DialogHeader>
                        <DialogTitle className="text-center text-3xl uppercase font-black tracking-widest text-red-500 flex items-center justify-center gap-2">
                            <AlertTriangle className="w-8 h-8" />
                            Ingresar Valor de Pillo
                        </DialogTitle>
                        <p className="text-center text-zinc-400 font-mono">
                            Seleccione el valor de la bola correspondiente a la falta
                        </p>
                    </DialogHeader>

                    <div className="py-6 flex flex-col items-center gap-6">
                        <div className="grid grid-cols-5 gap-4">
                            {ALL_BALLS.map(val => {
                                const isAvailable = state.availableBalls.includes(val);
                                return (
                                    <button
                                        key={val}
                                        onClick={() => isAvailable && confirmFoul(val)}
                                        disabled={!isAvailable}
                                        className={cn(
                                            "w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-black shadow-lg transition-all border-2 border-transparent",
                                            isAvailable
                                                ? "hover:scale-110 active:scale-95 hover:border-white cursor-pointer"
                                                : "opacity-20 grayscale cursor-not-allowed",
                                            getBallColorWithBg(val)
                                        )}
                                    >
                                        {val}
                                    </button>
                                )
                            })}
                        </div>
                        <Button
                            variant="ghost"
                            className="text-zinc-500 hover:text-white"
                            onClick={() => setFoulPlayer(null)}
                        >
                            Cancelar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function PlayerCard({ name, rawScore, netScore, penalty, balls, colorClass, onFoul, isActive, isWinner, setsWon, onWinSet }: any) {
    const isEmerald = colorClass === 'emerald';

    return (
        <div className={cn(
            "flex-1 rounded-3xl p-4 flex flex-col gap-2 border-2 transition-all duration-300 bg-black/40 backdrop-blur-md shadow-2xl min-h-0",
            isEmerald ? "border-emerald-900/50" : "border-blue-900/50",
            isActive && (isEmerald ? "border-emerald-500 shadow-emerald-900/20 ring-1 ring-emerald-500/50" : "border-blue-500 shadow-blue-900/20 ring-1 ring-blue-500/50"),
            isWinner && "ring-4 ring-yellow-400 border-yellow-400 transform scale-105 z-30"
        )}>
            {/* Header / Score */}
            <div className="bg-black/40 rounded-2xl p-4 text-center relative overflow-hidden flex-shrink-0">
                <h3 className="text-zinc-400 font-bold uppercase text-xs tracking-widest mb-1 truncate px-2">{name}</h3>

                {/* Sets Won Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                    <Trophy className={cn("w-3 h-3", isEmerald ? "text-emerald-500" : "text-blue-500")} />
                    <span className="text-xs font-bold text-white">{setsWon} Sets</span>
                </div>

                <div className={cn(
                    "text-6xl font-black font-mono tracking-tighter tabular-nums mt-2",
                    isWinner ? "text-yellow-400" : "text-white"
                )}>
                    {netScore.toFixed(1)}
                </div>
                {isWinner && <div className="absolute top-2 right-2 text-yellow-400 animate-bounce"><Target /></div>}
            </div>

            {/* Stats Breakdown */}
            <div className="bg-black/20 rounded-xl p-3 flex flex-col gap-1 text-xs font-mono text-zinc-400 flex-shrink-0">
                <div className="flex justify-between">
                    <span>Bolas:</span>
                    <span className="text-white">{rawScore}</span>
                </div>
                <div className="flex justify-between">
                    <span>Ajeno/Pillo:</span>
                    <span className={penalty < 0 ? "text-red-400" : "text-green-400"}>
                        {penalty > 0 ? '+' : ''}{penalty.toFixed(1)}
                    </span>
                </div>
                <div className="border-t border-white/10 my-1"></div>
                <div className="flex justify-between font-bold">
                    <span>Neto:</span>
                    <span className="text-white">{netScore.toFixed(1)}</span>
                </div>
            </div>

            {/* Collected Balls - Scrollable area */}
            <div className="flex-1 bg-black/20 rounded-xl p-3 content-start flex flex-wrap gap-2 overflow-y-auto min-h-0">
                {balls.length === 0 && <span className="text-zinc-600 text-xs w-full text-center py-4 italic">Sin bolas</span>}
                {balls.map((b: number) => (
                    <PoolBallIcon key={b} value={b} size="sm" />
                ))}
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                <Button
                    onClick={onFoul}
                    className="h-14 bg-red-900/80 hover:bg-red-800 text-red-200 hover:text-white font-bold text-sm rounded-xl border border-red-500/30 uppercase"
                >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Pillo
                </Button>

                <Button
                    onClick={onWinSet}
                    className={cn(
                        "h-14 font-black text-sm rounded-xl border uppercase shadow-lg active:translate-y-1 transition-all",
                        isEmerald
                            ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white"
                            : "bg-blue-600 hover:bg-blue-500 border-blue-400 text-white"
                    )}
                >
                    <Trophy className="w-4 h-4 mr-1" />
                    Ganó Set
                </Button>
            </div>
        </div>
    )
}

function getBallColorWithBg(num: number) {
    if (num === 1 || num === 9) return 'bg-yellow-400';
    if (num === 2 || num === 10) return 'bg-blue-600';
    if (num === 3 || num === 11) return 'bg-red-600';
    if (num === 4 || num === 12) return 'bg-purple-600';
    if (num === 5 || num === 13) return 'bg-orange-500';
    if (num === 6 || num === 14) return 'bg-green-600';
    if (num === 7 || num === 15) return 'bg-amber-900';
    if (num === 8) return 'bg-black text-white';
    return 'bg-white';
}
