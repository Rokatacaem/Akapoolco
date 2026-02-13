/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Users, DollarSign, Loader2, Plus, Trash2, CreditCard, Banknote } from "lucide-react"
import { endSession } from "@/app/lib/actions-sessions"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { searchMembers } from "@/app/lib/actions-members"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Helper Component for Payment Row User Search (Using Popover for visibility)
function PaymentUserSelect({
    value,
    onSelect,
    required = false
}: {
    value?: { id: string, name: string },
    onSelect: (user: { id: string, name: string } | undefined) => void,
    required?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [term, setTerm] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!open) {
            setTerm("")
            setResults([])
        }
    }, [open])

    const handleSearch = async (val: string) => {
        setTerm(val)
        if (val.length < 2) {
            setResults([])
            return
        }
        setLoading(true)
        try {
            const res = await searchMembers(val)
            setResults(res)
        } finally {
            setLoading(false)
        }
    }

    if (value) {
        return (
            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded px-2 h-8 text-sm min-w-[120px]">
                <Users className="w-3 h-3 text-emerald-400" />
                <span className="truncate max-w-[100px]">{value.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto hover:text-red-400" onClick={() => onSelect(undefined)}>
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div role="combobox" aria-expanded={open} className={`flex items-center justify-between h-8 w-full min-w-[120px] rounded-md border bg-slate-950 px-3 py-1 text-xs shadow-sm cursor-pointer ${required ? 'border-red-500/50 text-red-200' : 'border-white/10 text-slate-400'}`}>
                    {required ? "Asignar (Req)" : "Asignar Usuario"}
                </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 bg-slate-950 border-white/10 w-[200px]" side="bottom" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Buscar nombre..."
                        value={term}
                        onValueChange={handleSearch}
                        className="h-9 text-xs"
                    />
                    <CommandList>
                        {loading && <div className="p-2 text-xs text-center text-slate-500"><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Buscando...</div>}
                        {!loading && term.length > 0 && results.length === 0 && (
                            <div className="py-6 text-center text-xs text-slate-500">No encontrado.</div>
                        )}
                        {!loading && term.length < 2 && (
                            <div className="py-2 text-center text-[10px] text-slate-500">Ingresa 2 letras...</div>
                        )}
                        <CommandGroup>
                            {results.map((u) => (
                                <CommandItem
                                    key={u.id}
                                    value={u.id} // Not used for filtering, just unique
                                    onSelect={() => {
                                        onSelect({ id: u.id, name: u.name })
                                        setOpen(false)
                                    }}
                                    className="text-xs hover:bg-white/10 cursor-pointer"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold">{u.name}</span>
                                        <span className="text-[10px] text-slate-400 capitalize">{u.type?.toLowerCase().replace('_', ' ')}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

interface CloseSessionDialogProps {
    sessionId: string
    tableName: string
    preview: { total: number, timeCost: number, consumptionTotal: number }
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CloseSessionDialog({ sessionId, tableName, preview, isOpen, onClose, onSuccess }: CloseSessionDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [paymentMode, setPaymentMode] = useState<"single" | "split">("single")

    // Split Payments State
    const [payments, setPayments] = useState<{ amount: number, method: string, userId?: string, userName?: string }[]>([])

    // Initialize default single payment
    useEffect(() => {
        if (isOpen && preview) {
            setPayments([{ amount: preview.total, method: "CASH" }])
            setPaymentMode("single")
        }
    }, [isOpen, preview])

    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const remaining = preview ? (preview.total - totalPaid) : 0

    const addPayment = () => {
        if (remaining > 0) {
            setPayments([...payments, { amount: remaining, method: "CASH" }])
        } else {
            setPayments([...payments, { amount: 0, method: "CASH" }])
        }
    }

    const removePayment = (index: number) => {
        const newPayments = [...payments]
        newPayments.splice(index, 1)
        setPayments(newPayments)
    }

    const updatePayment = (index: number, field: string, value: any) => {
        const newPayments = [...payments]
        newPayments[index] = { ...newPayments[index], [field]: value }

        // Clear user if method changes and it's not ACCOUNT? No, keep it.
        // But if method is ACCOUNT, user is required.
        setPayments(newPayments)
    }

    const updateUser = (index: number, user: { id: string, name: string } | undefined) => {
        const newPayments = [...payments]
        newPayments[index] = {
            ...newPayments[index],
            userId: user?.id,
            userName: user?.name
        }
        setPayments(newPayments)
    }

    async function handleConfirm() {
        if (remaining !== 0 && Math.abs(remaining) > 50) { // Tolerance
            toast.error(`El total pagado no coincide. Faltan $${remaining}`)
            return
        }

        // Validate Account Payments
        const invalidAccount = payments.some(p => p.method === 'ACCOUNT' && !p.userId);
        if (invalidAccount) {
            toast.error("Pagos con 'Fiado' requieren asignar un usuario");
            return;
        }

        setIsSubmitting(true)
        try {
            const result = await endSession(sessionId, payments)
            if (result.success) {
                toast.success("Mesa cerrada correctamente", {
                    description: `Total: $${result.total}`
                })
                onSuccess()
            } else {
                toast.error(result.error || "Error al cerrar mesa")
            }
        } catch (error) {
            toast.error("Error inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!preview) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-slate-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Cerrar Mesa: {tableName}</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Summary */}
                    <div className="bg-white/5 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Tiempo</span>
                            <span>${preview.timeCost}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Consumo</span>
                            <span>${preview.consumptionTotal}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-emerald-400 pt-2 border-t border-white/10">
                            <span>Total a Pagar</span>
                            <span>${preview.total}</span>
                        </div>
                    </div>

                    <Tabs value={paymentMode} onValueChange={(v) => {
                        setPaymentMode(v as any)
                        // Reset payments on switch to ensure consistency
                        if (v === 'single') setPayments([{ amount: preview.total, method: "CASH" }])
                    }} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/10">
                            <TabsTrigger value="single">Pago Único</TabsTrigger>
                            <TabsTrigger value="split">Dividir Cuenta</TabsTrigger>
                        </TabsList>

                        <TabsContent value="single" className="space-y-4 mt-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-slate-400">Método de Pago</label>
                                <Select
                                    value={payments[0]?.method}
                                    onValueChange={(v) => updatePayment(0, 'method', v)}
                                >
                                    <SelectTrigger className="bg-slate-900 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Efectivo</SelectItem>
                                        <SelectItem value="CARD">Tarjeta (Débito/Crédito)</SelectItem>
                                        <SelectItem value="TRANSFER">Transferencia</SelectItem>
                                        <SelectItem value="ACCOUNT">Fiado (Cta. Cte.)</SelectItem>
                                    </SelectContent>
                                </Select>

                                <label className="text-sm text-slate-400 mt-2">
                                    Asignar a Usuario {payments[0]?.method === 'ACCOUNT' && <span className="text-red-500">*</span>}
                                </label>
                                <PaymentUserSelect
                                    value={payments[0]?.userId ? { id: payments[0].userId, name: payments[0].userName || '' } : undefined}
                                    onSelect={(u) => updateUser(0, u)}
                                    required={payments[0]?.method === 'ACCOUNT'}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="split" className="space-y-4 mt-4">
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {payments.map((p, idx) => (
                                    <div key={idx} className="flex flex-wrap items-center gap-2 bg-white/5 p-2 rounded border border-white/5">
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                value={p.amount}
                                                onChange={(e) => updatePayment(idx, 'amount', Number(e.target.value))}
                                                className="bg-slate-900 border-white/10 h-8 font-mono"
                                            />
                                        </div>
                                        <Select
                                            value={p.method}
                                            onValueChange={(v) => updatePayment(idx, 'method', v)}
                                        >
                                            <SelectTrigger className="bg-slate-900 border-white/10 h-8 w-[110px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">Efectivo</SelectItem>
                                                <SelectItem value="CARD">Tarjeta</SelectItem>
                                                <SelectItem value="TRANSFER">Transf.</SelectItem>
                                                <SelectItem value="ACCOUNT">Fiado</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="flex-1 min-w-[120px]">
                                            <PaymentUserSelect
                                                value={p.userId ? { id: p.userId, name: p.userName || '' } : undefined}
                                                onSelect={(u) => updateUser(idx, u)}
                                                required={p.method === 'ACCOUNT'}
                                            />
                                        </div>

                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => removePayment(idx)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={addPayment} className="w-full border-dashed border-white/20 hover:border-emerald-500 hover:text-emerald-500">
                                <Plus className="w-4 h-4 mr-2" /> Agregar Pago
                            </Button>

                            <div className="flex justify-between items-center bg-black/40 p-2 rounded text-sm mb-2">
                                <span className={remaining !== 0 ? "text-amber-500" : "text-emerald-500"}>
                                    Faltante: ${remaining}
                                </span>
                                <span className="text-slate-500">
                                    Pagado: ${totalPaid} / ${preview.total}
                                </span>
                            </div>
                        </TabsContent>
                    </Tabs>

                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting || Math.abs(remaining) > 50}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <DollarSign className="mr-2 h-4 w-4" />}
                        Finalizar Cobro
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
