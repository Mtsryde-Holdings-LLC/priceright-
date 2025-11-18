/**
 * TikTok Shop Adapter
 * Integrates with TikTok Shop Open API
 */

import { BaseMarketplaceAdapter } from './base-adapter'
import {
  MarketplaceType,
  MarketplaceProduct,
  ListProductsArgs,
  UpdateProductArgs,
  UpdateInventoryArgs,
  PricingSnapshot,
  FetchPricingArgs,
} from './types'

export class TikTokAdapter extends BaseMarketplaceAdapter {
  getType(): MarketplaceType {
    return MarketplaceType.TIKTOK
  }

  async testConnection(): Promise<boolean> {
    this.ensureInitialized()
    // In production: Call /api/products/search
    return true
  }

  async listProducts(args: ListProductsArgs): Promise<MarketplaceProduct[]> {
    this.ensureInitialized()
    // In production: POST /api/products/search
    return []
  }

  async getProduct(sku: string): Promise<MarketplaceProduct | null> {
    this.ensureInitialized()
    return null
  }

  async updateProduct(args: UpdateProductArgs): Promise<void> {
    this.ensureInitialized()
    // In production: POST /api/products/update
    await this.sleep(500)
  }

  async updateInventory(args: UpdateInventoryArgs): Promise<void> {
    this.ensureInitialized()
    // In production: POST /api/products/stocks/update
    await this.sleep(500)
  }

  async fetchPricingData(args: FetchPricingArgs): Promise<PricingSnapshot> {
    return {
      sku: args.sku,
      ourPrice: undefined,
      lowestPrice: undefined,
      competitorPrices: [],
      timestamp: new Date(),
    }
  }
}
