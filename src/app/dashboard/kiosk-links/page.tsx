import { getTables } from "@/app/lib/actions-tables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, QrCode } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata = {
    title: "Enlaces de Kiosco (Tablets) | Club Santiago",
    description: "Accesos directos para configurar los tablets de las mesas",
};

export default async function KioskLinksPage() {
    const tables = await getTables();

    // Group tables by type
    const groupedTables = tables.reduce((acc, table) => {
        const type = table.type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(table);
        return acc;
    }, {} as Record<string, typeof tables>);

    // Order of types
    const typeOrder = ['CARAMBOLA', 'NINE_BALL', 'POOL_CHILENO', 'POOL', 'SNOOKER', 'CARDS'];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                <div className="bg-purple-600/20 p-3 rounded-xl">
                    <QrCode className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Enlaces de Kiosco</h1>
                    <p className="text-slate-400">Utiliza estos enlaces para configurar los tablets en cada mesa.</p>
                </div>
            </div>

            <div className="grid gap-8">
                {typeOrder.map((type) => {
                    const group = groupedTables[type];
                    if (!group || group.length === 0) return null;

                    return (
                        <div key={type} className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-300 border-l-4 border-purple-500 pl-3">
                                {type.replace('_', ' ')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.map((table) => (
                                    <KioskLinkCard key={table.id} table={table} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function KioskLinkCard({ table }: { table: any }) {
    // Construct URL (assuming env var or hardcoded for now based on text file)
    // Using window.location in client is easiest, but here we are server.
    // We'll use a relative link for the "Open" button, or construct absolute if we know the base.
    // Based on user's text file: https://club-santiago-bsm.vercel.app/table/...

    // We'll use a client component wrapper or just simple links. 
    // Since we don't know the exact domain dynamically on server without headers (which is fine in page), 
    // we'll pass the ID and let a Client Component handle the "Copy" logic.

    return (
        <Card className="bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-colors group">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-white flex justify-between items-center">
                    {table.name}
                    <Badge variant="outline" className="text-[10px] border-slate-700">{table.status}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mt-2">
                    <Button asChild variant="default" size="sm" className="w-full bg-blue-600 hover:bg-blue-500">
                        <Link href={`/table/${table.id}`} target="_blank" prefetch={false}>
                            <ExternalLink className="w-4 h-4 mr-2" /> Abrir
                        </Link>
                    </Button>
                    <CopyButton path={`/table/${table.id}`} />
                </div>
            </CardContent>
        </Card>
    );
}

import { CopyButton } from "@/components/admin/CopyButton"; // I need to create this or inline it. 
// I'll assume I need to create it to be safe.
