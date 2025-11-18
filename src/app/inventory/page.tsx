/**
 * Inventory Management Page
 * View and manage inventory across all marketplaces
 */

'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor and sync inventory across all marketplaces
          </p>
        </div>

        <div className="card">
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📦</div>
            <p>Inventory management interface coming soon</p>
            <p className="text-sm mt-2">
              Real-time inventory tracking across Amazon, Walmart, Shopify, and more
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
