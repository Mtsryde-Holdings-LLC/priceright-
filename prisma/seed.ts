/**
 * Prisma Database Seed
 * Populates database with sample data for development
 */

import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      plan: 'professional',
      status: 'active',
    },
  })

  console.log('✅ Created tenant:', tenant.name)

  // Create demo user (owner)
  const passwordHash = await hash('demo1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@priceright.com' },
    update: {},
    create: {
      email: 'demo@priceright.com',
      name: 'Demo User',
      passwordHash,
      role: 'OWNER',
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created user:', user.email)

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        sku: 'DEMO-001',
        title: 'Premium Wireless Headphones',
        description: 'High-quality noise-canceling headphones',
        brand: 'AudioTech',
        category: 'Electronics',
        costPrice: 45.00,
        totalInventory: 150,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        sku: 'DEMO-002',
        title: 'Smart Fitness Tracker',
        description: 'Track your health and fitness goals',
        brand: 'FitGear',
        category: 'Wearables',
        costPrice: 32.50,
        totalInventory: 200,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        tenantId: tenant.id,
        sku: 'DEMO-003',
        title: 'Portable Phone Charger',
        description: '10000mAh power bank',
        brand: 'PowerPlus',
        category: 'Electronics',
        costPrice: 15.00,
        totalInventory: 500,
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${products.length} sample products`)

  // Create marketplace connections (demo - no real credentials)
  const connections = await Promise.all([
    prisma.marketplaceConnection.create({
      data: {
        tenantId: tenant.id,
        type: 'AMAZON',
        name: 'Amazon US Account',
        credentials: {
          clientId: 'demo_amazon_client',
          clientSecret: 'demo_secret',
          sellerId: 'A1DEMO123',
        },
        isActive: true,
        status: 'connected',
        lastSyncAt: new Date(),
      },
    }),
    prisma.marketplaceConnection.create({
      data: {
        tenantId: tenant.id,
        type: 'WALMART',
        name: 'Walmart Marketplace',
        credentials: {
          clientId: 'demo_walmart_client',
          clientSecret: 'demo_secret',
        },
        isActive: true,
        status: 'connected',
        lastSyncAt: new Date(),
      },
    }),
    prisma.marketplaceConnection.create({
      data: {
        tenantId: tenant.id,
        type: 'SHOPIFY',
        name: 'My Shopify Store',
        credentials: {
          shopDomain: 'demo-store.myshopify.com',
          apiKey: 'demo_key',
          apiSecret: 'demo_secret',
        },
        isActive: true,
        status: 'connected',
        lastSyncAt: new Date(),
      },
    }),
  ])

  console.log(`✅ Created ${connections.length} marketplace connections`)

  // Create sample repricing rule
  const rule = await prisma.repricingRule.create({
    data: {
      tenantId: tenant.id,
      name: 'Default Competitive Pricing',
      description: 'Match lowest competitor while maintaining 20% margin',
      strategy: 'MATCH_LOWEST',
      minMargin: 20,
      maxDiscount: 15,
      isActive: true,
      parameters: {
        undercutPercent: 2,
      },
    },
  })

  console.log('✅ Created repricing rule:', rule.name)

  console.log('🎉 Seeding completed!')
  console.log('\nDemo credentials:')
  console.log('  Email: demo@priceright.com')
  console.log('  Password: demo1234')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
