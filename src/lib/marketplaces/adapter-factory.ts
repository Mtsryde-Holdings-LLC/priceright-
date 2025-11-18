/**
 * Marketplace Adapter Factory
 * Creates appropriate adapter instances based on marketplace type
 */

import { MarketplaceType, MarketplaceAdapter, MarketplaceCredentials } from './types'
import { AmazonAdapter } from './amazon-adapter'
import { WalmartAdapter } from './walmart-adapter'
import { ShopifyAdapter } from './shopify-adapter'
import { WooCommerceAdapter } from './woocommerce-adapter'
import { FacebookAdapter } from './facebook-adapter'
import { TikTokAdapter } from './tiktok-adapter'
import { WhatsAppAdapter } from './whatsapp-adapter'

export class AdapterFactory {
  /**
   * Create an adapter instance for the specified marketplace type
   */
  static async createAdapter(
    type: MarketplaceType,
    credentials: MarketplaceCredentials
  ): Promise<MarketplaceAdapter> {
    let adapter: MarketplaceAdapter

    switch (type) {
      case MarketplaceType.AMAZON:
        adapter = new AmazonAdapter()
        break
      case MarketplaceType.WALMART:
        adapter = new WalmartAdapter()
        break
      case MarketplaceType.SHOPIFY:
        adapter = new ShopifyAdapter()
        break
      case MarketplaceType.WOOCOMMERCE:
        adapter = new WooCommerceAdapter()
        break
      case MarketplaceType.FACEBOOK:
        adapter = new FacebookAdapter()
        break
      case MarketplaceType.TIKTOK:
        adapter = new TikTokAdapter()
        break
      case MarketplaceType.WHATSAPP:
        adapter = new WhatsAppAdapter()
        break
      default:
        throw new Error(`Unsupported marketplace type: ${type}`)
    }

    await adapter.initialize(credentials)
    return adapter
  }

  /**
   * Get all supported marketplace types
   */
  static getSupportedMarketplaces(): MarketplaceType[] {
    return Object.values(MarketplaceType)
  }
}
