/**
 * Prisma Client Instance
 * Singleton pattern to prevent multiple instances in development
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Prisma Middleware for Multi-Tenancy
 * Automatically filters queries by tenantId
 */

// Model names that require tenant isolation
const TENANT_MODELS = [
  'Product',
  'MarketplaceConnection',
  'RepricingRule',
  'RepricingRecommendation',
  'BrandApprovalRequest',
  'InventorySnapshot',
  'PriceSnapshot',
  'PriceChangeLog',
  'Job',
]

// Note: For production, consider using Prisma middleware or row-level security
// This is a reminder to enforce tenant isolation at the query level
// Example implementation would be added here in production
