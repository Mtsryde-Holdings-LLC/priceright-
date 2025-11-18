/**
 * Job Queue Configuration
 * Uses BullMQ for background job processing
 */

import { Queue, Worker, QueueEvents } from 'bullmq'
import Redis from 'ioredis'

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

// Job types
export enum JobType {
  INVENTORY_SYNC = 'inventory-sync',
  REPRICING_CALCULATION = 'repricing-calculation',
  MARKETPLACE_POLL = 'marketplace-poll',
  PRICE_UPDATE = 'price-update',
  PRODUCT_SYNC = 'product-sync',
  BRAND_APPROVAL_SUBMIT = 'brand-approval-submit',
}

// Queue instances
export const inventorySyncQueue = new Queue('inventory-sync', { connection })
export const repricingQueue = new Queue('repricing', { connection })
export const marketplacePollQueue = new Queue('marketplace-poll', { connection })
export const priceUpdateQueue = new Queue('price-update', { connection })
export const productSyncQueue = new Queue('product-sync', { connection })
export const brandApprovalQueue = new Queue('brand-approval', { connection })

/**
 * Add a job to the appropriate queue
 */
export async function enqueueJob(
  type: JobType,
  data: any,
  options?: {
    delay?: number
    priority?: number
    attempts?: number
  }
) {
  const jobOptions = {
    attempts: options?.attempts || 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
    ...options,
  }

  switch (type) {
    case JobType.INVENTORY_SYNC:
      return inventorySyncQueue.add('sync', data, jobOptions)
    case JobType.REPRICING_CALCULATION:
      return repricingQueue.add('calculate', data, jobOptions)
    case JobType.MARKETPLACE_POLL:
      return marketplacePollQueue.add('poll', data, jobOptions)
    case JobType.PRICE_UPDATE:
      return priceUpdateQueue.add('update', data, jobOptions)
    case JobType.PRODUCT_SYNC:
      return productSyncQueue.add('sync', data, jobOptions)
    case JobType.BRAND_APPROVAL_SUBMIT:
      return brandApprovalQueue.add('submit', data, jobOptions)
    default:
      throw new Error(`Unknown job type: ${type}`)
  }
}

/**
 * Schedule recurring jobs (cron-like)
 */
export async function scheduleRecurringJobs() {
  // Poll all marketplaces every 15 minutes
  await marketplacePollQueue.add(
    'poll-all',
    { type: 'all-marketplaces' },
    {
      repeat: {
        pattern: '*/15 * * * *', // Every 15 minutes
      },
    }
  )

  // Run repricing calculations every hour
  await repricingQueue.add(
    'calculate-all',
    { type: 'all-products' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
    }
  )

  // Sync inventory every 5 minutes
  await inventorySyncQueue.add(
    'sync-all',
    { type: 'all-products' },
    {
      repeat: {
        pattern: '*/5 * * * *', // Every 5 minutes
      },
    }
  )

  console.log('[Queue] Recurring jobs scheduled')
}
