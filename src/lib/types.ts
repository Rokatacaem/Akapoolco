export interface SessionPlayer {
    id?: string;        // ID from Member model (was userId)
    userId?: string;    // Legacy or alternative
    name: string;       // Display name (from Member or Guest input)
    type: 'MEMBER' | 'GUEST';
}

export interface SessionData {
    players: SessionPlayer[];
    isTraining: boolean;
    note?: string;
}
