import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Cloudflare tunnel may pass the original host via x-forwarded-host
  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host') || ''

  const pathname = request.nextUrl.pathname

  // Rewrite admin.* subdomain requests to /admin path
  // Exclude /api/ paths to avoid breaking Payload's REST API calls
  if (host.startsWith('admin.') && !pathname.startsWith('/admin') && !pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone()
    const suffix = pathname === '/' ? '' : pathname
    url.pathname = '/admin' + suffix
    return NextResponse.rewrite(url)
  }

  // Block direct access to /admin on the main domain — redirect to admin subdomain
  if (!host.startsWith('admin.') && pathname.startsWith('/admin')) {
    const adminHost = host.replace(/^[^.]+\./, 'admin.')
    const suffix = pathname.replace(/^\/admin/, '') || '/'
    return NextResponse.redirect(`https://${adminHost}${suffix}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|public/).*)',
  ],
}
