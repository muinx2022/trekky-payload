import type { Metadata } from 'next/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'

import type { Comment, Community, Gallery, Media, RedditPost, User, Vote } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { Navbar } from '../../Navbar'
import { CommentComposerProvider, ReplyComposer, TopCommentComposer } from './CommentComposer'
import { PostGalleryLightbox } from './PostGalleryLightbox'
import { UnauthCommentActions } from './UnauthCommentActions'
import { UnauthPostVoteButton } from './UnauthPostVoteButton'
import { PostActionBar } from '../../PostActionBar'

export const dynamic = 'force-dynamic'

const GREEN = '#0369a1'
const LIKE_RED = '#dc2626'

type CommentNode = Comment & { children: CommentNode[] }

function parseId(param: string): number | null {
  const parts = param.split('--')
  const last = parts[parts.length - 1]
  const n = Number(last)
  return Number.isNaN(n) ? null : n
}

function parsePositiveInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

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

function authorAvatarURL(author: number | User): string | null {
  if (typeof author === 'number') return null
  if (!author.avatar || typeof author.avatar === 'number') return null
  return author.avatar.url ?? null
}

function communitySlug(community: number | Community): string {
  if (typeof community === 'object') return community.slug ?? String(community.id)
  return String(community)
}

function communityName(community: number | Community): string {
  if (typeof community === 'object') return community.name
  return `community_${community}`
}

function mediaURL(media: number | Media): string | null {
  if (typeof media === 'number') return null
  return media.url ?? null
}

function isVideoMedia(media: number | Media): boolean {
  if (typeof media === 'number') return false
  return media.mimeType?.startsWith('video/') ?? false
}

function userAvatarURL(user: User | null): string | null {
  if (!user) return null
  if (!user.avatar || typeof user.avatar === 'number') return null
  return user.avatar.url ?? null
}

