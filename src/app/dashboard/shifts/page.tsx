import { Suspense } from "react"
import { ShiftClient } from "./shift-client"
import { getActiveShiftDetails } from "@/app/lib/actions-shifts"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/auth"

export const dynamic = 'force-dynamic'

export default async function ShiftsPage() {
    const session = await auth()
    const shiftData = await getActiveShiftDetails()

    // shiftData is already serialized by the server action
    // We can pass it directly, or filter sales if needed for performance.
    // For now, passing it directly is safest and cleanest.
    const serializedData = shiftData;

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
