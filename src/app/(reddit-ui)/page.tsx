import type { Metadata } from 'next/types'
import Link from 'next/link'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'

import type { Community, Gallery, Media, RedditPost, User, Vote } from '@/payload-types'
import { getCurrentUser } from '@/utilities/getCurrentUser'
import { Navbar } from './Navbar'
import { PostCardActionsLeft } from './PostCardActionsLeft'
import { SubmitCTA } from './SubmitCTA'

export const dynamic = 'force-dynamic'

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
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

function communitySlug(community: number | Community): string {
  if (typeof community === 'object') return community.slug ?? String(community.id)
  return String(community)
}

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
  const slug = communitySlug(post.community)
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
            <Link href={`/u/${author}`} className="winku-post-card__author-name" style={{ textDecoration: 'none' }}>u/{author}</Link>
            <div className="winku-post-card__meta">
              <Link href={`/c/${slug}`} className="winku-post-card__community-tag">
                c/{slug}
              </Link>
              <span>•</span>
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

function EmptyFeed() {
  return (
    <div className="winku-panel winku-empty">
      <div style={{ fontSize: 44, marginBottom: 14 }}>🏕️</div>
      <h3>Chưa có bài đăng nào</h3>
      <p>Hãy là người đầu tiên chia sẻ hành trình của bạn!</p>
      <Link href="/submit" className="winku-pill-btn">
        Tạo bài đăng đầu tiên
      </Link>
    </div>
  )
}

const SORT_OPTIONS = [
  { key: 'hot', label: '🔥 Nổi bật' },
  { key: 'moi', label: '⭐ Mới nhất' },
  { key: 'top', label: '📈 Hàng đầu' },
  { key: 'tang', label: '🚀 Đang lên' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['key']

function resolveSort(sort: string | undefined): { sortField: string; sinceDate?: string } {
  switch (sort) {
    case 'hot':
      return { sortField: '-upvotes,-createdAt' }
    case 'top':
      return { sortField: '-upvotes' }
    case 'tang': {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      return { sortField: '-upvotes', sinceDate: since }
    }
    default:
      return { sortField: '-createdAt' }
  }
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams
  const currentSort: SortKey = (SORT_OPTIONS.find((o) => o.key === sort)?.key ?? 'moi') as SortKey
  const { sortField, sinceDate } = resolveSort(currentSort)

  const payload = await getPayload({ config: configPromise })
  const currentUser = await getCurrentUser()

  const postWhere: Where = sinceDate
    ? { and: [{ hidden: { not_equals: true } }, { createdAt: { greater_than: sinceDate } }] }
    : { hidden: { not_equals: true } }

  const [communitiesResult, postsResult] = await Promise.all([
    payload.find({
      collection: 'communities',
      depth: 0,
      limit: 10,
      sort: '-createdAt',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'reddit-posts',
      where: postWhere,
      depth: 2,
      limit: 30,
      sort: sortField,
      overrideAccess: true,
    }),
  ])

  const postIds = postsResult.docs.map((p) => p.id)
  const commentsResult =
    postIds.length > 0
      ? await payload.find({
          collection: 'comments',
          where: { post: { in: postIds } },
          limit: 2000,
          depth: 0,
          overrideAccess: true,
        })
      : { docs: [] }

  const commentCounts: Record<number, number> = {}
  for (const c of commentsResult.docs) {
    const postId = typeof c.post === 'object' ? c.post.id : (c.post as number)
    commentCounts[postId] = (commentCounts[postId] ?? 0) + 1
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

  const postCountByCommunity: Record<number, number> = {}
  for (const p of postsResult.docs) {
    const cId = typeof p.community === 'object' ? p.community.id : (p.community as number)
    postCountByCommunity[cId] = (postCountByCommunity[cId] ?? 0) + 1
  }

  const communities = communitiesResult.docs
  const posts = postsResult.docs
  const sortedCommunities = [...communities].sort(
    (a, b) => (postCountByCommunity[b.id] ?? 0) - (postCountByCommunity[a.id] ?? 0),
  )
  const totalPosts = postsResult.totalDocs

  return (
    <div className="winku-page">
      <Navbar username={currentUser?.username ?? null} />

      <div className="winku-container">
        <div className="winku-main-grid">
          <main className="winku-center-feed">
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

            <section className="winku-feed-stack">
              {posts.length === 0 ? (
                <EmptyFeed />
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    commentCount={commentCounts[post.id] ?? 0}
                    isAuthenticated={Boolean(currentUser)}
                    currentVote={postVotes.get(post.id) ?? 0}
                    pagePath={`/?sort=${currentSort}`}
                  />
                ))
              )}
            </section>
          </main>

          <aside className="winku-right-rail">
            <section className="winku-panel" style={{ overflow: 'hidden' }}>
              <div className="winku-community-banner" />
              <div className="winku-community-card__body">
                <div className="winku-community-card__icon">🏔️</div>
                <h3 style={{ margin: '0 0 4px', fontWeight: 800, fontSize: 15 }}>Trekky Community</h3>
                <p style={{ margin: '0 0 14px', color: 'var(--muted-foreground)', fontSize: 13 }}>
                  Nơi kết nối cộng đồng phượt thủ, khám phá thiên nhiên và chia sẻ hành trình.
                </p>
                <div className="winku-stats">
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16 }}>{communities.length}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Cộng đồng</p>
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: 16 }}>{totalPosts}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Bài đăng</p>
                  </div>
                </div>
                <SubmitCTA isAuthenticated={Boolean(currentUser)} className="winku-pill-btn" style={{ width: '100%' }}>
                  Tạo bài đăng
                </SubmitCTA>
              </div>
            </section>

            <section className="winku-panel" style={{ padding: 16 }}>
              <h3 className="winku-panel__title" style={{ marginBottom: 12 }}>
                Cộng đồng gợi ý
              </h3>
              <div>
                {sortedCommunities.slice(0, 6).map((community) => (
                  <div key={community.id} className="winku-community-row">
                    <div
                      className="winku-community-avatar"
                      style={{ background: `hsl(${(community.id * 67 + 140) % 360}deg 50% 40%)` }}
                    >
                      {community.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Link
                        href={`/c/${community.slug}`}
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: 'var(--foreground)',
                          textDecoration: 'none',
                          display: 'block',
                        }}
                      >
                        {community.name}
                      </Link>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-foreground)' }}>
                        {postCountByCommunity[community.id] ?? 0} bài đăng
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="winku-panel" style={{ padding: 14, fontSize: 12, color: 'var(--muted-foreground)' }}>
              <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                Trang chủ
              </Link>{' '}
              •{' '}
              <Link href="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>
                Admin
              </Link>{' '}
              •{' '}
              <Link href="/reddit" style={{ color: 'inherit', textDecoration: 'none' }}>
                Phiên bản cũ
              </Link>
              <div style={{ marginTop: 6 }}>Trekky Community © {new Date().getFullYear()}</div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Trekky - Cộng đồng phượt thủ Việt Nam',
    description: 'Khám phá, kết nối và chia sẻ hành trình phượt thủ cùng cộng đồng Trekky.',
  }
}
