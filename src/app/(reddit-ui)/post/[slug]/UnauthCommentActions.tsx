'use client'

import { useLoginModal } from '../../LoginModalProvider'

export function UnauthCommentActions({ scoreText }: { scoreText: string }) {
  const { openLoginModal } = useLoginModal()

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={openLoginModal}
        title="Thich binh luan"
        className="winku-comment-vote-btn"
        style={{ color: '#0369a1' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 700 }}>Like</span>
      </button>
      <span className="winku-comment-score-pill">{scoreText}</span>
    </div>
  )
}
