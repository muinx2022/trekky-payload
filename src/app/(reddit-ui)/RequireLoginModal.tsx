'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { useLoginModal } from './LoginModalProvider'

const GREEN = '#0369a1'

export function RequireLoginModal({
  title = 'Bạn cần đăng nhập',
  description = 'Vui lòng đăng nhập để tiếp tục.',
}: {
  title?: string
  description?: string
}) {
  const { openLoginModal } = useLoginModal()

  useEffect(() => {
    openLoginModal()
  }, [openLoginModal])

  return (
    <div style={{ minHeight: 'calc(100vh - 48px)', background: '#f0f9ff', padding: 24 }}>
      <div
        style={{
          maxWidth: 520,
          margin: '48px auto 0',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--foreground)' }}>{title}</h1>
        <p style={{ margin: '8px 0 18px', color: 'var(--muted-foreground)', fontSize: 14 }}>{description}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={openLoginModal}
            style={{
              padding: '10px 18px',
              borderRadius: 9999,
              border: 'none',
              background: GREEN,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Đăng nhập
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 18px',
              borderRadius: 9999,
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
