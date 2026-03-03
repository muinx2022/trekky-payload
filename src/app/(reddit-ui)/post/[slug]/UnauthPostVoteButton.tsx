'use client'

import { useLoginModal } from '../../LoginModalProvider'

export function UnauthPostVoteButton() {
  const { openLoginModal } = useLoginModal()

  return (
    <button
      type="button"
      onClick={openLoginModal}
      style={{
        width: 32,
        height: 32,
        borderRadius: 4,
        border: 'none',
        background: 'transparent',
        color: '#0369a1',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title="Thich bai viet"
      aria-label="Thich bai viet"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    </button>
  )
}
