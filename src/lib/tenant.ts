/**
 * Multi-Tenancy Utilities
 * Helper functions for enforcing tenant isolation
 */

import { auth } from './auth'
import { prisma } from './prisma'
import { headers } from 'next/headers'

/**
 * Get the current tenant ID from the session
 * Throws an error if no session or tenant ID is found
 */
export async function requireTenantId(): Promise<string> {
  const session = await auth()

  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized: No tenant context')
  }

  return session.user.tenantId
}

/**
 * Get the current user ID from the session
 */
export async function requireUserId(): Promise<string> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('Unauthorized: No user context')
  }

  return session.user.id
}

/**
 * Get the current user role from the session
 */
export async function requireUserRole(): Promise<string> {
  const session = await auth()

  if (!session?.user?.role) {
    throw new Error('Unauthorized: No role context')
  }

  return session.user.role
}

/**
 * Get tenant ID from request headers (set by middleware)
 */
export function getTenantIdFromHeaders(): string | null {
  const headersList = headers()
  return headersList.get('x-tenant-id')
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER'): Promise<boolean> {
  const session = await auth()

  if (!session?.user?.role) {
    return false
  }

  const roleHierarchy = {
    OWNER: 3,
    ADMIN: 2,
    MEMBER: 1,
  }

  const userRoleLevel = roleHierarchy[session.user.role as keyof typeof roleHierarchy] || 0
  const requiredRoleLevel = roleHierarchy[requiredRole]

  return userRoleLevel >= requiredRoleLevel
}

/**
 * Require a specific role or higher
 * Throws an error if the user doesn't have the required role
 */
export async function requireRole(requiredRole: 'OWNER' | 'ADMIN' | 'MEMBER'): Promise<void> {
  const hasRequiredRole = await hasRole(requiredRole)

  if (!hasRequiredRole) {
    throw new Error(`Unauthorized: Required role ${requiredRole}`)
  }
}

/**
 * Create a tenant-scoped Prisma client wrapper
 * Ensures all queries are automatically filtered by tenant ID
 */
export class TenantPrismaClient {
  constructor(private tenantId: string) {}

  get product() {
    return {
      findMany: (args: any = {}) =>
        prisma.product.findMany({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
      findUnique: (args: any) =>
        prisma.product.findFirst({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
      findFirst: (args: any = {}) =>
        prisma.product.findFirst({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
      create: (args: any) =>
        prisma.product.create({
          ...args,
          data: { ...args.data, tenantId: this.tenantId },
        }),
      update: (args: any) =>
        prisma.product.updateMany({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
      delete: (args: any) =>
        prisma.product.deleteMany({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
      count: (args: any = {}) =>
        prisma.product.count({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
    }
  }

  get marketplaceConnection() {
    return {
      findMany: (args: any = {}) =>
        prisma.marketplaceConnection.findMany({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
      findFirst: (args: any = {}) =>
        prisma.marketplaceConnection.findFirst({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
      create: (args: any) =>
        prisma.marketplaceConnection.create({
          ...args,
          data: { ...args.data, tenantId: this.tenantId },
        }),
      update: (args: any) =>
        prisma.marketplaceConnection.updateMany({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
      delete: (args: any) =>
        prisma.marketplaceConnection.deleteMany({
          ...args,
          where: { ...args.where, tenantId: this.tenantId },
        }),
    }
  }

  // Add similar wrappers for other tenant-scoped models as needed
}

/**
 * Get a tenant-scoped Prisma client
 */
export async function getTenantPrisma(): Promise<TenantPrismaClient> {
  const tenantId = await requireTenantId()
  return new TenantPrismaClient(tenantId)
}
