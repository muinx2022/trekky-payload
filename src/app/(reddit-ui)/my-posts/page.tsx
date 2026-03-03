import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Community, RedditPost, User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { Navbar } from '../Navbar'
import { PostActions } from './PostActions'

export const dynamic = 'force-dynamic'

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

function communitySlug(community: number | Community): string {
  if (typeof community === 'object') return community.slug ?? String(community.id)
  return String(community)
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export default async function MyPostsPage() {
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
  const result = await payload.find({
    collection: 'reddit-posts',
    where: { author: { equals: user.id } },
    sort: '-createdAt',
    limit: 50,
    depth: 1,
    overrideAccess: true,
  })

  const posts = result.docs as (RedditPost & { hidden?: boolean })[]
  const visibleCount = posts.filter((p) => !p.hidden).length
  const hiddenCount = posts.filter((p) => p.hidden).length

  return (
    <>
      <Navbar username={user.username ?? null} />
      <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 16px' }}>
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '20px 24px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                Bài viết của tôi
              </h1>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
                u/{user.username} · {visibleCount} hiển thị
                {hiddenCount > 0 && ` · ${hiddenCount} đã ẩn`}
              </p>
            </div>
            <Link
              href="/submit"
              style={{
                padding: '8px 18px',
                borderRadius: 9999,
                background: '#0369a1',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              + Đăng bài mới
            </Link>
          </div>

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
              <div style={{ fontSize: 40, marginBottom: 12 }}>ðŸ“</div>
              <p style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>Chưa có bài viết nào</p>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20 }}>
                Chia sẻ chuyến đi đầu tiên của bạn với cộng đồng!
              </p>
              <Link
                href="/submit"
                style={{
                  padding: '9px 22px',
                  borderRadius: 9999,
                  background: '#0369a1',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Tạo bài đăng đầu tiên
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {posts.map((post) => {
                const score = (post.upvotes ?? 0) - (post.downvotes ?? 0)
                const cSlug = communitySlug(post.community)
                const isHidden = post.hidden === true

                return (
                  <article
                    key={post.id}
                    style={{
                      background: 'var(--card)',
                      border: `1px solid ${isHidden ? 'rgba(0,0,0,0.08)' : 'var(--border)'}`,
                      borderRadius: 8,
                      display: 'flex',
                      opacity: isHidden ? 0.65 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'color-mix(in oklch, var(--muted) 50%, transparent)',
                        borderRadius: '8px 0 0 8px',
                        padding: '12px 10px',
                        minWidth: 52,
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color:
                            score > 0 ? '#0369a1' : score < 0 ? '#dc2626' : 'var(--muted-foreground)',
                        }}
                      >
                        {fmt(score)}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>điểm</span>
                    </div>

                    <div style={{ flex: 1, padding: '12px 16px', minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Link
                          href={`/c/${cSlug}`}
                          style={{ fontSize: 12, fontWeight: 700, color: '#0369a1', textDecoration: 'none' }}
                        >
                          c/{cSlug}
                        </Link>
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                          {timeAgo(post.createdAt)}
                        </span>
                        {isHidden && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '1px 7px',
                              borderRadius: 9999,
                              background: 'rgba(0,0,0,0.08)',
                              color: 'var(--muted-foreground)',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Đã ẩn
                          </span>
                        )}
                      </div>

                      <Link href={`/post/${post.slug}--${post.id}`} style={{ textDecoration: 'none' }}>
                        <h2
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: 'var(--foreground)',
                            marginBottom: 10,
                            lineHeight: 1.4,
                          }}
                        >
                          {post.title}
                        </h2>
                      </Link>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <Link
                          href={`/post/${post.slug}--${post.id}`}
                          style={{
                            fontSize: 12,
                            color: 'var(--muted-foreground)',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          💬 Xem bình luận
                        </Link>

                        <PostActions postId={post.id} isHidden={isHidden} token={token} />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
