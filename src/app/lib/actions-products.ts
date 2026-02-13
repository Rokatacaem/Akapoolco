/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { StockMovementType } from "@prisma/client"

export async function createProduct(data: {
    name: string
    category: string
    priceMember: number
    priceClient: number
    stockControl: boolean
    stock?: number
    image?: string
}) {
    try {
        const product = await prisma.product.create({
            data: {
                name: data.name,
                category: data.category,
                priceMember: data.priceMember,
                priceClient: data.priceClient,
                stockControl: data.stockControl,
                stock: data.stock || 0,
                image: data.image
            }
        })

        // Initial Stock Movement if stock > 0
        if (data.stock && data.stock > 0) {
            await prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    type: "PURCHASE", // Initial stock treated as purchase
                    quantity: data.stock,
                    reason: "Initial Stock"
                }
            })
        }

        revalidatePath('/dashboard/products')
        return { success: true, product }
    } catch (error) {
        console.error("Failed to create product:", error)
        return { error: "Error al crear producto" }
    }
}

export async function updateProduct(id: string, data: {
    name?: string
    category?: string
    priceMember?: number
    priceClient?: number
    stockControl?: boolean
    image?: string
}) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data
        })

        revalidatePath('/dashboard/products')
        return { success: true, product }
    } catch (error) {
        console.error("Failed to update product:", error)
        return { error: "Error al actualizar producto" }
    }
}

export async function adjustStock(
    productId: string,
    quantity: number,
    type: StockMovementType,
    reason: string,
    userId: string
) {
    try {
        // Create Movement
        await prisma.stockMovement.create({
            data: {
                productId,
                type,
                quantity,
                reason,
                userId
            }
        })

        // Update Product Stock
        let updateOperation: any = {}

        // Logic: PURCHASE/RETURN adds stock. ADJUSTMENT could be + or - (quantity signed?)
        // Assuming quantity is always positive in input, but type determines direction?
        // Let's standardized: 
        // PURCHASE (+), RETURN (+), ADJUSTMENT (Signed in input or implied?)
        // Usually Adjustment can be positive (found item) or negative (lost/shrinkage).
        // Let's assume the user passes a SIGNED quantity for adjustments, or we handle it by type.
        // But for strict Movement logs, we usually store positive quantity and type.
        // Let's stick to: quantity is change amount.

        // Actually, for PURCHASE (+), RETURN (+)
        // For ADJUSTMENT, it depends.
        // Let's simply trust the signed quantity passed to `increment`.
        // If type is PURCHASE/RETURN, make sure quantity is positive.

        const change = quantity // Should be signed for Adjustment if negative

        await prisma.product.update({
            where: { id: productId },
            data: {
                stock: { increment: change }
            }
        })

        revalidatePath('/dashboard/products')
        revalidatePath('/dashboard/inventory')
        return { success: true }
    } catch (error) {
        console.error("Failed to adjust stock:", error)
        return { error: "Error al ajustar stock" }
    }
}

export async function getProductsWithStock() {
    return await prisma.product.findMany({
        orderBy: { name: 'asc' },
        include: {
            stockMovements: {
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    })
}

export async function searchProducts(term: string) {
    if (!term) return [];
    return await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { category: { contains: term, mode: 'insensitive' } }
            ]
        },
        take: 10,
        select: {
            id: true,
            name: true,
            priceClient: true,
            stock: true,
            stockControl: true
        }
    });
}
