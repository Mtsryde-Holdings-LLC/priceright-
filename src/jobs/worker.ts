/**
 * Job Worker
 * Processes background jobs from queues
 */

import { Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import { prisma } from '../lib/prisma'
import { AdapterFactory, MarketplaceType } from '../lib/marketplaces'
import { repricingEngine } from '../lib/services/repricing-engine'

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

/**
 * Inventory Sync Worker
 */
export const inventorySyncWorker = new Worker(
  'inventory-sync',
  async (job: Job) => {
    const { tenantId, productId, sku, quantity } = job.data

    console.log(`[Inventory Sync] Processing for product ${sku}`)

    try {
      // Get all marketplace connections for this tenant
      const connections = await prisma.marketplaceConnection.findMany({
        where: { tenantId, isActive: true },
      })

      // Update inventory on each marketplace
      for (const connection of connections) {
        try {
          const adapter = await AdapterFactory.createAdapter(
            connection.type as MarketplaceType,
            connection.credentials as any
          )

          await adapter.updateInventory({ sku, quantity })

          await prisma.marketplaceConnection.update({
            where: { id: connection.id },
            data: { lastSyncAt: new Date() },
          })

          console.log(`[Inventory Sync] Updated ${connection.type} for ${sku}`)
        } catch (error) {
          console.error(`[Inventory Sync] Failed for ${connection.type}:`, error)
          await prisma.marketplaceConnection.update({
            where: { id: connection.id },
            data: {
              lastError: (error as Error).message,
            },
          })
        }
      }

      // Create inventory snapshot
      await prisma.inventorySnapshot.create({
        data: {
          tenantId,
          productId,
          quantity,
          source: 'sync',
        },
      })

      return { success: true, productId, sku }
    } catch (error) {
      console.error('[Inventory Sync] Job failed:', error)
      throw error
    }
  },
  { connection }
)

/**
 * Repricing Calculation Worker
 */
export const repricingWorker = new Worker(
  'repricing',
  async (job: Job) => {
    const { tenantId, productId, marketplace } = job.data

    console.log(`[Repricing] Calculating for product ${productId}`)

    try {
      // Get product details
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          marketplaceListings: true,
        },
      })

      if (!product) {
        throw new Error(`Product ${productId} not found`)
      }

      // Get latest price snapshots
      const priceSnapshots = await prisma.priceSnapshot.findMany({
        where: {
          productId,
          marketplace,
        },
        orderBy: { timestamp: 'desc' },
        take: 14, // Last 14 data points for trend analysis
      })

      // Get latest competitor prices
      const latestSnapshot = priceSnapshots[0]
      const competitorPrices = (latestSnapshot?.competitorPrices as any) || []

      // Generate recommendation
      const recommendation = await repricingEngine.generateRecommendation({
        productId,
        tenantId,
        marketplace,
        currentPrice: Number(product.costPrice), // This would be marketplace-specific price
        costPrice: Number(product.costPrice),
        competitorPrices,
        historicalPrices: priceSnapshots.map(s => ({
          price: Number(s.ourPrice || 0),
          timestamp: s.timestamp,
        })),
      })

      // Save recommendation
      await prisma.repricingRecommendation.create({
        data: {
          tenantId,
          productId,
          marketplace,
          currentPrice: Number(product.costPrice),
          recommendedPrice: recommendation.recommendedPrice,
          confidence: recommendation.confidence,
          reasoning: recommendation.reasoning,
          analysisData: recommendation.analysisData as any,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })

      return { success: true, recommendation }
    } catch (error) {
      console.error('[Repricing] Job failed:', error)
      throw error
    }
  },
  { connection }
)

/**
 * Price Update Worker
 */
export const priceUpdateWorker = new Worker(
  'price-update',
  async (job: Job) => {
    const { tenantId, productId, marketplace, newPrice, reason, userId } = job.data

    console.log(`[Price Update] Updating price for product ${productId} to ${newPrice}`)

    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          marketplaceListings: {
            include: {
              marketplaceConnection: true,
            },
          },
        },
      })

      if (!product) {
        throw new Error(`Product ${productId} not found`)
      }

      // Find the marketplace listing for the specified marketplace
      const listing = product.marketplaceListings.find(
        l => l.marketplaceConnection?.type === marketplace
      )

      if (!listing) {
        throw new Error(`No listing found for marketplace ${marketplace}`)
      }

      const oldPrice = Number(listing.currentPrice)

      // Get marketplace connection
      const connection = await prisma.marketplaceConnection.findUnique({
        where: { id: listing.marketplaceConnectionId },
      })

      if (!connection) {
        throw new Error('Marketplace connection not found')
      }

      // Update price on marketplace
      const adapter = await AdapterFactory.createAdapter(
        connection.type as MarketplaceType,
        connection.credentials as any
      )

      await adapter.updateProduct({
        sku: product.sku,
        price: newPrice,
      })

      // Update local database
      await prisma.productMarketplaceListing.update({
        where: { id: listing.id },
        data: { currentPrice: newPrice },
      })

      // Log price change
      await prisma.priceChangeLog.create({
        data: {
          tenantId,
          productId,
          marketplace,
          oldPrice,
          newPrice,
          reason,
          performedBy: userId,
        },
      })

      return { success: true, oldPrice, newPrice }
    } catch (error) {
      console.error('[Price Update] Job failed:', error)
      throw error
    }
  },
  { connection }
)

/**
 * Marketplace Poll Worker
 */
export const marketplacePollWorker = new Worker(
  'marketplace-poll',
  async (job: Job) => {
    const { tenantId, connectionId } = job.data

    console.log(`[Marketplace Poll] Polling connection ${connectionId}`)

    try {
      const connection = await prisma.marketplaceConnection.findUnique({
        where: { id: connectionId },
      })

      if (!connection) {
        throw new Error('Connection not found')
      }

      const adapter = await AdapterFactory.createAdapter(
        connection.type as MarketplaceType,
        connection.credentials as any
      )

      // Fetch products from marketplace
      const products = await adapter.listProducts({ limit: 100 })

      // Sync with local database (simplified)
      for (const mpProduct of products) {
        // In production, this would do more sophisticated syncing
        console.log(`[Marketplace Poll] Synced product ${mpProduct.sku}`)
      }

      await prisma.marketplaceConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          status: 'connected',
        },
      })

      return { success: true, productsCount: products.length }
    } catch (error) {
      console.error('[Marketplace Poll] Job failed:', error)
      throw error
    }
  },
  { connection }
)

// Start all workers
console.log('[Workers] Starting job workers...')

// Handle worker events
const workers = [
  inventorySyncWorker,
  repricingWorker,
  priceUpdateWorker,
  marketplacePollWorker,
]

workers.forEach(worker => {
  worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err)
  })
})

console.log('[Workers] All workers started')
