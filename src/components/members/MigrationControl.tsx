"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { migrateUsersToMembers } from "@/app/lib/actions-migration"
import { ArrowLeftRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function MigrationControl() {
    const [isLoading, setIsLoading] = useState(false)

    async function handleMigration() {
        if (!confirm("¿Está seguro de migrar los datos de 'Usuarios' a 'Socios'? Esto copiará la información faltante.")) return;

        setIsLoading(true)
        const result = await migrateUsersToMembers()
        setIsLoading(false)

        if (result.success) {
            toast.success("Migración exitosa", { description: result.message })
        } else {
            toast.error("Error", { description: result.error })
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleMigration}
            disabled={isLoading}
            className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
        >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="mr-2 h-4 w-4" />}
            Migrar Datos Antiguos
        </Button>
    )
}
