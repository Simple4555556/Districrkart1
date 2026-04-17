import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const fallbackImage = "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=800"
    
    const badProducts = await prisma.product.findMany({
      where: { imageUrl: { contains: "C:\\Users" } }
    })
    
    console.log(`Found ${badProducts.length} products with bad paths.`)
    
    for (const p of badProducts) {
      await prisma.product.update({
        where: { id: p.id },
        data: { imageUrl: fallbackImage }
      })
      console.log(`Updated Product ID: ${p.id}`)
    }

    const badShops = await prisma.shop.findMany({
      where: { logoUrl: { contains: "C:\\Users" } }
    })
    
    console.log(`Found ${badShops.length} shops with bad paths.`)
    
    for (const s of badShops) {
      await prisma.shop.update({
        where: { id: s.id },
        data: { logoUrl: "/shop-placeholder.png" }
      })
      console.log(`Updated Shop ID: ${s.id}`)
    }

    console.log("Cleanup complete.")
  } catch (e) {
    console.error('Failed to clean up database:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
