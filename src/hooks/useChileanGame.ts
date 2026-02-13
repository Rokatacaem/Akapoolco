
import { useMemo } from 'react';
import { ChileanState } from '@/types/game-state';

export interface ScoreMetrics {
    p1RawScore: number;
    p2RawScore: number;
    p1NetScore: number;
    p2NetScore: number;
    pointsRemaining: number;
    winner: 'p1' | 'p2' | null;
}

export function useChileanGame(state: ChileanState) {

    // Constants
    const TOTAL_POINTS = 120;

    // derived State
    const metrics = useMemo<ScoreMetrics>(() => {
        // 1. Raw Ball Score = Sum(balls)
        const p1RawScore = state.p1Balls.reduce((a, b) => a + b, 0);
        const p2RawScore = state.p2Balls.reduce((a, b) => a + b, 0);

        // 2. Net Score = Raw Ball Score - (MyFoul / 2) + (OpponentFoul / 2)
        // Note: The logic requested is:
        // "If P1 commits foul of P (stored as p1FoulPoints):
        // P1 loses P/2 (Debit)
        // P2 gains P/2 (Credit)"

        // p1FoulPoints is the SUM of penalties committed by P1.
        // So P1 has lost (p1FoulPoints / 2). P2 has gained (p1FoulPoints / 2).

        const p1PenaltyEffect = state.p1FoulPoints / 2; // What P1 loses
        const p2PenaltyEffect = state.p2FoulPoints / 2; // What P2 loses

        const p1NetScore = p1RawScore - p1PenaltyEffect + p2PenaltyEffect;
        const p2NetScore = p2RawScore - p2PenaltyEffect + p1PenaltyEffect;

        // 3. Points Remaining
        const pointsRemaining = TOTAL_POINTS - (p1RawScore + p2RawScore);

        // Winner Check
        // Winner Check
        let winner: 'p1' | 'p2' | null = null;

        // 1. Early Win (Majority > 60)
        // If > 60, impossible for other to catch up if Sum is 120. 
        // Techincally > 60.0 is enough for majority. 60.5 covers 60.5 case.
        if (p1NetScore > 60) winner = 'p1';
        if (p2NetScore > 60) winner = 'p2';

        // 2. End of Game Check (No balls left)
        if (pointsRemaining === 0 && !winner) {
            if (p1NetScore > p2NetScore) winner = 'p1';
            else if (p2NetScore > p1NetScore) winner = 'p2';
        }

        return {
            p1RawScore,
            p2RawScore,
            p1NetScore,
            p2NetScore,
            pointsRemaining,
            winner
        };
    }, [state.p1Balls, state.p2Balls, state.p1FoulPoints, state.p2FoulPoints]);

    return metrics;
}
