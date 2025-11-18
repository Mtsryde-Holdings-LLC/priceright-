/**
 * Individual Product API Routes
 * GET, PATCH, DELETE for specific products
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantId, requireRole } from '@/lib/tenant'

interface RouteContext {
  params: { id: string }
}

/**
 * GET /api/products/:id
 * Get a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const tenantId = await requireTenantId()
    const { id } = params

    const product = await prisma.product.findFirst({
      where: {
        id,
        tenantId, // Ensures tenant isolation
      },
      include: {
        marketplaceListings: {
          include: {
            marketplaceConnection: true,
          },
        },
        repricingRules: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('[Product API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/products/:id
 * Update a product
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const tenantId = await requireTenantId()
    await requireRole('ADMIN')
    const { id } = params

    const body = await request.json()

    // Verify product exists and belongs to tenant
    const existing = await prisma.product.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('[Product API] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/:id
 * Delete a product
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const tenantId = await requireTenantId()
    await requireRole('ADMIN')
    const { id } = params

    // Verify product exists and belongs to tenant
    const existing = await prisma.product.findFirst({
      where: { id, tenantId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete product (cascade will handle related records)
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Product API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
