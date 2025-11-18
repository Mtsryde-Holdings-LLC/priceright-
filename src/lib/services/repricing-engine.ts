/**
 * AI/ML Repricing Engine
 * Calculates optimal pricing recommendations based on market data and user rules
 *
 * This implementation uses statistical analysis and rule-based logic.
 * In production, this would integrate with a real ML model (TensorFlow, PyTorch, etc.)
 */

import { prisma } from '../prisma'
import { MarketplaceType } from '@prisma/client'

export interface RepricingInput {
  productId: string
  tenantId: string
  marketplace: MarketplaceType
  currentPrice: number
  costPrice: number
  competitorPrices: Array<{ price: number; seller: string }>
  historicalPrices?: Array<{ price: number; timestamp: Date }>
}

export interface RepricingRecommendationOutput {
  recommendedPrice: number
  confidence: number // 0-100
  reasoning: string
  analysisData: {
    lowestCompetitorPrice?: number
    averageCompetitorPrice?: number
    priceRange?: { min: number; max: number }
    trend?: 'increasing' | 'decreasing' | 'stable'
    projectedMargin?: number
  }
}

export class RepricingEngine {
  /**
   * Generate repricing recommendation for a product
   */
  async generateRecommendation(
    input: RepricingInput
  ): Promise<RepricingRecommendationOutput> {
    // Fetch repricing rules for this product
    const rules = await this.getApplicableRules(input.productId, input.tenantId)

    // Analyze competitor pricing
    const competitorAnalysis = this.analyzeCompetitorPricing(input.competitorPrices)

    // Analyze price trends
    const trendAnalysis = this.analyzePriceTrends(input.historicalPrices || [])

    // Calculate base recommendation
    let recommendedPrice = await this.calculateBasePrice(
      input,
      competitorAnalysis,
      rules
    )

    // Apply constraints from rules
    recommendedPrice = this.applyConstraints(
      recommendedPrice,
      input.costPrice,
      rules
    )

    // Calculate confidence score
    const confidence = this.calculateConfidence(
      input,
      competitorAnalysis,
      trendAnalysis
    )

    // Generate reasoning
    const reasoning = this.generateReasoning(
      input,
      recommendedPrice,
      competitorAnalysis,
      trendAnalysis,
      rules
    )

    // Calculate projected margin
    const projectedMargin = ((recommendedPrice - input.costPrice) / recommendedPrice) * 100

    return {
      recommendedPrice: Math.round(recommendedPrice * 100) / 100, // Round to 2 decimals
      confidence,
      reasoning,
      analysisData: {
        lowestCompetitorPrice: competitorAnalysis.lowest,
        averageCompetitorPrice: competitorAnalysis.average,
        priceRange: competitorAnalysis.range,
        trend: trendAnalysis.trend,
        projectedMargin,
      },
    }
  }

  /**
   * Analyze competitor pricing data
   */
  private analyzeCompetitorPricing(competitorPrices: Array<{ price: number }>) {
    if (competitorPrices.length === 0) {
      return {
        lowest: null,
        average: null,
        range: null,
      }
    }

    const prices = competitorPrices.map(c => c.price).sort((a, b) => a - b)

    return {
      lowest: prices[0],
      average: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      range: {
        min: prices[0],
        max: prices[prices.length - 1],
      },
    }
  }

  /**
   * Analyze historical price trends
   */
  private analyzePriceTrends(
    historicalPrices: Array<{ price: number; timestamp: Date }>
  ): { trend: 'increasing' | 'decreasing' | 'stable'; changeRate?: number } {
    if (historicalPrices.length < 2) {
      return { trend: 'stable' }
    }

    // Sort by timestamp
    const sorted = [...historicalPrices].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    )

    // Simple moving average comparison
    const recentPrices = sorted.slice(-7) // Last 7 data points
    const olderPrices = sorted.slice(-14, -7) // Previous 7 data points

    if (olderPrices.length === 0) {
      return { trend: 'stable' }
    }

    const recentAvg = recentPrices.reduce((sum, p) => sum + p.price, 0) / recentPrices.length
    const olderAvg = olderPrices.reduce((sum, p) => sum + p.price, 0) / olderPrices.length

    const changeRate = ((recentAvg - olderAvg) / olderAvg) * 100

