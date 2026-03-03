'use client'

import React, { createContext, useContext, useEffect, useMemo, useState, Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

const GREEN = '#0369a1'
const REMEMBER_EMAIL_KEY = 'trekky:remember-email'

type OAuthProvider = 'google' | 'github' | 'facebook'

type LoginModalContextType = {
  openLoginModal: () => void
  closeLoginModal: () => void
}

const LoginModalContext = createContext<LoginModalContextType | null>(null)

export function useLoginModal() {
  const ctx = useContext(LoginModalContext)
  if (!ctx) {
    throw new Error('useLoginModal must be used inside LoginModalProvider')
  }
  return ctx
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

const OAUTH_PROVIDERS: {
  id: OAuthProvider
  label: string
  icon: React.ReactNode
  bg: string
  color: string
  border: string
}[] = [
  {
    id: 'google',
    label: 'Tiếp tục với Google',
    icon: <GoogleIcon />,
    bg: '#fff',
    color: '#3c4043',
    border: '#dadce0',
  },
  {
    id: 'github',
    label: 'Tiếp tục với GitHub',
    icon: <GitHubIcon />,
    bg: '#24292f',
    color: '#fff',
    border: '#24292f',
  },
  {
    id: 'facebook',
    label: 'Tiếp tục với Facebook',
    icon: <FacebookIcon />,
    bg: '#1877F2',
    color: '#fff',
    border: '#1877F2',
  },
]

function LoginModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)

  useEffect(() => {
    if (!open) return
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    } else {
      setRememberMe(false)
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
      credentials: 'include',
    })

    if (res.ok) {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email)
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }

      setLoading(false)
      onClose()

      if (pathname === '/login') {
        router.push(nextPath)
      }

      router.refresh()
      return
    }

    const data = await res.json().catch(() => ({}))
    setError(data?.errors?.[0]?.message ?? 'Email hoặc mật khẩu không đúng.')
    setLoading(false)
  }

  async function handleOAuth(provider: OAuthProvider) {
    setOauthLoading(provider)
    const callbackUrl = `/api/payload-oauth?next=${encodeURIComponent(nextPath)}`
    await signIn(provider, { callbackUrl })
    setOauthLoading(null)
  }

  const anyLoading = loading || oauthLoading !== null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '28px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Đăng nhập</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {OAUTH_PROVIDERS.map(({ id, label, icon, bg, color, border }) => (
            <button
              key={id}
              type="button"
              disabled={anyLoading}
              onClick={() => handleOAuth(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: oauthLoading === id ? 'var(--muted)' : bg,
                color: oauthLoading === id ? 'var(--muted-foreground)' : color,
                fontSize: 14,
                fontWeight: 600,
                cursor: anyLoading ? 'not-allowed' : 'pointer',
                opacity: anyLoading && oauthLoading !== id ? 0.55 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {oauthLoading === id ? (
                <span style={{ fontSize: 13 }}>Đang chuyển hướng...</span>
              ) : (
                <>
                  {icon}
                  {label}
                </>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', flexShrink: 0 }}>Hoặc đăng nhập bằng email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--muted)',
              fontSize: 14,
              color: 'var(--foreground)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--muted)',
              fontSize: 14,
              color: 'var(--foreground)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--muted-foreground)',
            }}
          >
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Ghi nhớ đăng nhập
          </label>

          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
                fontSize: 13,
                color: '#dc2626',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 9999,
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--muted-foreground)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={anyLoading}
              style={{
                padding: '9px 18px',
                borderRadius: 9999,
                border: 'none',
                background: loading ? '#075985' : GREEN,
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: anyLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const value = useMemo(
    () => ({
      openLoginModal: () => setOpen(true),
      closeLoginModal: () => setOpen(false),
    }),
    [],
  )

  return (
    <LoginModalContext.Provider value={value}>
      {children}
      <Suspense>
        <LoginModal open={open} onClose={() => setOpen(false)} />
      </Suspense>
    </LoginModalContext.Provider>
  )
}
