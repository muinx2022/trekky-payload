'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useLoginModal } from './LoginModalProvider'

type MeResponse = {
  user?: {
    avatar?: { url?: string | null } | number | null
  } | null
}

function avatarFromMe(data: MeResponse): string | null {
  const avatar = data.user?.avatar
  if (!avatar || typeof avatar === 'number') return null
  return avatar.url ?? null
}

export function NavUser({
  username,
  avatarURL = null,
}: {
  username: string | null
  avatarURL?: string | null
}) {
  const router = useRouter()
  const { openLoginModal } = useLoginModal()
  const [open, setOpen] = useState(false)
  const [clientAvatarURL, setClientAvatarURL] = useState<string | null>(avatarURL)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setClientAvatarURL(avatarURL)
  }, [avatarURL])

  useEffect(() => {
    if (!username || clientAvatarURL) return
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/users/me?depth=1', { credentials: 'include' })
        if (!res.ok) return
        const data = (await res.json()) as MeResponse
        if (!alive) return
        setClientAvatarURL(avatarFromMe(data))
      } catch {
        // noop
      }
    })()

    return () => {
      alive = false
    }
  }, [username, clientAvatarURL])

  async function logout() {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  if (!username) {
    return (
      <div className="winku-user-shell">
        <button type="button" onClick={openLoginModal} className="winku-login-btn">
          Đăng nhập
        </button>
      </div>
    )
  }

  const menuItems = [
    { href: '/submit', icon: '✍️', label: 'Đăng bài mới' },
    { href: '/my-posts', icon: '📋', label: 'Bài viết của tôi' },
    { href: '/settings', icon: '⚙️', label: 'Sửa hồ sơ' },
  ]

  return (
    <div ref={ref} className="winku-user-shell">
      <button onClick={() => setOpen((v) => !v)} className="winku-user-toggle">
        <div className="winku-avatar" style={{ background: '#fff', color: '#0369a1', width: 30, height: 30, overflow: 'hidden' }}>
          {clientAvatarURL ? (
            <img src={clientAvatarURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            username[0]?.toUpperCase()
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="winku-user-menu">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>u/{username}</div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>Đã đăng nhập</div>
          </div>

          {menuItems.map(({ href, icon, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{icon}</span>
              {label}
            </Link>
          ))}

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

          <button
            onClick={logout}
            style={{
              color: '#dc2626',
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>🚪</span>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}
