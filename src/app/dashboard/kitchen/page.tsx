import { Suspense } from "react"
import { Separator } from "@/components/ui/separator"
import { getIngredients } from "@/app/lib/actions-kitchen"
import { IngredientsManager } from "./ingredients-manager"

export const dynamic = 'force-dynamic'

export default async function KitchenPage() {
    const ingredients = await getIngredients()

    // Serialize Decimal to number for client
    const serializedIngredients = ingredients.map(i => ({
        ...i,
        currentStock: Number(i.currentStock),
        cost: Number(i.cost),
        lossPercentage: Number(i.lossPercentage)
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Cocina e Inventario</h1>
                <p className="text-muted-foreground">
                    Gestión de ingredientes, recetas y control de stock de cocina.
                </p>
            </div>
            <Separator className="bg-white/10" />

            <Suspense fallback={<div className="text-white">Cargando ingredientes...</div>}>
                <IngredientsManager initialIngredients={serializedIngredients} />
            </Suspense>
        </div>
    )
}
