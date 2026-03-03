import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Cloudflare tunnel may pass the original host via x-forwarded-host
  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host') || ''

  // Rewrite admin.* subdomain requests to /admin path
  if (host.startsWith('admin.') && !request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    const suffix = request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname
    url.pathname = '/admin' + suffix
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|public/).*)',
  ],
}
