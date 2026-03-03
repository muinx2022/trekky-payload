'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import type { Where } from 'payload'

import configPromise from '@payload-config'
import type { User, Vote } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'

async function applyVote(user: User, postID: number, value: 1 | -1) {
  const payload = await getPayload({ config: configPromise })

  const where: Where = {
    and: [
      { user: { equals: user.id } },
      { targetType: { equals: 'post' } },
      { post: { equals: postID } },
    ],
  }

  const existing = await payload.find({
    collection: 'votes',
    where,
    depth: 0,
    limit: 1,
    user,
    overrideAccess: false,
  })

  const existingVote = existing.docs[0] as Vote | undefined

  if (existingVote) {
    if (existingVote.value === value) {
      await payload.delete({ collection: 'votes', id: existingVote.id, user, overrideAccess: false })
      return
    }
    await payload.update({ collection: 'votes', id: existingVote.id, data: { value }, user, overrideAccess: false })
    return
  }

  await payload.create({
    collection: 'votes',
    data: { targetType: 'post', post: postID, value },
    user,
    overrideAccess: false,
    draft: false,
  } as never)
}

export async function votePostCardAction(formData: FormData) {
  const postID = Number(formData.get('postID'))
  const value = Number(formData.get('value'))
  const pagePath = (formData.get('pagePath') as string | null) ?? '/'

  if (!postID || (value !== 1 && value !== -1)) return

  const user = await getCurrentUser()
  if (!user) return

  await applyVote(user, postID, value as 1 | -1)
  revalidatePath(pagePath)
}
