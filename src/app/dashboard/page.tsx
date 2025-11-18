/**
 * Dashboard Page
 * Overview of key metrics and recent activity
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface DashboardStats {
  totalProducts: number
  activeListings: number
  pendingRecommendations: number
  connectedMarketplaces: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeListings: 0,
    pendingRecommendations: 0,
    connectedMarketplaces: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In production, fetch real data from API
    // For demo, using mock data
    setTimeout(() => {
      setStats({
        totalProducts: 127,
        activeListings: 342,
        pendingRecommendations: 18,
        connectedMarketplaces: 3,
      })
      setLoading(false)
    }, 500)
  }, [])

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: '📦',
      color: 'bg-blue-500',
    },
    {
      title: 'Active Listings',
      value: stats.activeListings,
      icon: '🛒',
      color: 'bg-green-500',
    },
    {
      title: 'Pending Recommendations',
      value: stats.pendingRecommendations,
      icon: '💡',
      color: 'bg-yellow-500',
    },
    {
      title: 'Connected Marketplaces',
      value: stats.connectedMarketplaces,
      icon: '🔌',
      color: 'bg-purple-500',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's an overview of your repricing activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div key={stat.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`${stat.color} text-white text-3xl p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              { action: 'Price updated', product: 'Product SKU-001', time: '2 minutes ago' },
              { action: 'New recommendation', product: 'Product SKU-045', time: '15 minutes ago' },
              { action: 'Inventory synced', product: 'Amazon', time: '1 hour ago' },
              { action: 'Product created', product: 'Product SKU-128', time: '3 hours ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.product}</p>
                </div>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="card hover:shadow-lg transition-shadow text-left">
            <div className="text-3xl mb-2">➕</div>
            <h3 className="font-semibold text-gray-900">Add Product</h3>
            <p className="text-sm text-gray-600 mt-1">
              Create a new product listing
            </p>
          </button>
          <button className="card hover:shadow-lg transition-shadow text-left">
            <div className="text-3xl mb-2">🔌</div>
            <h3 className="font-semibold text-gray-900">Connect Marketplace</h3>
            <p className="text-sm text-gray-600 mt-1">
              Link a new sales channel
            </p>
          </button>
          <button className="card hover:shadow-lg transition-shadow text-left">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="font-semibold text-gray-900">Review Prices</h3>
            <p className="text-sm text-gray-600 mt-1">
              Check repricing recommendations
            </p>
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