    if (changeRate > 2) {
      return { trend: 'increasing', changeRate }
    } else if (changeRate < -2) {
      return { trend: 'decreasing', changeRate }
    } else {
      return { trend: 'stable', changeRate }
    }
  }

  /**
   * Calculate base recommended price based on strategy
   */
  private async calculateBasePrice(
    input: RepricingInput,
    competitorAnalysis: any,
    rules: any[]
  ): Promise<number> {
    // If no rules, use default strategy
    if (rules.length === 0 || !rules[0]) {
      // Default: Match lowest competitor price
      return competitorAnalysis.lowest || input.currentPrice
    }

    const rule = rules[0]

    switch (rule.strategy) {
      case 'MATCH_LOWEST':
        return competitorAnalysis.lowest || input.currentPrice

      case 'UNDERCUT_BY_PERCENT':
        const undercutPercent = rule.parameters?.undercutPercent || 5
        const lowestPrice = competitorAnalysis.lowest || input.currentPrice
        return lowestPrice * (1 - undercutPercent / 100)

      case 'UNDERCUT_BY_AMOUNT':
        const undercutAmount = rule.parameters?.undercutAmount || 1
        return (competitorAnalysis.lowest || input.currentPrice) - undercutAmount

      case 'TARGET_MARGIN':
        const targetMargin = rule.parameters?.targetMargin || 20
        return input.costPrice / (1 - targetMargin / 100)

      case 'CUSTOM':
        // Custom logic would go here
        return input.currentPrice

      default:
        return input.currentPrice
    }
  }

  /**
   * Apply pricing constraints from rules
   */
  private applyConstraints(
    price: number,
    costPrice: number,
    rules: any[]
  ): number {
    if (rules.length === 0 || !rules[0]) {
      // Ensure minimum 10% margin
      const minPrice = costPrice * 1.1
      return Math.max(price, minPrice)
    }

    const rule = rules[0]

    // Apply price floor
    if (rule.minPrice && price < rule.minPrice) {
      price = rule.minPrice
    }

    // Apply price ceiling
    if (rule.maxPrice && price > rule.maxPrice) {
      price = rule.maxPrice
    }

    // Apply minimum margin constraint
    if (rule.minMargin) {
      const minPrice = costPrice / (1 - rule.minMargin / 100)
      price = Math.max(price, minPrice)
    }

    // Apply maximum discount constraint
    if (rule.maxDiscount) {
      const maxDiscountPrice = costPrice * (1 + rule.maxDiscount / 100)
      price = Math.max(price, maxDiscountPrice)
    }

    return price
  }

  /**
   * Calculate confidence score (0-100)
   */
  private calculateConfidence(
    input: RepricingInput,
    competitorAnalysis: any,
    trendAnalysis: any
  ): number {
    let confidence = 50 // Base confidence

    // More competitor data = higher confidence
    if (input.competitorPrices.length >= 5) {
      confidence += 20
    } else if (input.competitorPrices.length >= 3) {
      confidence += 10
    }

    // Historical data increases confidence
    if (input.historicalPrices && input.historicalPrices.length >= 7) {
      confidence += 15
    }

    // Stable trends increase confidence
    if (trendAnalysis.trend === 'stable') {
      confidence += 10
    }

    // Narrow price range increases confidence
    if (competitorAnalysis.range) {
      const rangeSpread =
        (competitorAnalysis.range.max - competitorAnalysis.range.min) /
        competitorAnalysis.range.min
      if (rangeSpread < 0.1) {
        // Less than 10% spread
        confidence += 5
      }
    }

    return Math.min(confidence, 100)
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    input: RepricingInput,
    recommendedPrice: number,
    competitorAnalysis: any,
    trendAnalysis: any,
    rules: any[]
  ): string {
    const reasons: string[] = []

    // Price change direction
    const priceChange = ((recommendedPrice - input.currentPrice) / input.currentPrice) * 100
    if (priceChange > 1) {
      reasons.push(`Recommended price increase of ${priceChange.toFixed(1)}%`)
    } else if (priceChange < -1) {
      reasons.push(`Recommended price decrease of ${Math.abs(priceChange).toFixed(1)}%`)
    } else {
      reasons.push('Current price is optimal')
    }

    // Competitor analysis
    if (competitorAnalysis.lowest) {
      const diff = ((recommendedPrice - competitorAnalysis.lowest) / competitorAnalysis.lowest) * 100
      if (Math.abs(diff) < 2) {
        reasons.push('Price matches lowest competitor')
      } else if (diff < 0) {
        reasons.push(`Price undercuts lowest competitor by ${Math.abs(diff).toFixed(1)}%`)
      } else {
        reasons.push(`Price is ${diff.toFixed(1)}% above lowest competitor`)
      }
    }

    // Trend analysis
    if (trendAnalysis.trend === 'decreasing') {
      reasons.push('Market prices are trending down')
    } else if (trendAnalysis.trend === 'increasing') {
      reasons.push('Market prices are trending up')
    }

    // Rule application
    if (rules.length > 0 && rules[0]) {
      reasons.push(`Applied ${rules[0].strategy.toLowerCase().replace('_', ' ')} strategy`)
    }

    return reasons.join('. ') + '.'
  }

  /**
   * Get applicable repricing rules for a product
   */
  private async getApplicableRules(productId: string, tenantId: string) {
    // First, try to get product-specific rule
    const productRule = await prisma.repricingRule.findFirst({
      where: {
        tenantId,
        productId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (productRule) {
      return [productRule]
    }

    // Fall back to global rules
    const globalRules = await prisma.repricingRule.findMany({
      where: {
        tenantId,
        productId: null, // Global rules
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    })

    return globalRules
  }
}

// Singleton instance
export const repricingEngine = new RepricingEngine()
