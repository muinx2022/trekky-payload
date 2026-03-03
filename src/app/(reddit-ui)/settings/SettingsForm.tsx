'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@/payload-types'

const GREEN = '#0369a1'

export function SettingsForm({ user, token }: { user: User; token: string }) {
  const router = useRouter()

  const [name, setName] = useState(user.name ?? '')
  const [username, setUsername] = useState(user.username ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) { setProfileError('Username không được để trống.'); return }
    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')

    let avatarId: number | undefined

    // Upload avatar if new file selected
    if (avatarFile) {
      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('_payload', JSON.stringify({ alt: username }))
      const uploadRes = await fetch('/api/media', {
        method: 'POST',
        headers: { Authorization: `JWT ${token}` },
        body: formData,
        credentials: 'include',
      })
      if (!uploadRes.ok) {
        const d = await uploadRes.json().catch(() => ({}))
        setProfileError(`Tải ảnh lên thất bại: ${d?.errors?.[0]?.message ?? `HTTP ${uploadRes.status}`}`)
        setProfileLoading(false)
        return
      }
      const { doc } = await uploadRes.json()
      avatarId = doc.id
    }

    const body: Record<string, unknown> = { name, username }
    if (avatarId !== undefined) body.avatar = avatarId

    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
      body: JSON.stringify(body),
      credentials: 'include',
    })

    if (res.ok) {
      setProfileSuccess('Hồ sơ đã được cập nhật!')
      router.refresh()
    } else {
      const d = await res.json().catch(() => ({}))
      setProfileError(d?.errors?.[0]?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.')
    }
    setProfileLoading(false)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword) { setPwError('Vui lòng nhập mật khẩu mới.'); return }
    if (newPassword !== confirmPassword) { setPwError('Mật khẩu xác nhận không khớp.'); return }
    if (newPassword.length < 6) { setPwError('Mật khẩu phải có ít nhất 6 ký tự.'); return }
    setPwLoading(true)
    setPwError('')
    setPwSuccess('')

    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
      body: JSON.stringify({ password: newPassword }),
      credentials: 'include',
    })

    if (res.ok) {
      setPwSuccess('Mật khẩu đã được đổi thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      const d = await res.json().catch(() => ({}))
      setPwError(d?.errors?.[0]?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.')
    }
    setPwLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--muted)',
    fontSize: 14,
    color: 'var(--foreground)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  // Resolve current avatar URL
  const currentAvatarUrl =
    typeof user.avatar === 'object' && user.avatar !== null
      ? (user.avatar as { url?: string | null }).url ?? null
      : null

  const displayAvatar = avatarPreview ?? currentAvatarUrl

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
          Sửa hồ sơ
        </h1>

        {/* ── Profile section ───────────────────────────────── */}
        <section
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div style={{ background: GREEN, padding: '10px 20px' }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0 }}>Thông tin cá nhân</p>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: displayAvatar ? 'transparent' : GREEN,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 28,
                    overflow: 'hidden',
                    border: '3px solid var(--border)',
                    flexShrink: 0,
                  }}
                >
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (username[0] ?? 'U').toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: GREEN,
                    color: '#fff',
                    border: '2px solid var(--card)',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Đổi ảnh đại diện"
                >
                  ✏️
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 2 }}>
                  Ảnh đại diện
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: 12,
                    color: GREEN,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  Thay đổi ảnh…
                </button>
                {avatarFile && (
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                    {avatarFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tên hiển thị
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên của bạn"
                style={inputStyle}
              />
            </div>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="username"
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>
                Hiển thị dưới dạng u/{username || '…'}
              </p>
            </div>

            {/* Email (readonly) */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email
              </label>
              <input
                type="email"
                value={user.email}
                readOnly
                style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>
                Email không thể thay đổi.
              </p>
            </div>

            {profileError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', fontSize: 13, color: '#dc2626' }}>
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(26,92,56,0.08)', border: '1px solid rgba(26,92,56,0.2)', fontSize: 13, color: GREEN }}>
                ✓ {profileSuccess}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={profileLoading}
                style={{
                  padding: '9px 24px',
                  borderRadius: 9999,
                  border: 'none',
                  background: profileLoading ? '#6b9e7e' : GREEN,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: profileLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {profileLoading ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </section>

        {/* ── Password section ──────────────────────────────── */}
        <section
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div style={{ background: '#7c2d12', padding: '10px 20px' }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0 }}>Đổi mật khẩu</p>
          </div>

          <form onSubmit={handlePasswordSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mật khẩu mới *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Xác nhận mật khẩu *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                style={{
                  ...inputStyle,
                  borderColor: confirmPassword && confirmPassword !== newPassword ? '#dc2626' : 'var(--border)',
                }}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Mật khẩu không khớp.</p>
              )}
            </div>

            {pwError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', fontSize: 13, color: '#dc2626' }}>
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(26,92,56,0.08)', border: '1px solid rgba(26,92,56,0.2)', fontSize: 13, color: GREEN }}>
                ✓ {pwSuccess}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={pwLoading}
                style={{
                  padding: '9px 24px',
                  borderRadius: 9999,
                  border: 'none',
                  background: pwLoading ? '#b45309' : '#7c2d12',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: pwLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {pwLoading ? 'Đang đổi…' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
