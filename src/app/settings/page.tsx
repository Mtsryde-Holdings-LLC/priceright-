/**
 * Settings Page
 * Tenant and user settings
 */

'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your account and tenant preferences
          </p>
        </div>

        <div className="card">
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">⚙️</div>
            <p>Settings interface coming soon</p>
            <p className="text-sm mt-2">
              Configure user preferences, billing, and notifications
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
