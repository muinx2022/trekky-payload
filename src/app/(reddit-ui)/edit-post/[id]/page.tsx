import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Community, Gallery, Media, RedditPost, User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { Navbar } from '../../Navbar'
import { SubmitForm } from '../../submit/SubmitForm'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numericId = Number(id)
  if (isNaN(numericId)) notFound()

  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) redirect('/?toast=login-required')

  const meRes = await fetch(`${getServerSideURL()}/api/users/me`, {
    headers: { Authorization: `JWT ${token}` },
    cache: 'no-store',
  })
  if (!meRes.ok) redirect('/?toast=login-required')

  const { user }: { user: User | null } = await meRes.json()
  if (!user) redirect('/?toast=login-required')

  const payload = await getPayload({ config: configPromise })

  const [postRaw, communitiesResult] = await Promise.all([
    payload
      .findByID({ collection: 'reddit-posts', id: numericId, depth: 2, overrideAccess: true })
      .catch(() => null),
    payload.find({ collection: 'communities', limit: 100, depth: 0, overrideAccess: true }),
  ])

  const post = postRaw as RedditPost | null
  if (!post) notFound()

  const authorId = typeof post.author === 'object' ? post.author.id : post.author
  if (authorId !== user.id && !user.roles?.includes('admin')) redirect('/')

  const communityId =
    typeof post.community === 'object' ? post.community.id.toString() : post.community.toString()

  const galleryDoc = post.gallery && typeof post.gallery === 'object' ? (post.gallery as Gallery) : null
  const galleryId = galleryDoc?.id ?? (typeof post.gallery === 'number' ? post.gallery : null)
  const galleryItems =
    galleryDoc?.items?.map((item) => {
      if (typeof item === 'number') return { id: item, url: null, mimeType: null }
      const m = item as Media
      return { id: m.id, url: m.url ?? null, mimeType: m.mimeType ?? null }
    }) ?? []

  return (
    <>
      <Navbar
        username={user.username ?? null}
      />
      <SubmitForm
        communities={communitiesResult.docs as Community[]}
        token={token}
        username={user.username ?? ''}
        editPost={{
          id: post.id,
          title: post.title,
          content: post.content ?? '',
          communityId,
          slug: post.slug ?? '',
          galleryId,
          galleryItems,
        }}
      />
    </>
  )
}
