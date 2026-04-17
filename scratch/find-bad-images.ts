import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, imageUrl: true }
    })
    console.log('Products:')
    products.forEach(p => {
      if (p.imageUrl?.includes('C:\\Users')) {
        console.log(`[BAD PATH] Product ID: ${p.id}, ImageURL: ${p.imageUrl}`)
      }
    })

    const shops = await prisma.shop.findMany({
      select: { id: true, name: true, logoUrl: true }
    })
    console.log('\nShops:')
    shops.forEach(s => {
       if (s.logoUrl?.includes('C:\\Users')) {
        console.log(`[BAD PATH] Shop ID: ${s.id}, LogoURL: ${s.logoUrl}`)
      }
    })
  } catch (e) {
    console.error('Failed to query database:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
