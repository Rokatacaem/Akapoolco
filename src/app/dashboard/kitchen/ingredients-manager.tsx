'use client'

import { RecipeManager } from "./recipe-manager"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createIngredient } from "@/app/lib/actions-kitchen"
import { toast } from "sonner"
import { Plus, Search } from "lucide-react"

interface Ingredient {
    id: string
    name: string
    unit: string
    cost: number
    lossPercentage: number
    currentStock: number
}

interface Props {
    initialIngredients: Ingredient[]
}

export function IngredientsManager({ initialIngredients }: Props) {
    // const [ingredients, setIngredients] = useState(initialIngredients) // Unused
    const [searchTerm, setSearchTerm] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Form Stats
    const [mounted, setMounted] = useState(false)
    const [newName, setNewName] = useState("")
    const [newUnit, setNewUnit] = useState("un")
    const [newCost, setNewCost] = useState("")
    const [newStock, setNewStock] = useState("")
    const [newLoss, setNewLoss] = useState("0")

    useEffect(() => {
        setMounted(true)
    }, [])

    const filteredIngredients = initialIngredients.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    async function handleCreate() {
        if (!newName || !newCost || !newStock) return

        const res = await createIngredient({
            name: newName,
            unit: newUnit,
            cost: parseFloat(newCost),
            stock: parseFloat(newStock),
            lossPercentage: parseFloat(newLoss)
        })

        if (res.success) {
            toast.success("Ingrediente creado correctamente")
            setIsCreateOpen(false)
            setNewName("")
            setNewCost("")
            setNewStock("")
            // Router refresh handles the update, but we could accept new list if action returned it
        } else {
            toast.error("Error al crear ingrediente")
        }
    }

    if (!mounted) return null

    return (
        <Tabs defaultValue="stock" className="space-y-4">
            <TabsList>
                <TabsTrigger value="stock">Stock de Ingredientes</TabsTrigger>
                <TabsTrigger value="recipes">Recetas y Escandallos</TabsTrigger>
            </TabsList>

            <TabsContent value="stock" className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar ingrediente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-[300px]"
                            />
                        </div>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Ingrediente</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo Ingrediente</DialogTitle>
                                <DialogDescription>
                                    Añade un insumo para el control de stock de cocina.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Nombre</Label>
                                    <Input value={newName} onChange={e => setNewName(e.target.value)} className="col-span-3" placeholder="Ej: Pan Frica" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Unidad</Label>
                                    <Input value={newUnit} onChange={e => setNewUnit(e.target.value)} className="col-span-3" placeholder="un, kg, lt" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Costo Unit.</Label>
                                    <Input type="number" value={newCost} onChange={e => setNewCost(e.target.value)} className="col-span-3" placeholder="0" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Stock Inicial</Label>
                                    <Input type="number" value={newStock} onChange={e => setNewStock(e.target.value)} className="col-span-3" placeholder="0" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Merma (%)</Label>
                                    <Input type="number" value={newLoss} onChange={e => setNewLoss(e.target.value)} className="col-span-3" placeholder="0" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate}>Guardar Ingrediente</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Inventario Actual</CardTitle>
                        <CardDescription>Gestión de insumos de cocina.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Unidad</TableHead>
                                    <TableHead>Costo Unit.</TableHead>
                                    <TableHead>Merma (%)</TableHead>
                                    <TableHead>Stock Actual</TableHead>
                                    <TableHead className="text-right">Valor Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredIngredients.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell>${item.cost.toLocaleString()}</TableCell>
                                        <TableCell>{Number(item.lossPercentage)}%</TableCell>
                                        <TableCell>{item.currentStock}</TableCell>
                                        <TableCell className="text-right">
                                            ${(item.cost * item.currentStock).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="recipes">
                <RecipeManager ingredients={initialIngredients} />
            </TabsContent>
        </Tabs>
    )
}
