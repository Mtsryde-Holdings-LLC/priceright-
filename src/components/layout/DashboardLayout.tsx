/**
 * Dashboard Layout Component
 * Provides sidebar navigation and top bar for authenticated pages
 */

'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  name: string
  href: string
  icon: string
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Products', href: '/products', icon: '📦' },
  { name: 'Inventory', href: '/inventory', icon: '📈' },
  { name: 'Repricing', href: '/repricing', icon: '💰' },
  { name: 'Brand Approval', href: '/brand-approval', icon: '✅' },
  { name: 'Integrations', href: '/integrations', icon: '🔌' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">PriceRight</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-gray-800">
            {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
          </h2>
          <div className="text-sm text-gray-600">
            {session?.user?.tenantId && (
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                Tenant ID: {session.user.tenantId.slice(0, 8)}...
              </span>
            )}
          </div>
        </div>

        {/* Page content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}
