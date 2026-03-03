import type { Payload } from 'payload'

export type OAuthUserData = {
  email: string
  name: string | null
  picture: string | null
  provider: 'google' | 'github' | 'facebook'
  providerAccountId: string
}

export type UpsertedUser = {
  id: number | string
  email: string
  username: string
  roles: ('admin' | 'moderator' | 'user')[]
}

function deriveBaseUsername(name: string | null, email: string): string {
  const source = name?.trim() || email.split('@')[0]
  return (
    source
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 20) || 'nguoi_dung'
  )
}

async function findUniqueUsername(payload: Payload, base: string): Promise<string> {
  let candidate = base
  for (let attempt = 0; attempt <= 10; attempt++) {
    const existing = await payload.find({
      collection: 'users',
      where: { username: { equals: candidate } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.totalDocs === 0) return candidate
    if (attempt === 10) {
      // Last resort: use timestamp suffix
      return `${base.slice(0, 15)}_${Date.now().toString(36)}`
    }
    candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`
  }
  return candidate
}

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
  let password = ''
  for (let i = 0; i < 32; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

export async function oauthUpsert(payload: Payload, data: OAuthUserData): Promise<UpsertedUser> {
  // Find existing user by email
  const existingResult = await payload.find({
    collection: 'users',
    where: { email: { equals: data.email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existingResult.totalDocs > 0) {
    const user = existingResult.docs[0]
    const patch: Record<string, unknown> = {}

    // Fill in name if missing
    if (data.name && !user.name) patch.name = data.name
    // Record OAuth provider on first OAuth login
    if (!user.oauthProvider) patch.oauthProvider = data.provider
    if (!user.oauthId) patch.oauthId = data.providerAccountId

    if (Object.keys(patch).length > 0) {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: patch,
        overrideAccess: true,
      })
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      roles: (user.roles ?? ['user']) as ('admin' | 'moderator' | 'user')[],
    }
  }

  // Create new user
  const baseUsername = deriveBaseUsername(data.name, data.email)
  const username = await findUniqueUsername(payload, baseUsername)

  const newUser = await payload.create({
    collection: 'users',
    data: {
      email: data.email,
      name: data.name ?? undefined,
      username,
      password: generateRandomPassword(),
      roles: ['user'],
      oauthProvider: data.provider,
      oauthId: data.providerAccountId,
    },
    overrideAccess: true,
  })

  return {
    id: newUser.id,
    email: newUser.email,
    username: newUser.username,
    roles: (newUser.roles ?? ['user']) as ('admin' | 'moderator' | 'user')[],
  }
}
