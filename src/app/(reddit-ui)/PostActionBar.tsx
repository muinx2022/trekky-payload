'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

import { useLoginModal } from './LoginModalProvider'

type Props = {
  isAuthenticated: boolean
  commentCount: number
  likeCount?: number
  postHref: string
  commentHref?: string
  likeSlot?: ReactNode
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function PostActionBar({ isAuthenticated, commentCount, likeCount, postHref, commentHref, likeSlot }: Props) {
  const { openLoginModal } = useLoginModal()
  const storageKey = `trekky:saved:${postHref}`
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const href = commentHref ?? postHref

  useEffect(() => {
    setSaved(localStorage.getItem(storageKey) === '1')
  }, [storageKey])

  function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.origin + postHref : postHref
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function handleSave() {
    if (!isAuthenticated) {
      openLoginModal()
      return
    }
    setSaved((v) => {
      const next = !v
      if (next) localStorage.setItem(storageKey, '1')
      else localStorage.removeItem(storageKey)
      return next
    })
  }

  const commentBtn = isAuthenticated ? (
    <Link href={href} className="winku-post-card__action-btn winku-post-card__action-btn--comment">
      <CommentIcon />
      <span>{commentCount}</span>
    </Link>
  ) : (
    <button
      type="button"
      onClick={openLoginModal}
      className="winku-post-card__action-btn winku-post-card__action-btn--comment"
    >
      <CommentIcon />
      <span>{commentCount}</span>
    </button>
  )

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {likeSlot}
        {likeCount !== undefined && (
          <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--foreground)' }}>
            {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
          </span>
        )}
      </div>
      {commentBtn}
      <button
        type="button"
        title={copied ? 'Đã sao chép!' : 'Chia sẻ'}
        onClick={handleShare}
        className="winku-post-card__action-btn"
        style={{ color: copied ? '#0369a1' : undefined }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
        </svg>
      </button>
      <button
        type="button"
        title={saved ? 'Bỏ lưu' : 'Lưu bài'}
        onClick={handleSave}
        className="winku-post-card__action-btn"
        style={{ color: saved ? '#0369a1' : undefined }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </>
  )
}
