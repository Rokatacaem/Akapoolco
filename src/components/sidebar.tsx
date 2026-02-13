"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Grid, LogOut, Package, Scale, ListOrdered, MonitorPlay, Link2, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { filterByRole } from "@/lib/permissions"
import { UserRole } from "@prisma/client"
import { signOut } from "next-auth/react"
import { useState } from "react"
import { ChangePasswordDialog } from "@/components/auth/ChangePasswordDialog"
import { Lock } from "lucide-react"

const ALL_MENU_ITEMS = [
    {
        href: "/dashboard",
        icon: LayoutDashboard,
        label: "Inicio",
        roles: ["ADMIN", "STAFF", "SUPERUSER"] as UserRole[]
    },
    {
        href: "/dashboard/cockpit",
        icon: Grid,
        label: "Panel de Control",
        roles: ["ADMIN", "STAFF"] as UserRole[]
    },
    {
        href: "/dashboard/members",
        icon: Users,
        label: "Socios",
        roles: ["ADMIN", "SUPERUSER"] as UserRole[]
    },
    {
        href: "/dashboard/products",
        icon: Package,
        label: "Productos",
        roles: ["ADMIN", "STAFF", "SUPERUSER"] as UserRole[]
    },
    {
        href: "/dashboard/kitchen",
        icon: Utensils,
        label: "Cocina",
        roles: ["ADMIN", "STAFF", "SUPERUSER"] as UserRole[]
    },
    {
        href: "/dashboard/shifts",
        icon: Scale,
        label: "Caja y Turnos",
        roles: ["ADMIN", "STAFF", "SUPERUSER"] as UserRole[]
    },
    {
        href: "/dashboard/waiting-list",
        icon: ListOrdered,
        label: "Lista de Espera",
        roles: ["ADMIN", "STAFF", "SUPERUSER"] as UserRole[]
    },
    {
        href: "/dashboard/marketing",
        icon: MonitorPlay,
        label: "Publicidad",
        roles: ["ADMIN", "SUPERUSER"] as UserRole[]
    },
    {
        href: "/dashboard/kiosk-links",
        icon: Link2,
        label: "Enlaces Kiosco",
        roles: ["ADMIN", "STAFF", "SUPERUSER"] as UserRole[]
    },
    {
        href: "/dashboard/users",
        icon: Users,
        label: "Usuarios",
        roles: ["ADMIN", "SUPERUSER"] as UserRole[]
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const [isPasswordOpen, setIsPasswordOpen] = useState(false)

    // Filtrar menu items según el rol del usuario
    // Durante SSR o loading, mostrar todos los items (se filtrará en el cliente)
    const menuItems = status === "authenticated"
        ? filterByRole(ALL_MENU_ITEMS, session?.user?.role as UserRole | undefined)
        : ALL_MENU_ITEMS // Mostrar todos durante carga

    return (
        <aside className="w-64 h-screen bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0 z-50">
            <div className="p-6 flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                    <img
                        src="/images/branding/logo.jpg"
                        alt="Akapoolco Logo"
                        className="object-contain w-full h-full rounded-full border-2 border-[#C5A059]/50"
                    />
                </div>
                <h1 className="text-xl font-bold tracking-tighter text-[#C5A059] flex items-center gap-2">
                    Akapoolco
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Gestión del Sistema</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary/20 text-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 gap-3"
                    onClick={() => setIsPasswordOpen(true)}
                >
                    <Lock className="w-5 h-5" />
                    Cambiar Contraseña
                </Button>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-3"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="w-5 h-5" />
                    Cerrar Sesión
                </Button>
            </div>


            <ChangePasswordDialog
                open={isPasswordOpen}
                onOpenChange={setIsPasswordOpen}
            />
        </aside >
    )
}
