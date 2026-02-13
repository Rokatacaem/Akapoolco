import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CockpitClient } from "./cockpit-client-v2"
import { getTables } from "@/app/lib/actions-tables"

// This is a Server Component that fetches initial data
export const dynamic = "force-dynamic"

export default async function CockpitPage() {
    const session = await auth()
    if (!session) redirect("/login")

    const userRole = session.user?.role;

    try {
        const serializedTables = await getTables();

        return (
            <CockpitClient
                tables={serializedTables}
                userRole={userRole}
                userName={session.user?.name || 'Usuario'}
            />
        )
    } catch (error: any) {
        console.error("Cockpit Error:", error);
        return (
            <div className="p-10 text-red-500">
                <h2 className="text-2xl font-bold">Error Cargar Panel de Mesas</h2>
                <pre className="mt-4 bg-slate-900 p-4 rounded text-xs overflow-auto">
                    {error.message}
                </pre>
            </div>
        )
    }
}
