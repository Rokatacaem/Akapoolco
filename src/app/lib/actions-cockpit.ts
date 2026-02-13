import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { TableStatus } from "@prisma/client"

// Define types for actions to ensure type safety in client
export type ActionState = {
    error?: string
    success?: boolean
}

export async function startSession(tableId: string): Promise<ActionState> {
    const session = await auth()
    if (!session || !session.user) {
        return { error: "Unauthorized" }
    }

    try {
        // 1. Verify table is actually free
        const table = await prisma.table.findUnique({
            where: { id: tableId }
        })

        if (!table || table.status !== TableStatus.AVAILABLE) {
            return { error: "Table is not available" }
        }

        // 2. Create Session
        const newSession = await prisma.session.create({
            data: {
                tableId: tableId,
                startTime: new Date(),
                status: 'ACTIVE',
                totalAmount: 0 // Will be calculated on close or periodic updates
            }
        })

        // 3. Update Table Status & Link Session
        await prisma.table.update({
            where: { id: tableId },
            data: {
                status: TableStatus.OCCUPIED,
                currentSessionId: newSession.id
            }
        })

        revalidatePath('/dashboard/cockpit')
        return { success: true }
    } catch (error) {
        console.error("Failed to start session:", error)
        return { error: "Database error" }
    }
}

export async function stopSession(tableId: string): Promise<ActionState> {
    const session = await auth()
    if (!session || !session.user) {
        return { error: "Unauthorized" }
    }

    try {
        // 1. Get Table and Active Session
        const table = await prisma.table.findUnique({
            where: { id: tableId },
            include: { currentSession: true }
        })

        if (!table || !table.currentSessionId) {
            return { error: "No active session on this table" }
        }

        const currentSession = table.currentSession
        if (!currentSession) return { error: "Session mismatch" }

        const endTime = new Date()
        // Calculate duration in minutes
        const durationMs = endTime.getTime() - currentSession.startTime.getTime()
        const durationMin = Math.floor(durationMs / 60000)

        // Calculate Amount (Simple Mock Logic: $100 per minute)
        // TODO: Replace with Real Rate Engine
        const amount = durationMin * 100

        // 2. Update Session (Close it)
        await prisma.session.update({
            where: { id: currentSession.id },
            data: {
                endTime: endTime,
                status: 'CLOSED',
                durationMin: durationMin,
                totalAmount: amount
            }
        })

        // 3. Free Table
        await prisma.table.update({
            where: { id: tableId },
            data: {
                status: TableStatus.AVAILABLE,
                currentSessionId: null
            }
        })

        revalidatePath('/dashboard/cockpit')
        return { success: true }
    } catch (error) {
        console.error("Failed to stop session:", error)
        return { error: "Database error" }
    }
}
