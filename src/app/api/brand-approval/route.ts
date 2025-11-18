/**
 * Brand Approval API
 * Handles brand approval requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTenantId, requireUserId } from '@/lib/tenant'

/**
 * GET /api/brand-approval
 * List all brand approval requests
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await requireTenantId()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { tenantId }

    if (status) {
      where.status = status
    }

    const requests = await prisma.brandApprovalRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        files: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('[Brand Approval API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brand approval requests' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/brand-approval
 * Create a new brand approval request
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = await requireTenantId()
    const userId = await requireUserId()

    const body = await request.json()
    const {
      brandName,
      targetMarketplaces,
      productIds,
      notes,
      files, // Array of file upload data
    } = body

    // Validate required fields
    if (!brandName || !targetMarketplaces || targetMarketplaces.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: brandName, targetMarketplaces' },
        { status: 400 }
      )
    }

    // Create brand approval request
    const request_result = await prisma.brandApprovalRequest.create({
      data: {
        tenantId,
        userId,
        brandName,
        targetMarketplaces,
        productIds: productIds || [],
        notes,
        status: 'DRAFT',
      },
    })

    // Create file records if files are provided
    if (files && files.length > 0) {
      await prisma.brandApprovalFile.createMany({
        data: files.map((file: any) => ({
          requestId: request_result.id,
          fileType: file.fileType,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
        })),
      })
    }

    // Fetch the complete request with files
    const completeRequest = await prisma.brandApprovalRequest.findUnique({
      where: { id: request_result.id },
      include: {
        files: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      { request: completeRequest },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Brand Approval API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create brand approval request' },
      { status: 500 }
    )
  }
}
