import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('TaCaEmMi0929', 10)

    console.log('Seeding Akapoolco Data...')

    // 1. Admin User
    await prisma.user.upsert({
        where: { email: 'admin@akapoolco.cl' },
        update: { password, systemAccess: true, role: 'SUPERUSER' },
        create: {
            name: 'Admin Akapoolco',
            email: 'admin@akapoolco.cl',
            password,
            systemAccess: true,
            role: 'SUPERUSER',
            type: 'SOCIO'
        }
    })

    // 2. Tables (8 Pool Tables)
    // 4 mesas con 2 cámaras (T1-T4)
    for (let i = 1; i <= 4; i++) {
        await prisma.table.upsert({
            where: { name: `Mesa ${i}` },
            update: { type: 'POOL', cameraTopUrl: `http://cam-top-${i}`, cameraFrontUrl: `http://cam-front-${i}` },
            create: {
                name: `Mesa ${i}`,
                type: 'POOL',
                hourlyRate: 6000,
                cameraTopUrl: `http://cam-top-${i}`,
                cameraFrontUrl: `http://cam-front-${i}`
            }
        })
    }

    // 4 mesas con 1 cámara (T5-T8)
    for (let i = 5; i <= 8; i++) {
        await prisma.table.upsert({
            where: { name: `Mesa ${i}` },
            update: { type: 'POOL', cameraTopUrl: `http://cam-top-${i}` },
            create: {
                name: `Mesa ${i}`,
                type: 'POOL',
                hourlyRate: 5000,
                cameraTopUrl: `http://cam-top-${i}`
            }
        })
    }

    // 3. Arcade Machines - REMOVED (No gestionables en este sistema)
    // await prisma.table.upsert({
    //     where: { name: 'Arcade Street Fighter' },
    //     update: { type: 'ARCADE' },
    //     create: { name: 'Arcade Street Fighter', type: 'ARCADE', hourlyRate: 0 } 
    // })

    // 4. Kitchen Ingredients (Initial Stock)
    const ingredients = [
        { name: 'Pan Frica', unit: 'un', cost: 200, stock: 100 },
        { name: 'Vienesa', unit: 'un', cost: 300, stock: 100 },
        { name: 'Tomate', unit: 'kg', cost: 1500, stock: 10 },
        { name: 'Palta', unit: 'kg', cost: 5000, stock: 5 },
        { name: 'Mayonesa', unit: 'kg', cost: 4000, stock: 5 },
        { name: 'Carne Hamburguesa', unit: 'un', cost: 500, stock: 50 },
        { name: 'Queso', unit: 'kg', cost: 4000, stock: 5 },
        { name: 'Papas Prefritas', unit: 'kg', cost: 1500, stock: 20 },
        { name: 'Aceite', unit: 'lt', cost: 1200, stock: 20 },
        { name: 'Lomo Liso', unit: 'kg', cost: 8000, stock: 10 },
        { name: 'Cebolla', unit: 'kg', cost: 800, stock: 10 },
        { name: 'Reineta', unit: 'kg', cost: 6000, stock: 5 },
        { name: 'Limón', unit: 'kg', cost: 1000, stock: 5 },
    ]

    for (const ing of ingredients) {
        const existing = await prisma.ingredient.findFirst({ where: { name: ing.name } })
        if (!existing) {
            await prisma.ingredient.create({
                data: {
                    name: ing.name,
                    unit: ing.unit,
                    cost: ing.cost,
                    currentStock: ing.stock
                }
            })
        }
    }

    // 5. Kitchen Products (Carta)
    console.log('Seeding Products...')
    const products = [
        {
            name: 'Completo Chileno',
            category: 'Cocina',
            priceClient: 4500,
            priceMember: 4000,
            image: '/images/products/completo-chileno.png',
            printCategory: 'KITCHEN'
        },
        {
            name: 'Hamburguesa de la Casa',
            category: 'Cocina',
            priceClient: 6500,
            priceMember: 5500,
            image: '/images/products/hamburguesa.png',
            printCategory: 'KITCHEN'
        },
        {
            name: 'Chorrillana',
            category: 'Cocina',
            priceClient: 12000,
            priceMember: 10000,
            image: '/images/products/chorrillana.png',
            printCategory: 'KITCHEN'
        },
        {
            name: 'Lomo Saltado',
            category: 'Cocina',
            priceClient: 10000,
            priceMember: 8500,
            image: '/images/products/lomo-saltado.png',
            printCategory: 'KITCHEN'
        },
        {
            name: 'Cebiche de Pescado',
            category: 'Cocina',
            priceClient: 9000,
            priceMember: 7500,
            image: '/images/products/cebiche-pescado.png',
            printCategory: 'KITCHEN'
        },
        {
            name: 'Papas Fritas',
            category: 'Cocina',
            priceClient: 4000,
            priceMember: 3500,
            image: '/images/products/papas-fritas.png',
            printCategory: 'KITCHEN'
        }
    ]

    for (const prod of products) {
        await prisma.product.upsert({
            where: { id: prod.name.toLowerCase().replace(/\s+/g, '-') }, // Simple ID generation for seed
            update: {
                image: prod.image,
                priceClient: prod.priceClient,
                priceMember: prod.priceMember
            },
            create: {
                id: prod.name.toLowerCase().replace(/\s+/g, '-'),
                name: prod.name,
                category: prod.category,
                priceClient: prod.priceClient,
                priceMember: prod.priceMember,
                image: prod.image,
                // @ts-expect-error: field missing in type definition but present in database
                printCategory: prod.printCategory
            }
        })
    }

    console.log('Akapoolco Seeded Successfully.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
