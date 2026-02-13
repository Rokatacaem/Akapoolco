import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Users, Clock, ArrowRight } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function RefereeDashboardPage() {
    // Fetch active sessions
    // We prioritize sessions with status 'ACTIVE'
    const activeSessions = await prisma.session.findMany({
        where: {
            status: 'ACTIVE',
            endTime: null,
            // You might want to filter specific table types or tournament info here
        },
        include: {
            table: true,
            sessionPlayers: {
                include: {
                    member: true,
                    user: true
                }
            }
        },
        orderBy: {
            startTime: 'desc'
        }
    });

    return (
        <div className="flex-1 overflow-auto p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Panel de Juez</h1>
                    <p className="text-zinc-400">Seleccione un partido activo para arbitrar</p>
                </div>
            </header>

            {activeSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                    <Gamepad2 className="w-16 h-16 text-zinc-700 mb-4" />
                    <h3 className="text-xl font-bold text-zinc-500">No hay partidos activos</h3>
                    <p className="text-zinc-600 mt-2">Los partidos iniciados aparecerán aquí</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSessions.map((session) => {
                        const p1 = session.sessionPlayers[0];
                        const p2 = session.sessionPlayers[1];
                        const p1Name = p1?.member?.name || p1?.user?.name || p1?.guestName || "Jugador 1";
                        const p2Name = p2?.member?.name || p2?.user?.name || p2?.guestName || "Jugador 2";

                        return (
                            <Link key={session.id} href={`/dashboard/referee/${session.id}`}>
                                <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer group">
                                    <CardHeader className="pb-3 border-b border-zinc-800/50">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="bg-zinc-950 border-zinc-700 text-zinc-400">
                                                {session.table.name}
                                            </Badge>
                                            {/* We could check if it has gameState active */}
                                            {session.gameState && (
                                                <Badge className="bg-emerald-900/50 text-emerald-400 border-emerald-800 hover:bg-emerald-900">
                                                    EN JUEGO
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="mt-4 text-xl font-bold text-white flex gap-2 items-center">
                                            <span className="truncate flex-1 text-right">{p1Name.split(' ')[0]}</span>
                                            <span className="text-zinc-600 font-black text-sm">VS</span>
                                            <span className="truncate flex-1">{p2Name.split(' ')[0]}</span>
                                        </CardTitle>
                                        <CardDescription className="text-zinc-500 text-xs uppercase font-mono mt-1 text-center">
                                            {session.table.type}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-4 flex items-center justify-between">
                                        <div className="flex items-center text-zinc-500 text-sm gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>
                                                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 text-white hover:bg-emerald-500">
                                            Arbitrar <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
