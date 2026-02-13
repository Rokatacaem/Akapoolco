/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { addToWaitingList, updateWaitingStatus } from "@/app/lib/actions-waiting-list"
import { toast } from "sonner"
import { Plus, Phone, CheckCircle, XCircle, BellRing } from "lucide-react"

// Define a local interface or import from prisma if available, but local is safer for client to avoid large imports
interface WaitingItem {
    id: string
    name: string
    phone?: string
    gameType: string
    partySize: number
    status: string
    createdAt: string | Date
}

interface WaitingListClientProps {
    initialList: WaitingItem[]
}

const GAME_TYPES = ["POOL", "CARAMBOLA", "POOL_CHILENO", "NINE_BALL", "CARDS", "SNOOKER"]

export function WaitingListClient({ initialList }: WaitingListClientProps) {
    const [list, setList] = useState<WaitingItem[]>(initialList)
    const [newItem, setNewItem] = useState({
        name: "",
        phone: "",
        gameType: "POOL",
        partySize: 1
    })
    const [isLoading, setIsLoading] = useState(false)

    // Sync state with props if they change (server revalidation)
    if (initialList !== list) setList(initialList)

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await addToWaitingList(newItem as any)
            if (res.error) throw new Error(res.error)
            toast.success("Cliente agregado a la lista")
            setNewItem({ name: "", phone: "", gameType: "POOL", partySize: 1 })
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStatus = async (id: string, status: "NOTIFIED" | "SEATED" | "CANCELLED") => {
        try {
            await updateWaitingStatus(id, status)
            toast.success("Estado actualizado")
        } catch (error) {
            toast.error("Error al actualizar")
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* Add New Form */}
            <div className="md:col-span-1">
                <div className="rounded-lg border border-white/10 bg-black/20 p-4 space-y-4 sticky top-4">
                    <h3 className="font-semibold text-lg flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Nuevo Ingreso
                    </h3>
                    <form onSubmit={handleAdd} className="space-y-3">
                        <div className="space-y-1">
                            <Label>Nombre</Label>
                            <Input
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                className="bg-black/20 border-white/10"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Teléfono (Opcional)</Label>
                            <Input
                                value={newItem.phone}
                                onChange={e => setNewItem({ ...newItem, phone: e.target.value })}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Juego</Label>
                            <Select
                                value={newItem.gameType}
                                onValueChange={val => setNewItem({ ...newItem, gameType: val })}
                            >
                                <SelectTrigger className="bg-black/20 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    {GAME_TYPES.map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Personas</Label>
                            <Input
                                type="number"
                                min={1}
                                value={newItem.partySize}
                                onChange={e => setNewItem({ ...newItem, partySize: Number(e.target.value) })}
                                className="bg-black/20 border-white/10"
                            />
                        </div>
                        <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
                            Agregar a Lista
                        </Button>
                    </form>
                </div>
            </div>

            {/* List View */}
            <div className="md:col-span-2 space-y-4">
                <div className="rounded-md border border-white/10">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-gray-400">Cliente</TableHead>
                                <TableHead className="text-gray-400">Juego / Pax</TableHead>
                                <TableHead className="text-gray-400">Tiempo</TableHead>
                                <TableHead className="text-gray-400">Estado</TableHead>
                                <TableHead className="text-gray-400 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {list.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        No hay clientes en espera
                                    </TableCell>
                                </TableRow>
                            )}
                            {list.map((item) => {
                                // Time calc
                                const min = Math.floor((new Date().getTime() - new Date(item.createdAt).getTime()) / 60000)
                                return (
                                    <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium text-white">
                                            <div className="flex flex-col">
                                                <span>{item.name}</span>
                                                {item.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {item.phone}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-300">
                                            <Badge variant="outline" className="mr-2 text-xs border-white/20">{item.gameType}</Badge>
                                            <span className="text-xs text-muted-foreground">{item.partySize} pax</span>
                                        </TableCell>
                                        <TableCell className="text-gray-300 font-mono text-sm">
                                            <span className={min > 20 ? "text-red-400 font-bold" : "text-emerald-400"}>{min} min</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={
                                                item.status === 'WAITING' ? "bg-amber-900/50 text-amber-200" :
                                                    item.status === 'NOTIFIED' ? "bg-blue-900/50 text-blue-200" : "bg-slate-800"
                                            }>{item.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right flex justify-end gap-1">
                                            {item.status === 'WAITING' && (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400" title="Notificar" onClick={() => handleStatus(item.id, 'NOTIFIED')}>
                                                    <BellRing className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-400" title="Sentar (Mesa)" onClick={() => handleStatus(item.id, 'SEATED')}>
                                                <CheckCircle className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" title="Cancelar" onClick={() => handleStatus(item.id, 'CANCELLED')}>
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
