"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { openShift, closeShift, getActiveShiftDetails } from "@/app/lib/actions-shifts"
import { toast } from "sonner"
import { Lock, Unlock, DollarSign, History, CreditCard, Users, Banknote } from "lucide-react"
import { DebtPaymentDialog } from "@/components/shifts/DebtPaymentDialog"
import { MembershipPaymentDialog } from "@/components/shifts/MembershipPaymentDialog"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"

interface ShiftSummary {
    total: number
    cash: number
    card: number
    transfer: number
    byType: {
        CONSUMPTION: number
        DEBT_PAYMENT: number
        MEMBERSHIP: number
    }
    salesCount: number
}

interface ShiftData {
    shift: any
    summary: ShiftSummary
}

interface ShiftClientProps {
    initialData: ShiftData | null
    userId: string
}

export function ShiftClient({ initialData, userId }: ShiftClientProps) {
    const router = useRouter();
    const [data, setData] = useState<ShiftData | null>(initialData)
    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState<string>("")

    // Dialog States
    const [showDebtDialog, setShowDebtDialog] = useState(false);
    const [showMembershipDialog, setShowMembershipDialog] = useState(false);

    const refreshData = async () => {
        const result = await getActiveShiftDetails();
        if (result) {
            // Re-serialize strictly for state match if needed, but JS handles numbers fine usually from actions
            setData(result as any);
        } else {
            setData(null);
        }
    };

    const handleOpenShift = async () => {
        if (!amount) return toast.error("Ingrese monto inicial")
        setIsLoading(true)
        try {
            const res = await openShift(userId, Number(amount))
            if (res.error) throw new Error(res.error)

            toast.success("Turno abierto exitosamente")
            await refreshData();
            setAmount("")
        } catch (error: any) {
            toast.error(error.message || "Error al abrir turno")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCloseShift = async () => {
        if (!data?.shift) return;
        if (!amount) return toast.error("Ingrese monto final (Arqueo)")
        if (!confirm("¿Está seguro de cerrar el turno?")) return

        setIsLoading(true)
        try {
            const res = await closeShift(data.shift.id, userId, Number(amount))
            if (res.error) throw new Error(res.error)
            toast.success("Turno cerrado exitosamente")
            setData(null)
            setAmount("")
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Error al cerrar turno")
        } finally {
            setIsLoading(false)
        }
    }

    if (data?.shift) {
        const { shift, summary } = data;

        return (
            <div className="space-y-6">
                {/* Active Shift Header & Actions */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {/* Main Control Card */}
                    <Card className="bg-slate-950 border-emerald-900/50 md:col-span-2 lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center text-emerald-400">
                                <Unlock className="w-5 h-5 mr-2" />
                                Turno Activo
                            </CardTitle>
                            <CardDescription>
                                Apertura: {new Date(shift.openedAt).toLocaleString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-white/5">
                                <span className="text-slate-400">Fondo Inicial</span>
                                <span className="text-lg font-mono font-bold text-white">${Number(shift.initialAmount).toLocaleString()}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="p-2 bg-slate-900 rounded">
                                    <div className="text-xs text-slate-500">Efectivo (Ventas)</div>
                                    <div className="font-bold text-green-400">${summary.cash.toLocaleString()}</div>
                                </div>
                                <div className="p-2 bg-slate-900 rounded">
                                    <div className="text-xs text-slate-500">Total (Ventas)</div>
                                    <div className="font-bold text-white">${summary.total.toLocaleString()}</div>
                                </div>
                            </div>

                            <Separator className="bg-white/10" />

                            <div className="space-y-2">
                                <Label>Arqueo de Cierre</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="Efectivo real en caja..."
                                        className="pl-9 bg-black/20 border-white/10"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full bg-red-900 hover:bg-red-800 text-white"
                                onClick={handleCloseShift}
                                disabled={isLoading}
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Cerrar Turno (Z)
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Quick Actions & Breakdown */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-20 flex flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-emerald-500/50"
                                onClick={() => setShowDebtDialog(true)}
                            >
                                <Banknote className="h-6 w-6 text-emerald-400" />
                                <span>Pagar Deuda</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 flex flex-col gap-2 border-white/10 hover:bg-white/5 hover:border-blue-500/50"
                                onClick={() => setShowMembershipDialog(true)}
                            >
                                <Users className="h-6 w-6 text-blue-400" />
                                <span>Renovar Membresía</span>
                            </Button>
                        </div>

                        {/* Breakdown Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Card className="bg-slate-900/50 border-white/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Consumo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${summary.byType.CONSUMPTION.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Barras y Mesas</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900/50 border-white/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Deudas</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-500">${summary.byType.DEBT_PAYMENT.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Pagos de Cta. Cte.</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900/50 border-white/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Membresías</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-500">${summary.byType.MEMBERSHIP.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground">Renovaciones</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Dialogs */}
                <DebtPaymentDialog
                    isOpen={showDebtDialog}
                    onClose={() => setShowDebtDialog(false)}
                    onSuccess={refreshData}
                />
                <MembershipPaymentDialog
                    isOpen={showMembershipDialog}
                    onClose={() => setShowMembershipDialog(false)}
                    onSuccess={refreshData}
                />
            </div>
        )
    }

    // No Active Shift View
    return (
        <div className="max-w-md mx-auto mt-10">
            <Card className="bg-slate-950 border-white/10 shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Lock className="w-5 h-5 mr-2 text-slate-400" />
                        Caja Cerrada
                    </CardTitle>
                    <CardDescription>
                        Debe abrir turno para registrar ventas y movimientos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Fondo Inicial (Sencillo)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="number"
                                placeholder="0"
                                className="pl-9 bg-black/20 border-white/10"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                        onClick={handleOpenShift}
                        disabled={isLoading}
                    >
                        <Unlock className="w-4 h-4 mr-2" />
                        Abrir Turno
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}


