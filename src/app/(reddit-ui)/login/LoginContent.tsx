'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

import { useLoginModal } from '../LoginModalProvider'

const GREEN = '#0369a1'

export default function LoginContent() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/'
  const { openLoginModal } = useLoginModal()

  useEffect(() => {
    openLoginModal()
  }, [openLoginModal])

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', padding: 24 }}>
      <div
        style={{
          maxWidth: 520,
          margin: '56px auto 0',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--foreground)' }}>Đăng nhập để tiếp tục</h1>
        <p style={{ margin: '8px 0 18px', color: 'var(--muted-foreground)', fontSize: 14 }}>
          Modal đăng nhập đã được mở. Sau khi đăng nhập, bạn sẽ được chuyển tới: <b>{nextPath}</b>
        </p>

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
            Mở lại modal đăng nhập
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
