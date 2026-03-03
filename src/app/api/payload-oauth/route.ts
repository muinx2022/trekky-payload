import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import jwt from 'jsonwebtoken'

import { auth } from '@/auth'
import { oauthUpsert } from '@/utilities/oauthUpsert'
import config from '@payload-config'

// Match Payload CMS default token expiry (2 hours)
const TOKEN_EXPIRY_SECONDS = 7200

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const next = searchParams.get('next') ?? '/'
  // Only allow relative redirects to prevent open redirect attacks
  const redirectTo = next.startsWith('/') ? next : '/'

  try {
    // Read the NextAuth session (validates the short-lived NextAuth JWT cookie)
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.redirect(
        new URL(`/login?toast=oauth-error&next=${encodeURIComponent(redirectTo)}`, req.url),
      )
    }

    const payload = await getPayload({ config })

    // Upsert Payload user from OAuth identity
    const payloadUser = await oauthUpsert(payload, {
      email: session.user.email,
      name: session.user.name ?? null,
      picture: (session as any).picture ?? null,
      provider: (session as any).provider,
      providerAccountId: (session as any).providerAccountId,
    })

    // Sign a Payload-compatible JWT (HS256 with PAYLOAD_SECRET)
    // Token shape matches what Payload sets internally for email/password login.
    // saveToJWT fields on the Users collection: username, roles.
    const secret = process.env.PAYLOAD_SECRET
    if (!secret) {
      throw new Error('PAYLOAD_SECRET is not set')
    }

    const now = Math.floor(Date.now() / 1000)
    const token = jwt.sign(
      {
        id: payloadUser.id,
        email: payloadUser.email,
        collection: 'users',
        username: payloadUser.username,
        roles: payloadUser.roles,
        iat: now,
        exp: now + TOKEN_EXPIRY_SECONDS,
      },
      secret,
      { algorithm: 'HS256' },
    )

    // Set payload-token cookie — same attributes Payload uses itself
    const cookieStore = await cookies()
    cookieStore.set('payload-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY_SECONDS,
    })

    return NextResponse.redirect(new URL(redirectTo, req.url))
  } catch (error) {
    console.error('[payload-oauth] Exchange failed:', error)
    return NextResponse.redirect(
      new URL(`/login?toast=oauth-error&next=${encodeURIComponent(redirectTo)}`, req.url),
    )
  }
}
