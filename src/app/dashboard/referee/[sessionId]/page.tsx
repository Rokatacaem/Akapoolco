import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RefereeMatchControl } from "@/components/referee/RefereeMatchControl";
import { CaromState } from "@/types/game-state";

interface PageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function RefereeSessionPage(props: PageProps) {
    const params = await props.params;
    const session = await prisma.session.findUnique({
        where: { id: params.sessionId },
        include: {
            table: true,
            sessionPlayers: {
                include: {
                    member: true,
                    user: true
                },
                orderBy: {
                    createdAt: 'asc' // Ensure consistent p1/p2 order
                }
            }
        }
    });

    if (!session) return notFound();

    // Default State if none
    const initialState = (session.gameState as unknown as CaromState) || {
        gameType: 'CAROM',
        p1Score: 0,
        p2Score: 0,
        innings: 0,
        currentRun: 0,
        // Default timer settings if table has them, or default off
        timerSettings: { enabled: true, limitSeconds: 40 }
    };

    // Extract Names
    const p1 = session.sessionPlayers[0];
    const p2 = session.sessionPlayers[1];

    // Fallback names
    const name1 = p1?.member?.name || p1?.user?.name || p1?.guestName || "Jugador 1";
    const name2 = p2?.member?.name || p2?.user?.name || p2?.guestName || "Jugador 2";

    return (
        <RefereeMatchControl
            sessionId={session.id}
            initialState={initialState}
            playerNames={[name1, name2]}
            tableId={session.table.name}
        />
    );
}
