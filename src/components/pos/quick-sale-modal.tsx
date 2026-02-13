"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Minus, ShoppingCart, Search } from "lucide-react"
import { useState } from "react"
import { registerSale } from "@/app/lib/actions-pos"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area" // We need to add this component

interface Product {
    id: string
    name: string
    priceClient: number
    category: string | null
}

interface QuickSaleModalProps {
    sessionId: string
    products: Product[]
    tableName: string
}

export function QuickSaleModal({ sessionId, products, tableName }: QuickSaleModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([])
    const [filter, setFilter] = useState("")

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.product.id === product.id)
            if (existing) {
                return prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
            }
            return [...prev, { product, quantity: 1 }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.reduce((acc, item) => {
            if (item.product.id === productId) {
                if (item.quantity > 1) return [...acc, { ...item, quantity: item.quantity - 1 }]
                return acc
            }
            return [...acc, item]
        }, [] as { product: Product, quantity: number }[]))
    }

    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.product.priceClient) * item.quantity), 0)

    const handleCheckout = async () => {
        const itemsSnapshot = cart.map(i => ({
            productId: i.product.id,
            name: i.product.name,
            price: Number(i.product.priceClient),
            quantity: i.quantity
        }))

        await registerSale(sessionId, itemsSnapshot, cartTotal, 'CASH') // Default to CASH for quick add
        setCart([])
        setIsOpen(false)
    }

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-2 border-primary/50 text-primary hover:bg-primary/10">
                    <ShoppingCart className="w-4 h-4 mr-2" /> Quick Add
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Add Items to {tableName}</DialogTitle>
                </DialogHeader>

                <div className="flex gap-4 h-[400px]">
                    {/* Catalog */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                className="pl-8 bg-white/5 border-white/10"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-2 bg-white/5 rounded-md hover:bg-white/10 cursor-pointer" onClick={() => addToCart(product)}>
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">${Number(product.priceClient).toLocaleString()}</p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-6 w-6">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cart */}
                    <div className="w-[280px] bg-white/5 rounded-md p-4 flex flex-col">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" /> Current Order
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {cart.length === 0 && <p className="text-sm text-zinc-500 text-center py-8">Cart is empty</p>}
                            {cart.map(item => (
                                <div key={item.product.id} className="flex justify-between items-center text-sm">
                                    <div className="flex flex-col">
                                        <span>{item.product.name}</span>
                                        <span className="text-xs text-zinc-500">${(Number(item.product.priceClient) * item.quantity).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-black/40 rounded px-1">
                                        <button className="p-1 hover:text-red-400" onClick={() => removeFromCart(item.product.id)}><Minus className="h-3 w-3" /></button>
                                        <span className="w-4 text-center">{item.quantity}</span>
                                        <button className="p-1 hover:text-green-400" onClick={() => addToCart(item.product)}><Plus className="h-3 w-3" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex justify-between font-bold mb-4">
                                <span>Total:</span>
                                <span className="text-green-400">${cartTotal.toLocaleString()}</span>
                            </div>
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                            >
                                Confirm Add
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
