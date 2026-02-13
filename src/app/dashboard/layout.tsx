"use client"

import { Sidebar } from "@/components/sidebar"
import { SessionProvider } from "next-auth/react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SessionProvider>
            <div className="min-h-screen bg-background text-foreground">
                <Sidebar />
                <main className="ml-64 p-8 min-h-screen">
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </SessionProvider>
    )
}
