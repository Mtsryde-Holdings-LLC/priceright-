/**
 * Marketplace Integrations Page
 * Connect and manage marketplace accounts
 */

'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface Connection {
  id: string
  type: string
  name: string
  status: string
  lastSyncAt: string | null
  isActive: boolean
}

const MARKETPLACE_INFO = {
  AMAZON: {
    icon: '🛒',
    color: 'bg-orange-500',
    description: 'Amazon Marketplace - SP-API',
  },
  WALMART: {
    icon: '🏪',
    color: 'bg-blue-500',
    description: 'Walmart Marketplace',
  },
  SHOPIFY: {
    icon: '🛍️',
    color: 'bg-green-500',
    description: 'Shopify Store',
  },
  WOOCOMMERCE: {
    icon: '🔷',
    color: 'bg-purple-500',
    description: 'WooCommerce Store',
  },
  FACEBOOK: {
    icon: '📘',
    color: 'bg-blue-600',
    description: 'Facebook Marketplace',
  },
  TIKTOK: {
    icon: '🎵',
    color: 'bg-black',
    description: 'TikTok Shop',
  },
  WHATSAPP: {
    icon: '💬',
    color: 'bg-green-600',
    description: 'WhatsApp Business',
  },
}

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchConnections()
  }, [])

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/integrations')
      const data = await response.json()
      setConnections(data.connections || [])
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMarketplaceInfo = (type: string) => {
    return MARKETPLACE_INFO[type as keyof typeof MARKETPLACE_INFO] || {
      icon: '🔌',
      color: 'bg-gray-500',
      description: type,
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketplace Integrations</h1>
            <p className="mt-1 text-sm text-gray-600">
              Connect your marketplace accounts to sync products and prices
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            + Connect Marketplace
          </button>
        </div>

        {/* Connected Marketplaces */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Connected Marketplaces
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                No marketplace connections yet
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                Connect Your First Marketplace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map((connection) => {
                const info = getMarketplaceInfo(connection.type)
                return (
                  <div
                    key={connection.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`${info.color} text-white text-2xl p-3 rounded-lg`}>
                          {info.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {connection.name}
                          </h3>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        connection.status === 'connected'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {connection.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last sync:</span>
                        <span className="text-gray-900">
                          {formatDate(connection.lastSyncAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={connection.isActive ? 'text-green-600' : 'text-gray-600'}>
                          {connection.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 btn-secondary text-sm">
                        Configure
                      </button>
                      <button className="flex-1 btn-secondary text-sm">
                        Sync Now
                      </button>
                      <button className="px-3 text-red-600 hover:bg-red-50 rounded-lg">
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Available Marketplaces */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Available Marketplaces
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(MARKETPLACE_INFO).map(([type, info]) => {
              const isConnected = connections.some(c => c.type === type)
              return (
                <button
                  key={type}
                  onClick={() => !isConnected && setShowAddModal(true)}
                  disabled={isConnected}
                  className={`p-6 border-2 rounded-lg transition-colors ${
                    isConnected
                      ? 'border-gray-200 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className={`${info.color} text-white text-3xl p-3 rounded-lg inline-block mb-3`}>
                    {info.icon}
                  </div>
                  <div className="font-medium text-gray-900">{type}</div>
                  {isConnected && (
                    <div className="text-xs text-green-600 mt-1">✓ Connected</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Add Connection Modal (simplified - just placeholder) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Connect Marketplace
              </h2>
              <p className="text-gray-600 mb-6">
                Marketplace connection form would go here with OAuth or API key inputs.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button className="btn-primary">Connect</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
