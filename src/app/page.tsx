/**
 * Root Page
 * Redirects authenticated users to dashboard, others to login
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
