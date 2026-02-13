
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const table = await prisma.table.findFirst({
            where: { name: 'Billar 1' },
            include: {
                currentSession: {
                    include: {
                        sessionPlayers: {
                            include: {
                                user: true,
                                member: true
                            }
                        }
                    }
                }
            }
        });

        if (!table || !table.currentSession) {
            return NextResponse.json({ success: false, error: 'No active session' });
        }

        return NextResponse.json({
            success: true,
            session: {
                id: table.currentSession.id,
                playersJSON: table.currentSession.players,
                sessionPlayers: table.currentSession.sessionPlayers.map(p => ({
                    id: p.id,
                    guestName: p.guestName,
                    memberName: p.member?.name,
                    userName: p.user?.name,
                    status: p.status
                }))
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
