import type { Metadata } from 'next/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'

import type { Community, Gallery, Media, RedditPost, User, Vote } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { Navbar } from '../../Navbar'
import { PostCardActionsLeft } from '../../PostCardActionsLeft'

export const dynamic = 'force-dynamic'

const CAT_SORT_OPTIONS = [
  { key: 'hot', label: '🔥 Nổi bật' },
  { key: 'moi', label: '⭐ Mới nhất' },
  { key: 'top', label: '📈 Hàng đầu' },
] as const

type CatSortKey = (typeof CAT_SORT_OPTIONS)[number]['key']

function resolveCatSort(sort: string | undefined): string {
  switch (sort) {
    case 'hot': return '-upvotes,-createdAt'
    case 'top': return '-upvotes'
    default: return '-createdAt'
  }
}

const GREEN = '#0369a1'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 2) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 30) return `${days} ngày trước`
  return `${Math.floor(days / 30)} tháng trước`
}

function authorName(author: number | User): string {
  if (typeof author === 'object') return author.username ?? author.name ?? 'ẩn danh'
  return `user_${author}`
}

async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) return null

  try {
    const res = await fetch(`${getServerSideURL()}/api/users/me`, {
      headers: { Authorization: `JWT ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const { user } = await res.json()
    return user ?? null
  } catch {
    return null
  }
}

function PostCard({
  post,
  commentCount,
  isAuthenticated,
  currentVote = 0,
  pagePath,
}: {
  post: RedditPost
  commentCount: number
  isAuthenticated: boolean
  currentVote?: 1 | -1 | 0
  pagePath: string
}) {
  const author = authorName(post.author)
  const avatarHue = (author.charCodeAt(0) * 37) % 360
  const postHref = `/post/${post.slug}--${post.id}`

  const galleryDoc = post.gallery && typeof post.gallery === 'object' ? (post.gallery as Gallery) : null
  const firstItem = galleryDoc?.items?.[0]
  const firstMedia = firstItem && typeof firstItem === 'object' ? (firstItem as Media) : null
  const thumbUrl = firstMedia?.url ?? null
  const isVideo = firstMedia?.mimeType?.startsWith('video/') ?? false

  const rawText = post.content ? stripHtml(post.content) : ''
  const maxLen = thumbUrl ? 50 : 100
  const preview = rawText.length > maxLen ? `${rawText.slice(0, maxLen)}...` : rawText

  return (
    <article className="winku-panel winku-post-card winku-post-card--with-actions">
      <div className="winku-post-card__actions-col">
        <PostCardActionsLeft
          isAuthenticated={isAuthenticated}
          postHref={postHref}
          postId={post.id}
          pagePath={pagePath}
          commentCount={commentCount}
          likeCount={post.upvotes ?? 0}
          currentVote={currentVote}
        />
      </div>

      <div className="winku-post-card__main-col">
      <div className="winku-post-card__header">
        <div className="winku-post-card__author-avatar" style={{ background: `hsl(${avatarHue}deg 50% 40%)` }}>
          {author[0]?.toUpperCase()}
        </div>
        <div className="winku-post-card__author-info">
          <p className="winku-post-card__author-name">u/{author}</p>
          <div className="winku-post-card__meta">
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="winku-post-card__body">
        <h3 className="winku-post-title">
          <Link href={postHref}>{post.title}</Link>
        </h3>
        {preview && <p className="winku-post-preview">{preview}</p>}
      </div>

      {thumbUrl && (
        <Link href={postHref} className="winku-post-media">
          {isVideo ? (
            <>
              <video src={thumbUrl} muted playsInline preload="metadata" />
              <div className="winku-post-media__play">
                <div className="winku-post-media__play-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5Z" />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <img src={thumbUrl} alt={post.title} loading="lazy" />
          )}
        </Link>
      )}

      </div>
    </article>
  )
}

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { slug } = await params
  const { sort } = await searchParams
  const currentSort: CatSortKey = (CAT_SORT_OPTIONS.find((o) => o.key === sort)?.key ?? 'moi') as CatSortKey
  const sortField = resolveCatSort(currentSort)
  const payload = await getPayload({ config: configPromise })

  const [communityResult, currentUser] = await Promise.all([
    payload.find({
      collection: 'communities',
      where: { slug: { equals: slug } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    }),
    getCurrentUser(),
  ])

  const community = communityResult.docs[0] as Community | undefined
  if (!community) notFound()

  const postsWhere: Where = {
    and: [{ community: { equals: community.id } }, { hidden: { not_equals: true } }],
  }

  const postsResult = await payload.find({
    collection: 'reddit-posts',
    where: postsWhere,
    depth: 2,
    limit: 30,
    sort: sortField,
    overrideAccess: true,
  })

  const posts = postsResult.docs as RedditPost[]
  const postIds = posts.map((p) => p.id)

  const commentsResult =
    postIds.length > 0
      ? await payload.find({
          collection: 'comments',
          where: { post: { in: postIds } },
          depth: 0,
          limit: 2000,
          overrideAccess: true,
        })
      : { docs: [] }

  const commentCounts: Record<number, number> = {}
  for (const c of commentsResult.docs) {
    const pid = typeof c.post === 'object' ? c.post.id : (c.post as number)
    commentCounts[pid] = (commentCounts[pid] ?? 0) + 1
  }

  const postVotes = new Map<number, 1 | -1>()
  if (currentUser && postIds.length > 0) {
    const votesResult = await payload.find({
      collection: 'votes',
      where: {
        and: [
          { user: { equals: currentUser.id } },
          { targetType: { equals: 'post' } },
          { post: { in: postIds } },
        ],
      },
      depth: 0,
      limit: postIds.length,
      user: currentUser,
      overrideAccess: false,
    })
    for (const v of votesResult.docs as Vote[]) {
      const pid = typeof v.post === 'object' && v.post !== null ? v.post.id : (v.post as number)
      if (pid) postVotes.set(pid, v.value as 1 | -1)
    }
  }

  return (
    <div className="winku-page">
      <Navbar username={currentUser?.username ?? null} />

      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', marginTop: 20 }}>
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: GREEN,
              border: '3px solid var(--card)',
              marginTop: -28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {community.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 20, color: 'var(--foreground)', margin: 0 }}>
              {community.name}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>c/{community.slug}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px 20px' }}>
        <div className="winku-page-breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span className="winku-page-breadcrumb__sep">/</span>
          <span className="winku-page-breadcrumb__current">c/{community.name}</span>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: '0 16px 20px',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <section className="winku-panel winku-sortbar">
            {CAT_SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.key}
                href={`?sort=${opt.key}`}
                className={`winku-sort-pill ${currentSort === opt.key ? 'winku-sort-pill--active' : ''}`}
              >
                {opt.label}
              </Link>
            ))}
          </section>

          {posts.length === 0 ? (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '48px 24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏕️</div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)', marginBottom: 8 }}>
                Chưa có bài nào
              </h3>
              <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 16 }}>
                Hãy là người đầu tiên đăng bài trong cộng đồng này!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                commentCount={commentCounts[post.id] ?? 0}
                isAuthenticated={Boolean(currentUser)}
                currentVote={postVotes.get(post.id) ?? 0}
                pagePath={`/c/${slug}?sort=${currentSort}`}
              />
            ))
          )}
        </div>

        <aside style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="winku-panel" style={{ padding: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)', marginBottom: 8 }}>
              Về cộng đồng
            </h3>
            {community.description && (
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 12, lineHeight: 1.6 }}>
                {community.description}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                gap: 20,
                marginBottom: 14,
                paddingBottom: 12,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)', margin: 0 }}>
                  {postsResult.totalDocs}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>Bài đăng</p>
              </div>
            </div>
          </div>

          <Link href="/" style={{ fontSize: 13, color: GREEN, textDecoration: 'none', fontWeight: 600 }}>
            ← Về trang chủ
          </Link>
        </aside>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'communities',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })
  const c = result.docs[0]
  return {
    title: c ? `r/${c.slug} - ${c.name} - Trekky` : 'Cộng đồng - Trekky',
  }
}
