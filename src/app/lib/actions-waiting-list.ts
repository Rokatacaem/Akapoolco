/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { TableType } from "@prisma/client"

export async function addToWaitingList(data: {
    name: string
    phone?: string
    gameType: TableType
    partySize: number
}) {
    try {
        await (prisma as any).waitingList.create({
            data: {
                name: data.name,
                phone: data.phone,
                gameType: data.gameType,
                partySize: data.partySize,
                status: "WAITING"
            }
        })
        revalidatePath('/dashboard/cockpit') // Make sure cockpit sees it? Or dedicated page
        revalidatePath('/dashboard/waiting-list')
        return { success: true }
    } catch (error) {
        return { error: "Error al agregar a lista de espera" }
    }
}

export async function updateWaitingStatus(id: string, status: "NOTIFIED" | "SEATED" | "CANCELLED" | "NO_SHOW") {
    try {
        await (prisma as any).waitingList.update({
            where: { id },
            data: { status }
        })
        revalidatePath('/dashboard/waiting-list')
        return { success: true }
    } catch (error) {
        return { error: "Error al actualizar estado" }
    }
}

export async function getWaitingList() {
    return await (prisma as any).waitingList.findMany({
        where: {
            status: { in: ["WAITING", "NOTIFIED"] }
        },
        orderBy: { createdAt: 'asc' }
    })
}
