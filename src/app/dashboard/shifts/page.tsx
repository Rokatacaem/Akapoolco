import { Suspense } from "react"
import { ShiftClient } from "./shift-client"
import { getActiveShiftDetails } from "@/app/lib/actions-shifts"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/auth"

export const dynamic = 'force-dynamic'

export default async function ShiftsPage() {
    const session = await auth()
    const shiftData = await getActiveShiftDetails()

    // Serialize dates/decimals
    const serializedData = shiftData ? {
        shift: {
            ...shiftData.shift,
            initialAmount: Number(shiftData.shift.initialAmount),
            finalAmount: shiftData.shift.finalAmount ? Number(shiftData.shift.finalAmount) : null,
            // Don't send all sales if not needed, summary is enough for top view
            sales: undefined
        },
        summary: shiftData.summary
    } : null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Caja y Turnos</h1>
                <p className="text-muted-foreground">
                    Control de apertura, cierre de caja y registro de turnos.
                </p>
            </div>
            <Separator className="bg-white/10" />

            <Suspense fallback={<div className="text-white">Cargando información de turno...</div>}>
                <ShiftClient
                    initialData={serializedData}
                    userId={session?.user?.id || ""}
                />
            </Suspense>
        </div>
    )
}
