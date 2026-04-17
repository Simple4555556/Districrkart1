import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const shopCount = await prisma.shop.count()
    console.log(`Successfully connected to database. Shop count: ${shopCount}`)
  } catch (e) {
    console.error('Failed to connect to database:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