async function getCurrentUser(): Promise<{ user: User | null; token: string | null }> {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value ?? null
  if (!token) return { user: null, token: null }

  try {
    const res = await fetch(`${getServerSideURL()}/api/users/me`, {
      headers: { Authorization: `JWT ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) return { user: null, token: null }

    const data = (await res.json()) as { user?: User | null }
    return { user: data.user ?? null, token }
  } catch {
    return { user: null, token: null }
  }
}

function buildTree(comments: Comment[]): CommentNode[] {
  const map = new Map<number, CommentNode>()
  for (const c of comments) map.set(c.id, { ...c, children: [] })

  const roots: CommentNode[] = []
  for (const node of map.values()) {
    const parentId =
      typeof node.parent === 'object' ? node.parent?.id : (node.parent as number | null | undefined)

    if (parentId && map.has(parentId)) {
      map.get(parentId)?.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function sortCommentTree(roots: CommentNode[]): CommentNode[] {
  const sortByCreatedAtDesc = (a: CommentNode, b: CommentNode) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

  const sortBranchChildrenDesc = (nodes: CommentNode[]) => {
    nodes.sort(sortByCreatedAtDesc)
    for (const node of nodes) {
      if (node.children.length > 0) sortBranchChildrenDesc(node.children)
    }
  }

  roots.sort(sortByCreatedAtDesc)
  for (const root of roots) {
    if (root.children.length > 0) sortBranchChildrenDesc(root.children)
  }

  return roots
}

async function applyVote(args: {
  user: User
  targetType: 'post' | 'comment'
  targetID: number
  value: 1 | -1
}) {
  const { targetID, targetType, user, value } = args
  const payload = await getPayload({ config: configPromise })

  const where: Where =
    targetType === 'post'
      ? {
          and: [
            { user: { equals: user.id } },
            { targetType: { equals: 'post' as const } },
            { post: { equals: targetID } },
          ],
        }
      : {
          and: [
            { user: { equals: user.id } },
            { targetType: { equals: 'comment' as const } },
            { comment: { equals: targetID } },
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

  const existingVote = existing.docs[0]

  if (existingVote) {
    if (existingVote.value === value) {
      await payload.delete({
        collection: 'votes',
        id: existingVote.id,
        user,
        overrideAccess: false,
      })
      return
    }

    await payload.update({
      collection: 'votes',
      id: existingVote.id,
      data: { value },
      user,
      overrideAccess: false,
    })
    return
  }

  await payload.create({
    collection: 'votes',
    data:
      targetType === 'post'
        ? {
            targetType: 'post',
            post: targetID,
            value,
          }
        : {
            targetType: 'comment',
            comment: targetID,
            value,
          },
    user,
    overrideAccess: false,
    draft: false,
  } as never)
}

async function votePostAction(formData: FormData) {
  'use server'

  const postID = parsePositiveInt(formData.get('postID'))
  const value = Number(formData.get('value'))
  const postPath = typeof formData.get('postPath') === 'string' ? (formData.get('postPath') as string) : '/'

  if (!postID || (value !== 1 && value !== -1)) return

  const { user } = await getCurrentUser()
  if (!user) return

  await applyVote({
    user,
    targetType: 'post',
    targetID: postID,
    value,
  })

  revalidatePath(postPath)
}

async function voteCommentAction(formData: FormData) {
  'use server'

  const commentID = parsePositiveInt(formData.get('commentID'))
  const value = Number(formData.get('value'))
  const postPath = typeof formData.get('postPath') === 'string' ? (formData.get('postPath') as string) : '/'

  if (!commentID || (value !== 1 && value !== -1)) return

  const { user } = await getCurrentUser()
  if (!user) return

  await applyVote({
    user,
    targetType: 'comment',
    targetID: commentID,
    value,
  })

  revalidatePath(postPath)
}

async function createCommentAction(formData: FormData) {
  'use server'

  const postID = parsePositiveInt(formData.get('postID'))
  const parentID = parsePositiveInt(formData.get('parentID'))
  const content = typeof formData.get('content') === 'string' ? formData.get('content')?.toString().trim() : ''
  const postPath = typeof formData.get('postPath') === 'string' ? (formData.get('postPath') as string) : '/'

  if (!postID || !content) return

  const { user } = await getCurrentUser()
  if (!user) return

  const payload = await getPayload({ config: configPromise })

  if (parentID) {
    const parent = await payload.findByID({
      collection: 'comments',
      id: parentID,
      depth: 0,
      user,
      overrideAccess: false,
    })

    const parentPostID = typeof parent.post === 'object' ? parent.post.id : parent.post
    if (parentPostID !== postID) return
  }

  await payload.create({
    collection: 'comments',
    data: {
      content,
      post: postID,
      ...(parentID ? { parent: parentID } : {}),
    },
    user,
    overrideAccess: false,
    draft: false,
  } as never)

  revalidatePath(postPath)
}

function ActionButton({
  active,
  title,
  children,
}: {
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      title={title}
      className="winku-comment-vote-btn"
      style={{ color: active ? LIKE_RED : GREEN }}
    >
      {children}
    </button>
  )
}

function CommentItem({
  node,
  depth = 0,
  currentUser,
  postID,
  postPath,
  commentVotes,
}: {
  node: CommentNode
  depth?: number
  currentUser: User | null
  postID: number
  postPath: string
  commentVotes: Map<number, 1 | -1>
}) {
  const author = authorName(node.author)
  const authorAvatar = authorAvatarURL(node.author)
  const currentUserAvatar = userAvatarURL(currentUser)
  const likeCount = node.upvotes ?? 0
  const avatarHue = (author.charCodeAt(0) * 37) % 360
  const currentVote = commentVotes.get(node.id)

  return (
    <div className="winku-comment-thread-node" style={{ paddingLeft: depth > 0 ? 16 : 0, marginLeft: depth > 0 ? 16 : 0 }}>
      <div className="winku-comment-item">
        <div
          className="winku-comment-avatar"
          style={{
            background: `hsl(${avatarHue}deg 50% 45%)`,
          }}
        >
          {authorAvatar ? (
            <img src={authorAvatar} alt={`avatar-${author}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            author[0]?.toUpperCase()
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="winku-comment-meta">
            <span className="winku-comment-author">u/{author}</span>
            <span>•</span>
            <span>{timeAgo(node.createdAt)}</span>
          </div>

          <p className="winku-comment-content">
            {node.content}
          </p>

          <div style={{ marginTop: 8 }}>
            <div className="winku-comment-actions-row">
              {currentUser ? (
                <>
                  <form action={voteCommentAction}>
                    <input type="hidden" name="commentID" value={node.id} />
                    <input type="hidden" name="postPath" value={postPath} />
                    <input type="hidden" name="value" value="1" />
                    <ActionButton active={currentVote === 1} title="Like bình luận">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                      </svg>
                      <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700 }}>Like</span>
                    </ActionButton>
                  </form>
                  <span className="winku-comment-score-pill">
                    {fmt(likeCount)}
                  </span>
                </>
              ) : (
                <UnauthCommentActions scoreText={fmt(likeCount)} />
              )}
              <ReplyComposer
                action={createCommentAction}
                postID={postID}
                parentID={node.id}
                postPath={postPath}
                author={author}
                composerKey={`reply-${node.id}`}
                isAuthenticated={Boolean(currentUser)}
                currentUsername={currentUser?.username ?? null}
                currentAvatarURL={currentUserAvatar}
              />
            </div>
          </div>
        </div>
      </div>

      {node.children.length > 0 && (
        <div style={{ marginTop: 10, borderLeft: '2px solid #edf2f7' }}>
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              depth={depth + 1}
              currentUser={currentUser}
              postID={postID}
              postPath={postPath}
              commentVotes={commentVotes}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const numericId = parseId(slug)
  if (numericId === null) notFound()

  const payload = await getPayload({ config: configPromise })

  const [postResult, commentsResult, { user: currentUser }] = await Promise.all([
    payload
      .findByID({ collection: 'reddit-posts', id: numericId, depth: 2, overrideAccess: true })
      .catch(() => null),
    payload.find({
      collection: 'comments',
      where: { post: { equals: numericId } },
      depth: 2,
      limit: 300,
      sort: '-createdAt',
      overrideAccess: true,
    }),
    getCurrentUser(),
  ])

  if (!postResult) notFound()

  const post = postResult as RedditPost
  const canViewHiddenPost = !post.hidden || Boolean(currentUser?.roles?.includes('admin'))

  if (!canViewHiddenPost) notFound()

  const comments = commentsResult.docs as Comment[]
  const commentTree = sortCommentTree(buildTree(comments))
  const likeCount = post.upvotes ?? 0
  const cSlug = communitySlug(post.community)
  const cName = communityName(post.community)
  const author = authorName(post.author)
  const currentUserAvatar = userAvatarURL(currentUser)
  const postPath = `/post/${post.slug}--${post.id}`
  const galleryDoc = post.gallery && typeof post.gallery === 'object' ? (post.gallery as Gallery) : null
  const galleryMediaItems = (galleryDoc?.items ?? [])
    .map((item) => {
      const src = mediaURL(item)
      if (!src) return null
      return {
        src,
        type: isVideoMedia(item) ? ('video' as const) : ('image' as const),
      }
    })
    .filter((item): item is { src: string; type: 'image' | 'video' } => Boolean(item))

  let currentPostVote: 1 | -1 | 0 = 0
  const commentVotes = new Map<number, 1 | -1>()

  if (currentUser) {
    const commentIDs = comments.map((comment) => comment.id)
    const voteOr: Where[] = [
      {
        and: [
          { targetType: { equals: 'post' } },
          { post: { equals: numericId } },
        ],
      },
    ]

    if (commentIDs.length > 0) {
      voteOr.push({
        and: [
          { targetType: { equals: 'comment' } },
          { comment: { in: commentIDs } },
        ],
      })
    }

    const myVotes = await payload.find({
      collection: 'votes',
      where: {
        and: [
          { user: { equals: currentUser.id } },
          { or: voteOr },
        ],
      },
      depth: 0,
      limit: 500,
      user: currentUser,
      overrideAccess: false,
    })

    for (const vote of myVotes.docs as Vote[]) {
      if (vote.targetType === 'post') {
        currentPostVote = vote.value as 1 | -1
      } else if (vote.targetType === 'comment') {
        const commentID =
          vote.comment && typeof vote.comment === 'object' ? vote.comment.id : vote.comment
        if (commentID && typeof commentID === 'number') {
          commentVotes.set(commentID, vote.value as 1 | -1)
        }
      }
    }
  }

  return (
    <div className="winku-page">
      <Navbar username={currentUser?.username ?? null} avatarURL={currentUserAvatar} />

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px 20px' }}>
        <div className="winku-page-breadcrumb">
          <Link href="/">Trang chủ</Link>
          <span className="winku-page-breadcrumb__sep">/</span>
          <Link href={`/c/${cSlug}`}>c/{cName}</Link>
          <span className="winku-page-breadcrumb__sep">/</span>
          <span className="winku-page-breadcrumb__current">{post.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px 20px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex' }}>
            <div className="winku-post-card__actions-col" style={{ borderRadius: '8px 0 0 8px' }}>
              <PostActionBar
                isAuthenticated={Boolean(currentUser)}
                commentCount={comments.length}
                likeCount={likeCount}
                postHref={postPath}
                commentHref="#comments"
                likeSlot={
                  currentUser ? (
                    <form action={votePostAction}>
                      <input type="hidden" name="postID" value={post.id} />
                      <input type="hidden" name="postPath" value={postPath} />
                      <input type="hidden" name="value" value="1" />
                      <button
                        type="submit"
                        title="Like bài viết"
                        className="winku-post-card__action-btn winku-post-card__action-btn--like"
                        style={{ background: currentPostVote === 1 ? 'rgba(220,38,38,0.12)' : undefined, color: currentPostVote === 1 ? LIKE_RED : undefined }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={currentPostVote === 1 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
                      </button>
                    </form>
                  ) : (
                    <UnauthPostVoteButton />
                  )
                }
              />
            </div>

            <div style={{ flex: 1, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 10, flexWrap: 'wrap' }}>
                <Link href={`/c/${cSlug}`} style={{ fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}>c/{cSlug}</Link>
                <span>•</span>
                <span>Đăng bởi u/{author}</span>
                <span>•</span>
                <span>{timeAgo(post.createdAt)}</span>
              </div>

              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16, lineHeight: 1.4 }}>
                {post.title}
              </h1>

              {post.content && (
                <div
                  className="post-content"
                  style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--foreground)', marginBottom: 16 }}
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              )}

              {galleryMediaItems.length > 0 && <PostGalleryLightbox items={galleryMediaItems} />}

            </div>
          </div>

          <div id="comments" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px' }}>
            <CommentComposerProvider>
              <div style={{ marginBottom: 24 }}>
                <TopCommentComposer
                  action={createCommentAction}
                  postID={post.id}
                  postPath={postPath}
                  username={currentUser?.username ?? null}
                  avatarURL={currentUserAvatar}
                  composerKey="top-comment"
                />
              </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>{comments.length} bình luận</span>
            </div>

              {commentTree.length === 0 ? (
                <p style={{ fontSize: 14, color: 'var(--muted-foreground)', textAlign: 'center', padding: '24px 0' }}>
                  Chưa có bình luận nào. Hãy là người đầu tiên!
                </p>
              ) : (
                <div>
              {commentTree.map((node) => (
                    <CommentItem key={node.id} node={node} currentUser={currentUser} postID={post.id} postPath={postPath} commentVotes={commentVotes} />
                  ))}
                </div>
              )}
            </CommentComposerProvider>
          </div>
        </div>

        <aside style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="winku-panel" style={{ overflow: 'hidden' }}>
            <div className="winku-community-banner" />
            <div className="winku-community-card__body">
              <div className="winku-community-card__icon">{cName[0]?.toUpperCase()}</div>
              <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 4, color: 'var(--foreground)' }}>c/{cName}</h3>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12 }}>{cName}</p>
              <Link href={`/c/${cSlug}`} className="winku-pill-btn" style={{ width: '100%' }}>
                Xem cộng đồng
              </Link>
            </div>
          </div>

          <div className="winku-panel" style={{ padding: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>
              Tác giả
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                {author[0]?.toUpperCase()}
              </div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)', margin: 0 }}>u/{author}</p>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 8, marginBottom: 0 }}>
              Đăng lúc {timeAgo(post.createdAt)}
            </p>
          </div>

          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: GREEN, textDecoration: 'none', fontWeight: 600 }}>
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
  const numericId = parseId(slug)
  if (numericId === null) return { title: 'Bài đăng - Trekky' }

  const payload = await getPayload({ config: configPromise })
  const post = await payload
    .findByID({ collection: 'reddit-posts', id: numericId, depth: 0, overrideAccess: true })
    .catch(() => null)

  return { title: post ? `${post.title} - Trekky` : 'Bài đăng - Trekky' }
}
