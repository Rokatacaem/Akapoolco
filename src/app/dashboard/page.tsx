import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getDashboardStats, getActiveTablesSummary, getDebtorsWatchlist } from "@/app/lib/actions-dashboard"
import { StatCards } from "@/components/dashboard/StatCards"
import { QuickSaleWidget } from "@/components/dashboard/QuickSaleWidget"
import { ActiveTablesWidget } from "@/components/dashboard/ActiveTablesWidget"
import { DebtorsWidget } from "@/components/dashboard/DebtorsWidget"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    // Parallel Data Fetching
    const [stats, activeTables, debtors] = await Promise.all([
        getDashboardStats(),
        getActiveTablesSummary(),
        getDebtorsWatchlist()
    ])

    return (
        <div className="min-h-[calc(100vh-4rem)] p-4 md:p-6 flex flex-col bg-slate-950">
            {/* Header / Stats Row */}
            <div className="mb-6 flex-shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                            Panel Principal
                        </h1>
                        <p className="text-slate-400">Bienvenido, {session.user?.name}</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Club Santiago</div>
                        <div className="text-sm text-emerald-500">Sistema Operativo</div>
                    </div>
                </div>

                <StatCards stats={stats} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">

                {/* 1. Active Tables */}
                <div className="h-full">
                    <ActiveTablesWidget tables={activeTables} />
                </div>

                {/* 2. Debtors (Cobranza) */}
                <div className="h-full">
                    <DebtorsWidget debtors={debtors.map((d: any) => ({ ...d, currentDebt: Number(d.currentDebt) }))} />
                </div>

                {/* 3. Quick Sale (POS) */}
                <div className="h-full">
                    <QuickSaleWidget />
                </div>
            </div>
        </div>
    )
}
