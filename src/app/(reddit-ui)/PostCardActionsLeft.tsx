'use client'

import { useLoginModal } from './LoginModalProvider'
import { PostActionBar } from './PostActionBar'
import { votePostCardAction } from './voteActions'

const LIKE_RED = '#dc2626'
const LIKE_BLUE = '#0369a1'

type PostCardActionsLeftProps = {
  isAuthenticated: boolean
  postHref: string
  postId: number
  pagePath: string
  commentCount: number
  likeCount: number
  currentVote?: 1 | -1 | 0
}

export function PostCardActionsLeft({
  isAuthenticated,
  postHref,
  postId,
  pagePath,
  commentCount,
  likeCount,
  currentVote = 0,
}: PostCardActionsLeftProps) {
  const { openLoginModal } = useLoginModal()
  const liked = currentVote === 1

  const likeSlot = isAuthenticated ? (
    <form action={votePostCardAction}>
      <input type="hidden" name="postID" value={postId} />
      <input type="hidden" name="pagePath" value={pagePath} />
      <input type="hidden" name="value" value="1" />
      <button
        type="submit"
        className="winku-post-card__action-btn winku-post-card__action-btn--like"
        style={{
          background: liked ? 'rgba(220,38,38,0.12)' : undefined,
          color: liked ? LIKE_RED : LIKE_BLUE,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      </button>
    </form>
  ) : (
    <button
      type="button"
      onClick={openLoginModal}
      className="winku-post-card__action-btn winku-post-card__action-btn--like"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    </button>
  )

  return (
    <PostActionBar
      isAuthenticated={isAuthenticated}
      commentCount={commentCount}
      likeCount={likeCount}
      postHref={postHref}
      likeSlot={likeSlot}
    />
  )
}
