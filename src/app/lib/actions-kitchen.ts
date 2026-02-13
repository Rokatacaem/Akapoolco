'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// --- INGREDIENTS ---

export async function getIngredients() {
    try {
        const ingredients = await prisma.ingredient.findMany({
            orderBy: { name: 'asc' }
        })
        return ingredients
    } catch (error) {
        console.error("Error fetching ingredients:", error)
        return []
    }
}

export async function createIngredient(data: { name: string; unit: string; cost: number; stock: number; lossPercentage?: number }) {
    try {
        await prisma.ingredient.create({
            data: {
                name: data.name,
                unit: data.unit,
                cost: data.cost,
                currentStock: data.stock,
                lossPercentage: data.lossPercentage || 0
            }
        })
        revalidatePath('/dashboard/kitchen')
        return { success: true }
    } catch (error) {
        console.error("Error creating ingredient:", error)
        return { success: false, error: "Failed to create ingredient" }
    }
}

export async function updateIngredientStock(id: string, newStock: number) {
    try {
        await prisma.ingredient.update({
            where: { id },
            data: { currentStock: newStock }
        })
        revalidatePath('/dashboard/kitchen')
        return { success: true }
    } catch (error) {
        console.error("Error updating stock:", error)
        return { success: false, error: "Failed to update stock" }
    }
}

// --- RECIPES ---

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: 'asc' }
        })
        return products
    } catch (error) {
        console.error("Error fetching products:", error)
        return []
    }
}

export async function getRecipeIngredients(productId: string) {
    try {
        const recipeIngredients = await prisma.recipe.findMany({
            where: { productId },
            include: {
                ingredient: true
            }
        })
        return recipeIngredients
    } catch (error) {
        console.error("Error fetching recipe ingredients:", error)
        return []
    }
}

export async function addIngredientToRecipe(productId: string, ingredientId: string, quantity: number) {
    try {
        // Upsert allows updating quantity if ingredient already exists in recipe
        await prisma.recipe.upsert({
            where: {
                productId_ingredientId: {
                    productId,
                    ingredientId
                }
            },
            update: {
                quantity
            },
            create: {
                productId,
                ingredientId,
                quantity
            }
        })
        revalidatePath('/dashboard/kitchen')
        return { success: true }
    } catch (error) {
        console.error("Error adding ingredient to recipe:", error)
        return { success: false, error: "Failed to add ingredient to recipe" }
    }
}

export async function removeIngredientFromRecipe(recipeId: string) {
    try {
        await prisma.recipe.delete({ where: { id: recipeId } })
        revalidatePath('/dashboard/kitchen')
        return { success: true }
    } catch (error) {
        console.error("Error removing ingredient from recipe:", error)
        return { success: false, error: "Failed to remove ingredient from recipe" }
    }
}
