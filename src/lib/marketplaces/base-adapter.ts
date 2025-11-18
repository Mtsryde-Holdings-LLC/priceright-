/**
 * Base Marketplace Adapter
 * Abstract base class with common functionality
 */

import {
  MarketplaceAdapter,
  MarketplaceCredentials,
  MarketplaceProduct,
  ListProductsArgs,
  UpdateProductArgs,
  UpdateInventoryArgs,
  PricingSnapshot,
  FetchPricingArgs,
  MarketplaceType,
} from './types'

export abstract class BaseMarketplaceAdapter implements MarketplaceAdapter {
  protected credentials: MarketplaceCredentials = {}
  protected isInitialized = false

  abstract getType(): MarketplaceType

  async initialize(credentials: MarketplaceCredentials): Promise<void> {
    this.credentials = credentials
    this.isInitialized = true
  }

  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized. Call initialize() first.')
    }
  }

  abstract testConnection(): Promise<boolean>
  abstract listProducts(args: ListProductsArgs): Promise<MarketplaceProduct[]>
  abstract getProduct(sku: string): Promise<MarketplaceProduct | null>
  abstract updateProduct(args: UpdateProductArgs): Promise<void>
  abstract updateInventory(args: UpdateInventoryArgs): Promise<void>
  abstract fetchPricingData(args: FetchPricingArgs): Promise<PricingSnapshot>

  /**
   * Helper method for making HTTP requests with error handling
   */
  protected async makeRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`[${this.getType()}] Request failed:`, error)
      throw error
    }
  }

  /**
   * Helper method to handle rate limiting with retry logic
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        if (attempt < maxRetries - 1) {
          await this.sleep(delay * Math.pow(2, attempt))
        }
      }
    }

    throw lastError
  }

  /**
   * Sleep helper for retry logic
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
