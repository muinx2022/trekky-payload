import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import type { User } from '@/payload-types'

/**
 * Read the payload-token cookie, verify it locally, and return the Payload user.
 * Avoids the HTTP round-trip to /api/users/me which fails inside Docker.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return null

  try {
    const secret = process.env.PAYLOAD_SECRET
    if (!secret) return null
    const decoded = jwt.verify(token, secret) as { id: number | string; collection: string }
    if (decoded.collection !== 'users') return null

    const payload = await getPayload({ config: configPromise })
    const user = await payload.findByID({
      collection: 'users',
      id: decoded.id,
      overrideAccess: true,
    })
    return (user as User) ?? null
  } catch {
    return null
  }
}
