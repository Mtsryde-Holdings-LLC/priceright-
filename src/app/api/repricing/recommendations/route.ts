/**
 * Repricing Recommendations API
 * Handles fetching and accepting repricing recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantId, requireUserId } from '@/lib/tenant'
import { enqueueJob, JobType } from '@/jobs/queue'

/**
 * GET /api/repricing/recommendations
 * Get all active repricing recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await requireTenantId()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const productId = searchParams.get('productId')

    const where: any = {
      tenantId,
      status,
      expiresAt: {
        gte: new Date(), // Only non-expired recommendations
      },
    }

    if (productId) {
      where.productId = productId
    }

    const recommendations = await prisma.repricingRecommendation.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            title: true,
            brand: true,
            costPrice: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('[Repricing API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/repricing/recommendations/:id/accept
 * Accept a repricing recommendation
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = await requireTenantId()
    const userId = await requireUserId()

    const body = await request.json()
    const { recommendationId } = body

    if (!recommendationId) {
      return NextResponse.json(
        { error: 'Missing recommendationId' },
        { status: 400 }
      )
    }

    // Get recommendation
    const recommendation = await prisma.repricingRecommendation.findFirst({
      where: {
        id: recommendationId,
        tenantId, // Ensure tenant isolation
        status: 'pending',
      },
      include: {
        product: true,
      },
    })

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found or already processed' },
        { status: 404 }
      )
    }

    // Update recommendation status
    await prisma.repricingRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: 'accepted',
        appliedAt: new Date(),
      },
    })

    // Enqueue price update job
    await enqueueJob(JobType.PRICE_UPDATE, {
      tenantId,
      productId: recommendation.productId,
      marketplace: recommendation.marketplace,
      newPrice: Number(recommendation.recommendedPrice),
      reason: 'repricing_accepted',
      userId,
    })

    return NextResponse.json({
      success: true,
      message: 'Price update job enqueued',
    })
  } catch (error) {
    console.error('[Repricing API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to accept recommendation' },
      { status: 500 }
    )
  }
}
