/**
 * Next.js Middleware
 * Handles authentication and multi-tenancy checks
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/api/auth']

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/products', '/inventory', '/repricing', '/brand-approval', '/integrations', '/settings']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Add tenant context to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-tenant-id', token.tenantId as string)
    response.headers.set('x-user-id', token.id as string)
    response.headers.set('x-user-role', token.role as string)

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
