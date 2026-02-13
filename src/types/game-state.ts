export interface PoolState {
    gameType: 'POOL' | 'POOL_INTL'; // Backward compat + New Key
    p1Racks: number;
    p2Racks: number;
    history: ('p1' | 'p2')[];
}

export interface CaromState {
    gameType: 'CAROM';
    p1Score: number;
    p2Score: number;

    // Stats
    innings: number;
    currentRun: number;
    p1HighRun?: number;
    p2HighRun?: number;

    // Multi-Match support
    p1GamesWon?: number;
    p2GamesWon?: number;

    // Referee Logic
    refereeName?: string;
    lagWinner?: 'p1' | 'p2';
    equalizingInning?: boolean;
    matchStatus?: 'WARMUP' | 'LAG' | 'PLAYING' | 'PAUSED' | 'FINISHED';
    finishedReason?: 'SCORE' | 'INNINGS' | 'WALKOVER';

    activePlayer?: 'p1' | 'p2';
    startPlayer?: 'p1' | 'p2';
    timerStatus?: 'idle' | 'running' | 'paused' | 'timeout';
    extensions?: { p1: number; p2: number };

    // Config (Optional - Tournament Mode)
    targetScore?: number;   // Distance
    limitInnings?: number;  // Innings Limit
    timerSettings?: {
        enabled: boolean;
        limitSeconds: number;
    };
}

export interface ChileanState {
    gameType: 'CHILEAN';
    availableBalls: number[]; // [1..15]
    p1Balls: number[];
    p2Balls: number[];
    p1FoulPoints: number;
    p2FoulPoints: number;
    p1GamesWon?: number;
    p2GamesWon?: number;
}

export interface SnookerState {
    gameType: 'SNOOKER';
    p1Score: number;
    p2Score: number;
    p1Frames: number;
    p2Frames: number;
    currentBreak: number;
}

export type GameState = PoolState | CaromState | ChileanState | SnookerState;
