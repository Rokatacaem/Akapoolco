import { useEffect, useState, useCallback } from "react";
import { GameState, PoolState, CaromState, ChileanState, SnookerState } from "@/types/game-state";
import { PoolScoreboard } from "./PoolScoreboard";
import { CaromScoreboard } from "./CaromScoreboard";
import { ChileanPoolScoreboard } from "./ChileanPoolScoreboard";
import { SnookerScoreboard } from "./SnookerScoreboard";
import { CardScoreboard } from "./CardScoreboard";
import { updateGameState } from "@/app/lib/actions-kiosk";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

interface GameScoreboardProps {
    sessionId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialState: any; // Raw JSON from DB
    tableType: string;
    playerNames: [string, string];
    players?: { name: string; image?: string | null }[];
    cameraTopUrl?: string | null;
    cameraFrontUrl?: string | null;
    onOrderClick?: () => void;
}

export function GameScoreboard({
    sessionId,
    initialState,
    tableType,
    playerNames,
    players,
    cameraTopUrl,
    cameraFrontUrl,
    onOrderClick
}: GameScoreboardProps) {
    const [gameState, setGameState] = useState<GameState | null>(null);

    // Initial State Factory
    // Initial State Factory
    useEffect(() => {
        if (initialState) {
            const loadedState = initialState as GameState;
            // Hot-Fix: Force Game Type correction if DB has old state mismatch
            // e.g. Table is CHILEAN but State is POOL
            if ((tableType === 'POOL_CHILENO' || tableType === 'CHILEAN') && loadedState.gameType !== 'CHILEAN') {
                setTimeout(() => setGameState({
                    gameType: 'CHILEAN',
                    availableBalls: Array.from({ length: 15 }, (_, i) => i + 1), // 1-15
                    p1Balls: [],
                    p2Balls: [],
                    p1FoulPoints: 0,
                    p2FoulPoints: 0,
                    p1GamesWon: 0,
                    p2GamesWon: 0
                }), 0);
            } else if ((tableType === 'POOL_CHILENO' || tableType === 'CHILEAN') && loadedState.gameType === 'CHILEAN' && loadedState.p1GamesWon === undefined) {
                // Backward compatibility for states created before this feature
                setTimeout(() => setGameState({
                    ...loadedState,
                    p1GamesWon: 0,
                    p2GamesWon: 0
                }), 0);
            } else if (tableType === 'SNOOKER' && loadedState.gameType !== 'SNOOKER') {
                setTimeout(() => setGameState({
                    gameType: 'SNOOKER',
                    p1Score: 0,
                    p2Score: 0,
                    p1Frames: 0,
                    p2Frames: 0,
                    currentBreak: 0
                }), 0);
            } else {
                setTimeout(() => setGameState(loadedState), 0);
            }
        } else {
            // Default Init logic - Ensure we don't trigger unnecessary re-renders loop
            // We only set this if gameState is null (first load)
            setTimeout(() => {
                setGameState(prev => {
                    if (prev) return prev; // Don't override if already set (optimistic updates preservation)

                    if (tableType === 'CARAMBOLA') {
                        return {
                            gameType: 'CAROM',
                            p1Score: 0,
                            p2Score: 0,
                            innings: 0,
                            currentRun: 0
                        };
                    } else if (tableType === 'POOL_CHILENO' || tableType === 'CHILEAN') {
                        return {
                            gameType: 'CHILEAN',
                            availableBalls: Array.from({ length: 15 }, (_, i) => i + 1), // 1-15
                            p1Balls: [],
                            p2Balls: [],
                            p1FoulPoints: 0,
                            p2FoulPoints: 0,
                            p1GamesWon: 0,
                            p2GamesWon: 0
                        };
                    } else if (tableType === 'SNOOKER') {
                        return {
                            gameType: 'SNOOKER',
                            p1Score: 0,
                            p2Score: 0,
                            p1Frames: 0,
                            p2Frames: 0,
                            currentBreak: 0
                        };
                    } else {
                        return {
                            gameType: 'POOL',
                            p1Racks: 0,
                            p2Racks: 0,
                            history: []
                        };
                    }
                });
            }, 0);
        }
    }, [initialState, tableType]);

    // Persist to Server with Debounce
    const debouncedSave = useDebouncedCallback(async (newState: GameState) => {
        const result = await updateGameState(sessionId, newState);
        if (!result.success) {
            toast.error("Error al guardar marcador", {
                description: "Verifique su conexión",
                duration: 2000
            });
        }
    }, 1000); // 1.0s debounce

    const handleUpdate = useCallback((newState: GameState) => {
        setGameState(newState); // Optimistic
        debouncedSave(newState); // Server
    }, [debouncedSave]);

    // Props for children
    const videoProps = { cameraTopUrl, cameraFrontUrl };

    if (tableType === 'CARDS' || tableType === 'POKER') {
        return (
            <div className="w-full h-full bg-black/90 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                <CardScoreboard
                    playerNames={playerNames}
                    {...videoProps}
                    onOrderClick={onOrderClick}
                />
            </div>
        )
    }

    if (!gameState) return <div className="text-zinc-500 p-10">Cargando marcador...</div>;

    return (
        <div className="w-full h-full bg-black/90 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
            {gameState.gameType === 'CAROM' && (
                <CaromScoreboard
                    state={gameState as CaromState}
                    playerNames={playerNames}
                    onUpdate={handleUpdate}
                    {...videoProps}
                    onOrderClick={onOrderClick}
                />
            )}
            {(gameState.gameType === 'POOL' || gameState.gameType === 'POOL_INTL') && (
                <PoolScoreboard
                    state={gameState as PoolState}
                    playerNames={playerNames}
                    onUpdate={handleUpdate}
                    {...videoProps}
                    onOrderClick={onOrderClick}
                />
            )}
            {gameState.gameType === 'CHILEAN' && (
                <ChileanPoolScoreboard
                    state={gameState as ChileanState}
                    playerNames={playerNames}
                    players={players}
                    onUpdate={handleUpdate}
                    {...videoProps}
                    onOrderClick={onOrderClick}
                />
            )}
            {gameState.gameType === 'SNOOKER' && (
                <SnookerScoreboard
                    state={gameState as SnookerState}
                    playerNames={playerNames}
                    onUpdate={handleUpdate}
                    {...videoProps}
                    onOrderClick={onOrderClick}
                />
            )}
        </div>
    );
}
