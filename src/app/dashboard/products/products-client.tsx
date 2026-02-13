"use client"

import { useState } from "react"
import { Product, StockMovement } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Plus, Search, Edit, ArrowRightLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProductDialog } from "./product-dialog"
import { StockDialog } from "./stock-dialog"

// Extended Product interface for Client Side (numbers instead of Decimal)
interface ClientProduct extends Omit<Product, 'priceMember' | 'priceClient'> {
    priceMember: number
    priceClient: number
    stockMovements: StockMovement[]
}

interface ProductsClientProps {
    initialProducts: ClientProduct[]
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [products] = useState(initialProducts)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isStockOpen, setIsStockOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<ClientProduct | null>(null)
    const [editingProduct, setEditingProduct] = useState<ClientProduct | null>(null)

    const filteredProducts = initialProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar productos..."
                        className="pl-8 bg-black/20 border-white/10 text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                </Button>
            </div>

            <div className="rounded-md border border-white/10 bg-black/20 backdrop-blur-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-gray-400">Nombre</TableHead>
                            <TableHead className="text-gray-400">Categoría</TableHead>
                            <TableHead className="text-gray-400 text-right">Precio Socio</TableHead>
                            <TableHead className="text-gray-400 text-right">Precio Cliente</TableHead>
                            <TableHead className="text-gray-400 text-center">Stock</TableHead>
                            <TableHead className="text-gray-400 text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                            <TableRow key={product.id} className="border-white/10 hover:bg-white/5">
                                <TableCell className="font-medium text-white">{product.name}</TableCell>
                                <TableCell className="text-gray-300">{product.category || "-"}</TableCell>
                                <TableCell className="text-right text-emerald-400 font-mono">
                                    ${product.priceMember.toLocaleString('es-CL')}
                                </TableCell>
                                <TableCell className="text-right text-blue-400 font-mono">
                                    ${product.priceClient.toLocaleString('es-CL')}
                                </TableCell>
                                <TableCell className="text-center">
                                    {product.stockControl ? (
                                        <Badge
                                            variant={product.stock < 10 ? "destructive" : "secondary"}
                                            className={product.stock < 10 ? "bg-red-900/50 text-red-200" : "bg-emerald-900/30 text-emerald-200"}
                                        >
                                            {product.stock}
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    {product.stockControl && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                                            title="Ajuste de Stock"
                                            onClick={() => {
                                                setSelectedProduct(product)
                                                setIsStockOpen(true)
                                            }}
                                        >
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                        title="Editar"
                                        onClick={() => {
                                            setEditingProduct(product)
                                            setIsCreateOpen(true)
                                        }}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ProductDialog
                open={isCreateOpen}
                onOpenChange={(open) => {
                    setIsCreateOpen(open)
                    if (!open) setEditingProduct(null)
                }}
                productToEdit={editingProduct as unknown as Product}
            />

            {selectedProduct && (
                <StockDialog
                    open={isStockOpen}
                    onOpenChange={(open) => {
                        setIsStockOpen(open)
                        if (!open) setSelectedProduct(null)
                    }}
                    product={selectedProduct as unknown as Product}
                />
            )}
        </div>
    )
}
