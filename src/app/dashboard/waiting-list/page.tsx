import { Suspense } from "react"
import { WaitingListClient } from "./waiting-list-client"
import { getWaitingList } from "@/app/lib/actions-waiting-list"
import { Separator } from "@/components/ui/separator"

export const dynamic = 'force-dynamic'

export default async function WaitingListPage() {
    const list = await getWaitingList()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Lista de Espera</h1>
                <p className="text-muted-foreground">
                    Gestión de clientes en espera para mesas.
                </p>
            </div>
            <Separator className="bg-white/10" />

            <Suspense fallback={<div className="text-white">Cargando lista...</div>}>
                <WaitingListClient initialList={list} />
            </Suspense>
        </div>
    )
}
