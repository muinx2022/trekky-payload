import Link from 'next/link'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Gallery, Media, RedditPost, User, Vote } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { Navbar } from '../../Navbar'
import { PostCardActionsLeft } from '../../PostCardActionsLeft'

export const dynamic = 'force-dynamic'

const GREEN = '#0369a1'

const SORT_OPTIONS = [
  { key: 'moi', label: '⭐ Mới nhất' },
  { key: 'top', label: '📈 Hàng đầu' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['key']

function resolveSort(sort: string | undefined): string {
  switch (sort) {
    case 'top': return '-upvotes'
    default: return '-createdAt'
  }
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

function communitySlug(community: number | { slug?: string; id: number }): string {
  if (typeof community === 'object') return community.slug ?? String(community.id)
  return String(community)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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
  const cSlug = communitySlug(post.community as number | { slug?: string; id: number })
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
          <div className="winku-post-card__meta" style={{ marginBottom: 4 }}>
            <Link href={`/c/${cSlug}`} className="winku-post-card__community-tag">c/{cSlug}</Link>
            <span>•</span>
            <span>{timeAgo(post.createdAt)}</span>
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

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 0 2px' }}>
            {(post.tags as { id: number; name: string; slug: string }[]).map((tag) => (
              <a key={tag.id} href={`/tag/${tag.slug ?? tag.name}`} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 999,
                background: 'var(--muted)', border: '1px solid var(--border)',
                color: 'var(--muted-foreground)', fontWeight: 500, textDecoration: 'none',
              }}>
                #{tag.slug ?? tag.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export default async function UserPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { username } = await params
  const { sort } = await searchParams
  const currentSort: SortKey = (SORT_OPTIONS.find((o) => o.key === sort)?.key ?? 'moi') as SortKey
  const sortField = resolveSort(currentSort)

  const payload = await getPayload({ config: configPromise })

  const [userResult, currentUser] = await Promise.all([
    payload.find({
      collection: 'users',
      where: { username: { equals: username } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
    getCurrentUser(),
  ])

  const profileUser = userResult.docs[0] as User | undefined
  if (!profileUser) notFound()

  const postsResult = await payload.find({
    collection: 'reddit-posts',
    where: {
      and: [
        { author: { equals: profileUser.id } },
        { hidden: { not_equals: true } },
      ],
    },
    depth: 2,
    limit: 30,
    sort: sortField,
    overrideAccess: true,
  })

  const posts = postsResult.docs as RedditPost[]
  const postIds = posts.map((p) => p.id)

  const commentsResult = postIds.length > 0
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
      const pid = typeof v.post === 'object' && v.post !== null ? (v.post as RedditPost).id : (v.post as number)
      if (pid) postVotes.set(pid, v.value as 1 | -1)
    }
  }

  const avatarHue = (username.charCodeAt(0) * 37) % 360
  const isOwnProfile = currentUser?.id === profileUser.id
  const pagePath = `/u/${username}?sort=${currentSort}`

  return (
    <div className="winku-page">
      <Navbar username={currentUser?.username ?? null} />

      {/* Header banner */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', marginTop: 20 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `hsl(${avatarHue}deg 50% 40%)`,
            border: '3px solid var(--card)', marginTop: -28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 22, flexShrink: 0,
          }}>
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 20, color: 'var(--foreground)', margin: 0 }}>
              u/{username}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>
              Tham gia {new Date(profileUser.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })}
            </p>
          </div>
          {isOwnProfile && (
            <Link href="/settings" style={{
              marginLeft: 'auto', fontSize: 13, fontWeight: 600,
              color: GREEN, textDecoration: 'none',
            }}>
              Chỉnh sửa hồ sơ
            </Link>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px 20px' }}>
        <div className="winku-page-breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span className="winku-page-breadcrumb__sep">/</span>
          <span className="winku-page-breadcrumb__current">u/{username}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px 20px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Posts column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <section className="winku-panel winku-sortbar">
            {SORT_OPTIONS.map((opt) => (
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
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '48px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏕️</div>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)', marginBottom: 8 }}>
                Chưa có bài nào
              </h3>
              <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>
                {isOwnProfile ? 'Bạn chưa đăng bài nào.' : 'Người dùng này chưa đăng bài.'}
              </p>
              {isOwnProfile && (
                <Link href="/submit" style={{
                  display: 'inline-block', marginTop: 12,
                  padding: '8px 20px', borderRadius: 9999,
                  background: GREEN, color: '#fff',
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                }}>
                  Đăng bài đầu tiên
                </Link>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                commentCount={commentCounts[post.id] ?? 0}
                isAuthenticated={Boolean(currentUser)}
                currentVote={postVotes.get(post.id) ?? 0}
                pagePath={pagePath}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <aside style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="winku-panel" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `hsl(${avatarHue}deg 50% 40%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0,
              }}>
                {username[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)', margin: 0 }}>u/{username}</p>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
                  {new Date(profileUser.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)', margin: 0 }}>
                  {postsResult.totalDocs}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>Bài đăng</p>
              </div>
            </div>
            {isOwnProfile && (
              <Link href="/settings" style={{
                display: 'block', textAlign: 'center',
                padding: '8px 0', borderRadius: 9999,
                background: GREEN, color: '#fff',
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>
                Chỉnh sửa hồ sơ
              </Link>
            )}
          </div>

          <Link href="/" style={{ fontSize: 13, color: GREEN, textDecoration: 'none', fontWeight: 600 }}>
            ← Về trang chủ
          </Link>
        </aside>
      </div>
    </div>
  )
}
