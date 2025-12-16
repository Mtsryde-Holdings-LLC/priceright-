/**
 * Health Check Endpoint
 * Used for monitoring and uptime checks
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ]

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    )

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          message: 'Missing environment variables',
          missing: missingEnvVars,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'ok',
        environment: 'ok',
      },
    })
  } catch (error) {
    console.error('[Health Check] Error:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        message: 'Health check failed',
        error: (error as Error).message,
        checks: {
          database: 'failed',
        },
      },
      { status: 500 }
    )
  }
}
