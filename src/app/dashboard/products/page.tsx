/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react"
import { ProductsClient } from "./products-client"
import { getProductsWithStock } from "@/app/lib/actions-products"
import { Separator } from "@/components/ui/separator"

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
    const products = await getProductsWithStock()

    // Serialize Decimals to plain numbers for Client Components
    const serializedProducts = products.map(p => ({
        ...p,
        priceMember: Number(p.priceMember),
        priceClient: Number(p.priceClient),
        stockMovements: p.stockMovements.map(m => ({
            ...m,
            // Add any decimal conversion for movements if needed, currently quantity is Int
        }))
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Inventario y Productos</h1>
                <p className="text-muted-foreground">
                    Gestiona el catálogo de productos, precios diferenciados y control de stock.
                </p>
            </div>
            <Separator className="bg-white/10" />

            <Suspense fallback={<div className="text-white">Cargando productos...</div>}>
                <ProductsClient initialProducts={serializedProducts as any[]} />
            </Suspense>
        </div>
    )
}
