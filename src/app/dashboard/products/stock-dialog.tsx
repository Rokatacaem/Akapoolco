"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adjustStock } from "@/app/lib/actions-products"
import { toast } from "sonner"
import { Product } from "@prisma/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"

interface StockDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product: Product
}

export function StockDialog({ open, onOpenChange, product }: StockDialogProps) {
    const { data: session } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [type, setType] = useState<"PURCHASE" | "ADJUSTMENT" | "RETURN">("PURCHASE")
    const [quantity, setQuantity] = useState(0)
    const [reason, setReason] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session?.user?.id) {
            toast.error("Usuario no identificado")
            return
        }
        setIsLoading(true)

        try {
            // Logic for quantity direction
            // PURCHASE: +
            // RETURN: +
            // ADJUSTMENT: User enters signed value? Or we provide UI for Add/Remove?
            // Let's assume user enters absolute quantity and selects Add/Remove for Adjustment, OR just enters signed.
            // For simplicity, let's treat PURCHASE/RETURN as additions.
            // For ADJUSTMENT, let's trust the input (can be negative).

            // Wait, UI for "Ajuste" usually implies correction.
            // Let's make it simpler:
            // Type PURCHASE -> Add
            // Type RETURN -> Add
            // Type ADJUSTMENT -> Add (if positive) or Remove (if negative in input)

            // Actually, best to strictly follow "Movement Type".
            // PURCHASE is always (+).
            // RETURN is always (+).
            // ADJUSTMENT could be (+/-).

            const finalQty = quantity // Assuming user types negative for negative adjustment

            const result = await adjustStock(
                product.id,
                finalQty,
                type,
                reason,
                session.user.id
            )

            if (result.error) throw new Error(result.error)
            toast.success("Movimiento registrado")
            onOpenChange(false)
            setQuantity(0)
            setReason("")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-950 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Movimiento de Stock: {product.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Tipo de Movimiento</Label>
                        <Select
                            value={type}
                            onValueChange={(val: any) => setType(val)}
                        >
                            <SelectTrigger className="bg-black/20 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="PURCHASE">Compra (Ingreso)</SelectItem>
                                <SelectItem value="RETURN">Devolución (Reingreso)</SelectItem>
                                <SelectItem value="ADJUSTMENT">Ajuste (Manual)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="quantity">
                            Cantidad
                            {type === 'ADJUSTMENT' && <span className="text-xs text-muted-foreground ml-2">(Usar negativo para restar)</span>}
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                            className="bg-black/20 border-white/10"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reason">Razón / Comentario</Label>
                        <Input
                            id="reason"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="bg-black/20 border-white/10"
                            placeholder="Ej. Factura 123, Contéo mensual..."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                            {isLoading ? "Procesando..." : "Confirmar Movimiento"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
