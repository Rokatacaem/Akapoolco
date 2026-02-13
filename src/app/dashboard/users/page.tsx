import { Suspense } from "react"
import { getUsers } from "@/app/lib/actions-users"
import { UsersClient } from "./users-client"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
    const session = await auth()
    if (!session?.user) redirect("/login")

    // Double check permission on page load to redirect generic staff
    const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!currentUser || !hasPermission(currentUser.role, "MANAGE_USERS")) {
        redirect("/dashboard")
    }

    const users = await getUsers()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">
                    Administración de cuentas con acceso al sistema (Administradores, Cajeros, etc.)
                </p>
            </div>
            <Separator className="bg-white/10" />

            <Suspense fallback={<div className="text-white">Cargando usuarios...</div>}>
                <UsersClient initialUsers={users} />
            </Suspense>
        </div>
    )
}
