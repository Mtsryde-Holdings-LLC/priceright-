/**
 * Products API Route
 * Handles product CRUD operations with tenant isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantId, requireRole } from '@/lib/tenant'

/**
 * GET /api/products
 * List all products for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await requireTenantId()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { tenantId }

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          marketplaceListings: {
            include: {
              marketplaceConnection: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('[Products API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = await requireTenantId()
    await requireRole('ADMIN') // Only admins can create products

    const body = await request.json()
    const {
      sku,
      title,
      description,
      brand,
      category,
      costPrice,
      totalInventory,
      imageUrl,
    } = body

    // Validate required fields
    if (!sku || !title || !costPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: sku, title, costPrice' },
        { status: 400 }
      )
    }

    // Check if SKU already exists for this tenant
    const existing = await prisma.product.findUnique({
      where: {
        tenantId_sku: {
          tenantId,
          sku,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Product with this SKU already exists' },
        { status: 400 }
      )
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        tenantId,
        sku,
        title,
        description,
        brand,
        category,
        costPrice,
        totalInventory: totalInventory || 0,
        imageUrl,
        isActive: true,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('[Products API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
