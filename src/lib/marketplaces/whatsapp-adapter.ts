/**
 * WhatsApp Business Adapter
 * Integrates with WhatsApp Business API for product catalogs
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

export class WhatsAppAdapter extends BaseMarketplaceAdapter {
  getType(): MarketplaceType {
    return MarketplaceType.WHATSAPP
  }

  async testConnection(): Promise<boolean> {
    this.ensureInitialized()
    // In production: GET /{whatsapp-business-account-id}
    return true
  }

  async listProducts(args: ListProductsArgs): Promise<MarketplaceProduct[]> {
    this.ensureInitialized()
    // In production: GET /{catalog-id}/products
    return []
  }

  async getProduct(sku: string): Promise<MarketplaceProduct | null> {
    this.ensureInitialized()
    return null
  }

  async updateProduct(args: UpdateProductArgs): Promise<void> {
    this.ensureInitialized()
    // In production: POST /{catalog-id}/products
    await this.sleep(500)
  }

  async updateInventory(args: UpdateInventoryArgs): Promise<void> {
    this.ensureInitialized()
    // WhatsApp Business doesn't have inventory tracking
    // This is a no-op
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
