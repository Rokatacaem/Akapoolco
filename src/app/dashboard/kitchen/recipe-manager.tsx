'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Trash, Calculator, Search } from "lucide-react"
import { getProducts, getRecipeIngredients, addIngredientToRecipe, removeIngredientFromRecipe } from "@/app/lib/actions-kitchen"

interface Product {
    id: string
    name: string
}

interface Ingredient {
    id: string
    name: string
    unit: string
    cost: number
    lossPercentage: number
}

interface RecipeItem {
    id: string
    ingredient: Ingredient
    quantity: number // This is the GROSS quantity stored in DB
}

interface Props {
    ingredients: Ingredient[]
}

export function RecipeManager({ ingredients }: Props) {
    const [products, setProducts] = useState<Product[]>([])
    const [selectedProductId, setSelectedProductId] = useState<string>("")
    const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([])
    const [loading, setLoading] = useState(false)

    // Form for Adding Ingredient
    const [selectedIngredientId, setSelectedIngredientId] = useState<string>("")
    const [netQuantity, setNetQuantity] = useState<string>("")
    // calculatedGross is now derived
    const [searchTerm, setSearchTerm] = useState("")

    async function loadProducts() {
        const res = await getProducts()
        setProducts(res)
    }

    async function loadRecipe(id: string) {
        setLoading(true)
        const res = await getRecipeIngredients(id) as unknown as RecipeItem[]
        setRecipeItems(res || [])
        setLoading(false)
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadProducts()
    }, [])

    useEffect(() => {
        if (selectedProductId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadRecipe(selectedProductId)
        } else {
            setRecipeItems([])
        }
    }, [selectedProductId])

    // Derived calculation
    const selectedIngredient = ingredients.find(i => i.id === selectedIngredientId)
    const currentProduct = products.find(p => p.id === selectedProductId)
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

    let calculatedGross = 0
    if (selectedIngredientId && netQuantity && !isNaN(parseFloat(netQuantity))) {
        const net = parseFloat(netQuantity)
        const ingredient = ingredients.find(i => i.id === selectedIngredientId)
        if (ingredient) {
            const lossFactor = 1 - (Number(ingredient.lossPercentage) / 100)
            if (lossFactor <= 0) {
                calculatedGross = net
            } else {
                calculatedGross = net / lossFactor
            }
        }
    }



    async function handleAddIngredient() {
        if (!selectedProductId || !selectedIngredientId || !calculatedGross) return

        const res = await addIngredientToRecipe(selectedProductId, selectedIngredientId, calculatedGross)

        if (res.success) {
            toast.success("Ingrediente agregado a la receta")
            loadRecipe(selectedProductId)
            setNetQuantity("")

            // Do not clear ingredient to allow rapid entry if needed, or clear it if preferred
            // setCalculatedGross(0) // Logic effect will handle this
        } else {
            toast.error("Error al agregar ingrediente")
        }
    }

    async function handleRemoveIngredient(recipeId: string) {
        // if (!confirm("¿Estás seguro de quitar este ingrediente?")) return

        const res = await removeIngredientFromRecipe(recipeId)
        if (res.success) {
            toast.success("Ingrediente removido")
            loadRecipe(selectedProductId)
        } else {
            toast.error("Error al remover ingrediente")
        }
    }


    // Total Cost Calculation
    const totalRecipeCost = recipeItems.reduce((acc, item) => {
        const qty = Number(item.quantity)
        const cost = Number(item.ingredient.cost)
        return acc + (qty * cost)
    }, 0)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Product Selection */}
            <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>1. Seleccionar Producto</CardTitle>
                    <CardDescription>Elige el plato o trago a configurar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filtrar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <div className="border rounded-md h-[400px] overflow-y-auto">
                        {filteredProducts.map(p => (
                            <div
                                key={p.id}
                                className={`p-3 cursor-pointer hover:bg-muted transition-colors border-b last:border-0 ${selectedProductId === p.id ? 'bg-primary/20 border-l-4 border-l-primary' : ''}`}
                                onClick={() => setSelectedProductId(p.id)}
                            >
                                <p className="font-medium text-sm">{p.name}</p>
                            </div>
                        ))}
                        {filteredProducts.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground text-sm">No se encontraron productos</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Right Col: Recipe Editor */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>2. Composición de la Receta</CardTitle>
                    <CardDescription>
                        {selectedProductId
                            ? `Editando receta para: ${currentProduct?.name}`
                            : "Selecciona un producto del listado para comenzar"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedProductId ? (
                        <div className="space-y-6">
                            {/* Add Ingredient Form */}
                            <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                                <h4 className="font-semibold flex items-center gap-2 text-sm text-foreground/80">
                                    <Calculator className="w-4 h-4" /> Calculadora de Insumos
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Ingrediente</Label>
                                        <Select value={selectedIngredientId} onValueChange={setSelectedIngredientId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar insumo..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {ingredients.map(i => (
                                                    <SelectItem key={i.id} value={i.id}>
                                                        {i.name} ({i.unit})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedIngredient && (
                                            <p className="text-xs text-muted-foreground">
                                                Costo: ${selectedIngredient.cost}/{selectedIngredient.unit} | Merma: <span className="text-orange-500 font-bold">{Number(selectedIngredient.lossPercentage)}%</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cantidad Neta (Lo que va en el plato)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Ej: 100"
                                                value={netQuantity}
                                                onChange={e => setNetQuantity(e.target.value)}
                                            />
                                            <span className="text-sm text-muted-foreground w-12 font-mono">
                                                {selectedIngredient?.unit || "---"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedIngredient && calculatedGross > 0 && (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-background p-3 rounded border border-border mt-2 gap-4">

                                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Cantidad Bruta:</span>
                                                <p className="text-lg font-bold text-primary">
                                                    {calculatedGross.toFixed(3)} {selectedIngredient.unit}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Costo Estimado:</span>
                                                <p className="font-mono font-medium">
                                                    ${(calculatedGross * Number(selectedIngredient.cost)).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                        </div>

                                        <Button size="sm" onClick={handleAddIngredient} disabled={calculatedGross <= 0}>
                                            <Plus className="w-4 h-4 mr-2" /> Agregar a Receta
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Recipe Table */}
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ingrediente</TableHead>
                                            <TableHead className="text-right">Cant. Bruta</TableHead>
                                            <TableHead>Unidad</TableHead>
                                            <TableHead className="text-right">Costo Est.</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recipeItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.ingredient.name}</TableCell>
                                                <TableCell className="text-right font-mono">{Number(item.quantity).toFixed(3)}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">{item.ingredient.unit}</TableCell>
                                                <TableCell className="text-right">
                                                    ${(Number(item.quantity) * Number(item.ingredient.cost)).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredient(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                        <Trash className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {recipeItems.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8 h-32">
                                                    No hay ingredientes configurados.
                                                </TableCell>
                                            </TableRow>
                                        )}

                                    </TableBody>
                                </Table>
                                {recipeItems.length > 0 && (
                                    <div className="p-4 bg-muted/50 border-t flex justify-between items-center">
                                        <span className="font-bold">Costo Total Receta</span>
                                        <span className="text-xl font-bold text-primary">
                                            ${totalRecipeCost.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground border-2 border-dashed rounded-lg">
                            <Search className="w-12 h-12 mb-4 opacity-20" />
                            <p>Selecciona un producto de la lista izquierda</p>
                            <p>para gestionar su receta.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
