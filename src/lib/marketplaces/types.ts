/**
 * Marketplace Integration Types
 * Common types used across all marketplace adapters
 */

export enum MarketplaceType {
  AMAZON = 'AMAZON',
  WALMART = 'WALMART',
  FACEBOOK = 'FACEBOOK',
  TIKTOK = 'TIKTOK',
  WHATSAPP = 'WHATSAPP',
  SHOPIFY = 'SHOPIFY',
  WOOCOMMERCE = 'WOOCOMMERCE',
}

export interface MarketplaceCredentials {
  [key: string]: string
}

export interface MarketplaceProduct {
  sku: string
  title: string
  description?: string
  price: number
  inventory: number
  marketplaceProductId?: string
  url?: string
  imageUrl?: string
  category?: string
  brand?: string
}

export interface ListProductsArgs {
  limit?: number
  offset?: number
  sku?: string
}

export interface UpdateProductArgs {
  sku: string
  title?: string
  description?: string
  price?: number
  inventory?: number
}

export interface UpdateInventoryArgs {
  sku: string
  quantity: number
}

export interface PricingSnapshot {
  sku: string
  ourPrice?: number
  lowestPrice?: number
  competitorPrices?: Array<{
    seller: string
    price: number
    condition?: string
  }>
  timestamp: Date
}

export interface FetchPricingArgs {
  sku: string
}

/**
 * Base Marketplace Adapter Interface
 * All marketplace integrations must implement this interface
 */
export interface MarketplaceAdapter {
  /**
   * Initialize the adapter with credentials
   */
  initialize(credentials: MarketplaceCredentials): Promise<void>

  /**
   * Test the connection to the marketplace
   */
  testConnection(): Promise<boolean>

  /**
   * List products from the marketplace
   */
  listProducts(args: ListProductsArgs): Promise<MarketplaceProduct[]>

  /**
   * Get a single product by SKU
   */
  getProduct(sku: string): Promise<MarketplaceProduct | null>

  /**
   * Create or update a product on the marketplace
   */
  updateProduct(args: UpdateProductArgs): Promise<void>

  /**
   * Update inventory for a product
   */
  updateInventory(args: UpdateInventoryArgs): Promise<void>

  /**
   * Fetch pricing data for competitive analysis
   */
  fetchPricingData(args: FetchPricingArgs): Promise<PricingSnapshot>

  /**
   * Get the marketplace type
   */
  getType(): MarketplaceType
}

/**
 * Marketplace Adapter Factory
 * Creates the appropriate adapter based on marketplace type
 */
export interface MarketplaceAdapterFactory {
  createAdapter(type: MarketplaceType, credentials: MarketplaceCredentials): MarketplaceAdapter
}
