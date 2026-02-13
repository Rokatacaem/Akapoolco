import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const products = [
        { name: 'Cerveza Corona', category: 'CERVEZAS', priceMember: 3000, priceClient: 4000, stock: 100 },
        { name: 'Cerveza Royal', category: 'CERVEZAS', priceMember: 2500, priceClient: 3500, stock: 100 },
        { name: 'Coca Cola', category: 'BEBIDAS', priceMember: 1500, priceClient: 2000, stock: 50 },
        { name: 'Agua Mineral', category: 'BEBIDAS', priceMember: 1000, priceClient: 1500, stock: 50 },
        { name: 'Papas Fritas', category: 'SNACKS', priceMember: 2000, priceClient: 2500, stock: 20 },
        { name: 'Pizza Individual', category: 'COMIDA', priceMember: 5000, priceClient: 6000, stock: 10 },
    ]

    console.log('Seeding Products...')

    for (const p of products) {
        await prisma.product.create({
            data: {
                name: p.name,
                category: p.category,
                priceMember: p.priceMember,
                priceClient: p.priceClient,
                stock: p.stock
            }
        })
    }

    console.log('Seeding completed')
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
