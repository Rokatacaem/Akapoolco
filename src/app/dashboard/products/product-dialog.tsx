"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createProduct, updateProduct } from "@/app/lib/actions-products"
import { toast } from "sonner"
import { Product } from "@prisma/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    productToEdit?: Product | null
}

const CATEGORIES = ["Bebidas", "Licores", "Cervezas", "Cocina", "Snacks", "Otros"]

export function ProductDialog({ open, onOpenChange, productToEdit }: ProductDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        category: "Bebidas",
        priceMember: 0,
        priceClient: 0,
        stockControl: false,
        stock: 0
    })

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name,
                category: productToEdit.category || "Otros",
                priceMember: Number(productToEdit.priceMember),
                priceClient: Number(productToEdit.priceClient),
                stockControl: productToEdit.stockControl,
                stock: productToEdit.stock
            })
        } else {
            setFormData({
                name: "",
                category: "Bebidas",
                priceMember: 0,
                priceClient: 0,
                stockControl: false,
                stock: 0
            })
        }
    }, [productToEdit, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            if (productToEdit) {
                const result = await updateProduct(productToEdit.id, {
                    ...formData,
                    stockControl: formData.stockControl // We don't update 'stock' directly here, only control flag. Stock is via adjustments usually, but let's allow basic edits? No, strict stock usually.
                    // But if toggling stockControl ON, we might want to set initial.
                    // Implementation Plan said: "Product creation/update with stock_control".
                })
                if (result.error) throw new Error(result.error)
                toast.success("Producto actualizado exitosamente")
            } else {
                const result = await createProduct(formData)
                if (result.error) throw new Error(result.error)
                toast.success("Producto creado exitosamente")
            }
            onOpenChange(false)
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
                    <DialogTitle>{productToEdit ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="bg-black/20 border-white/10"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(val) => setFormData({ ...formData, category: val })}
                        >
                            <SelectTrigger className="bg-black/20 border-white/10">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="priceMember">Precio Socio</Label>
                            <Input
                                id="priceMember"
                                type="number"
                                value={formData.priceMember}
                                onChange={e => setFormData({ ...formData, priceMember: Number(e.target.value) })}
                                className="bg-black/20 border-white/10"
                                min={0}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="priceClient">Precio Cliente</Label>
                            <Input
                                id="priceClient"
                                type="number"
                                value={formData.priceClient}
                                onChange={e => setFormData({ ...formData, priceClient: Number(e.target.value) })}
                                className="bg-black/20 border-white/10"
                                min={0}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-white/10 p-3 bg-white/5">
                        <div className="space-y-0.5">
                            <Label className="text-base">Control de Stock</Label>
                            <div className="text-sm text-muted-foreground">
                                Habilitar inventario
                            </div>
                        </div>
                        <Switch
                            checked={formData.stockControl}
                            onCheckedChange={(checked) => setFormData({ ...formData, stockControl: checked })}
                        />
                    </div>

                    {((formData.stockControl && !productToEdit) || (formData.stockControl && productToEdit && !productToEdit.stockControl)) && (
                        /* Show initial stock input ONLY if creating NEW product OR enabling stock control for first time */
                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="stock">Stock Inicial</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock}
                                onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                className="bg-black/20 border-white/10"
                                min={0}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                            {isLoading ? "Guardando..." : "Guardar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
