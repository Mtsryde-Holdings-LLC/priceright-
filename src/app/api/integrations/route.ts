/**
 * Marketplace Integrations API
 * Handles marketplace connection management
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantId, requireRole } from '@/lib/tenant'
import { AdapterFactory, MarketplaceType } from '@/lib/marketplaces'

/**
 * GET /api/integrations
 * List all marketplace connections
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await requireTenantId()

    const connections = await prisma.marketplaceConnection.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    // Remove sensitive credential data before sending to client
    const sanitizedConnections = connections.map(conn => ({
      ...conn,
      credentials: undefined, // Don't expose credentials to frontend
    }))

    return NextResponse.json({ connections: sanitizedConnections })
  } catch (error) {
    console.error('[Integrations API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/integrations
 * Create a new marketplace connection
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = await requireTenantId()
    await requireRole('ADMIN')

    const body = await request.json()
    const { type, name, credentials } = body

    // Validate required fields
    if (!type || !name || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name, credentials' },
        { status: 400 }
      )
    }

    // Validate marketplace type
    if (!Object.values(MarketplaceType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid marketplace type' },
        { status: 400 }
      )
    }

    // Test the connection before saving
    try {
      const adapter = await AdapterFactory.createAdapter(type, credentials)
      const isConnected = await adapter.testConnection()

      if (!isConnected) {
        return NextResponse.json(
          { error: 'Connection test failed. Please check your credentials.' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: `Connection test failed: ${(error as Error).message}` },
        { status: 400 }
      )
    }

    // Create marketplace connection
    const connection = await prisma.marketplaceConnection.create({
      data: {
        tenantId,
        type,
        name,
        credentials, // In production, encrypt this
        isActive: true,
        status: 'connected',
        lastSyncAt: new Date(),
      },
    })

    // Remove credentials before returning
    const sanitizedConnection = {
      ...connection,
      credentials: undefined,
    }

    return NextResponse.json(
      { connection: sanitizedConnection },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Integrations API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    )
  }
}
