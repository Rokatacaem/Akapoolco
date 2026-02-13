/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Search, Plus, Minus, Loader2 } from "lucide-react"
import { getProductsWithStock } from "@/app/lib/actions-products"
import { addSessionConsumption } from "@/app/lib/actions-sessions"
import { addOrderToPlayer } from "@/app/lib/actions-card-tables"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddConsumptionDialogProps {
    sessionId: string
    players: any[]
    isCardTable?: boolean
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function AddConsumptionDialog({ sessionId, players, isCardTable, isOpen, onClose, onSuccess }: AddConsumptionDialogProps) {
    const [products, setProducts] = useState<any[]>([])
    const [filteredProducts, setFilteredProducts] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [cart, setCart] = useState<{ [id: string]: number }>({})
    const [loading, setLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [targetUser, setTargetUser] = useState<string>("TABLE") // "TABLE" or userId

    useEffect(() => {
        if (isOpen) {
            loadProducts()
            setCart({})
            setSearch("")
            setTargetUser("TABLE")
        }
    }, [isOpen])

    // ... (useEffect for search remains same)

    useEffect(() => {
        if (!search) {
            setFilteredProducts(products)
        } else {
            const lower = search.toLowerCase()
            setFilteredProducts(products.filter(p => p.name.toLowerCase().includes(lower)))
        }
    }, [search, products])

    async function loadProducts() {
        setLoading(true)
        try {
            const data = await getProductsWithStock()
            // Only show products with stock if stockControl is true, or all if false/stock>0
            setProducts(data.filter(p => !p.stockControl || p.stock > 0))
            setFilteredProducts(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const addToCart = (product: any) => {
        const current = cart[product.id] || 0
        if (product.stockControl && current >= product.stock) {
            toast.error("No hay suficiente stock")
            return
        }
        setCart(prev => ({ ...prev, [product.id]: current + 1 }))
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const current = prev[productId] || 0
            if (current <= 1) {
                const copy = { ...prev }
                delete copy[productId]
                return copy
            }
            return { ...prev, [productId]: current - 1 }
        })
    }

    // Filter valid players for selection
    // For Card Tables: Any player in session (needs sessionPlayerId)
    // For Pool Tables: Allow all (Members get charged to account, Guests get tagged in Table Order)
    const validPlayers = players;

    async function handleSubmit() {
        setIsSubmitting(true)
        try {
            const selectedPlayer = targetUser !== "TABLE" ? players.find(p => p.id === targetUser) : null;

            const items = Object.entries(cart).map(([id, quantity]) => {
                const product = products.find(p => p.id === id)
                return {
                    productId: id,
                    name: product.name,
                    price: Number(product.priceClient), // Use client price for consumption usually
                    quantity,
                    // Tag with player name if specific player selected but not charging account
                    orderedBy: selectedPlayer ? (selectedPlayer.name || selectedPlayer.guestName) : undefined
                }
            })

            let result;
            if (targetUser === "TABLE") {
                // Add to Table Orders
                result = await addSessionConsumption(sessionId, items, undefined);
            } else {
                // Target User is selected
                if (isCardTable) {
                    // Card Table: Charge to Session Player (Target is sessionPlayerId)
                    result = await addOrderToPlayer(sessionId, targetUser, items);
                } else {
                    // Pool Table: 
                    // If Member -> Charge Account (Debt)
                    // If Guest -> Add to Table Order but tagged
                    const memberId = selectedPlayer?.memberId || selectedPlayer?.userId;

                    if (memberId) {
                        // Charge Member Account
                        result = await addSessionConsumption(sessionId, items, memberId);
                    } else {
                        // Guest: Add to Table Orders (items already have orderedBy)
                        result = await addSessionConsumption(sessionId, items, undefined);
                    }
                }
            }

            if (result.success) {
                toast.success(targetUser !== "TABLE" ? "Cargado a cuenta personal" : "Agregado a la mesa")
                onSuccess()
                onClose()
            } else {
                toast.error(result.error || "Error al agregar consumo")
            }
        } catch (error) {
            toast.error("Error inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
        const product = products.find(p => p.id === id)
        return sum + (Number(product?.priceClient || 0) * qty)
    }, 0)

    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col pt-0 px-0 pb-0 bg-slate-950 border-white/10 text-white">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-black/20">
                    <DialogTitle className="flex justify-between items-center text-xl">
                        <span>Agregar Consumo</span>
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500 text-base px-3">
                            Total: ${cartTotal.toLocaleString()}
                        </Badge>
                    </DialogTitle>

                    <div className="flex gap-3 pt-4">
                        <div className="w-1/3">
                            <Select value={targetUser} onValueChange={setTargetUser}>
                                <SelectTrigger className="bg-slate-900 border-white/10">
                                    <SelectValue placeholder="Cargar a..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-white">
                                    <SelectItem value="TABLE">Mesa (General)</SelectItem>
                                    {validPlayers.map((p, i) => (
                                        <SelectItem key={p.id || i} value={p.id}>
                                            {p.name || p.guestName || "Jugador"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar productos..."
                                className="bg-slate-900 border-white/10 pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-full flex justify-center py-10">
                            <Loader2 className="animate-spin h-8 w-8 text-slate-500" />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center text-slate-500 py-10">
                            No se encontraron productos
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-xs text-slate-400">${Number(product.priceClient).toLocaleString()}</span>
                                    {product.stockControl && (
                                        <span className="text-[10px] text-slate-500">Stock: {product.stock}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {cart[product.id] ? (
                                        <div className="flex items-center gap-2 bg-black/40 rounded-full p-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={() => removeFromCart(product.id)}>
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-sm font-bold w-4 text-center">{cart[product.id]}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-white/10" onClick={() => addToCart(product)}>
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" variant="outline" className="h-8 border-dashed border-white/20 hover:border-amber-500 hover:text-amber-500" onClick={() => addToCart(product)}>
                                            <Plus className="h-4 w-4 mr-1" /> Agregar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="p-4 border-t border-white/5 bg-black/20">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={cartCount === 0 || isSubmitting}
                        className="bg-amber-600 hover:bg-amber-700 text-white min-w-[150px]"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                        Confirmar ({cartCount})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
