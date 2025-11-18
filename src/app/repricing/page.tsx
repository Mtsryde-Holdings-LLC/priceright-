/**
 * Repricing Dashboard Page
 * View and manage AI-powered pricing recommendations
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Recommendation {
  id: string
  currentPrice: number
  recommendedPrice: number
  confidence: number
  reasoning: string
  marketplace: string
  status: string
  product: {
    sku: string
    title: string
    costPrice: number
  }
  analysisData: {
    lowestCompetitorPrice?: number
    averageCompetitorPrice?: number
    projectedMargin?: number
  }
}

export default function RepricingPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/repricing/recommendations?status=pending')
      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptRecommendation = async (recommendationId: string) => {
    try {
      await fetch('/api/repricing/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId }),
      })
      // Refresh recommendations
      fetchRecommendations()
    } catch (error) {
      console.error('Failed to accept recommendation:', error)
    }
  }

  const getPriceChangePercent = (current: number, recommended: number) => {
    return ((recommended - current) / current * 100).toFixed(1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Repricing Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            AI-powered pricing recommendations based on market data
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="text-sm text-gray-600">Pending Recommendations</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {recommendations.length}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Avg. Confidence Score</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">
              {recommendations.length > 0
                ? Math.round(recommendations.reduce((sum, r) => sum + Number(r.confidence), 0) / recommendations.length)
                : 0}%
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Potential Impact</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              +12.5%
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Active Recommendations
            </h2>
            <button className="btn-primary">Accept All</button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No pending recommendations. Check back later!
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const priceChange = getPriceChangePercent(
                  Number(rec.currentPrice),
                  Number(rec.recommendedPrice)
                )
                const isIncrease = Number(priceChange) > 0

                return (
                  <div
                    key={rec.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {rec.product.title}
                          </h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {rec.product.sku}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                            {rec.marketplace}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500">Current Price</div>
                            <div className="text-lg font-semibold text-gray-900">
                              ${Number(rec.currentPrice).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Recommended Price</div>
                            <div className={`text-lg font-semibold ${
                              isIncrease ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${Number(rec.recommendedPrice).toFixed(2)}
                              <span className="text-sm ml-1">
                                ({isIncrease ? '+' : ''}{priceChange}%)
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Confidence</div>
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-semibold text-gray-900">
                                {Number(rec.confidence).toFixed(0)}%
                              </div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full"
                                  style={{ width: `${rec.confidence}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Projected Margin</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {rec.analysisData.projectedMargin?.toFixed(1) || 'N/A'}%
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="text-xs font-medium text-gray-700 mb-1">
                            Analysis
                          </div>
                          <p className="text-sm text-gray-600">{rec.reasoning}</p>
                        </div>

                        {rec.analysisData.lowestCompetitorPrice && (
                          <div className="text-xs text-gray-500">
                            Lowest competitor: ${rec.analysisData.lowestCompetitorPrice.toFixed(2)}
                            {rec.analysisData.averageCompetitorPrice && (
                              <> • Average: ${rec.analysisData.averageCompetitorPrice.toFixed(2)}</>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-6">
                        <button
                          onClick={() => acceptRecommendation(rec.id)}
                          className="btn-primary whitespace-nowrap"
                        >
                          Accept
                        </button>
                        <button className="btn-secondary whitespace-nowrap">
                          Reject
                        </button>
                        <button className="text-sm text-gray-600 hover:text-gray-800">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
