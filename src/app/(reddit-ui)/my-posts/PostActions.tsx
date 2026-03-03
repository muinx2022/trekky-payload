'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const GREEN = '#0369a1'

export function PostActions({
  postId,
  isHidden,
  token,
}: {
  postId: number
  isHidden: boolean
  token: string
}) {
  const [hidden, setHidden] = useState(isHidden)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const router = useRouter()

  async function toggleHidden() {
    const nextHidden = !hidden
    setLoading(true)
    try {
      const res = await fetch(`/api/reddit-posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify({ hidden: nextHidden }),
        credentials: 'include',
      })

      if (res.ok) {
        setHidden(nextHidden)
        setToast({
          type: 'success',
          message: nextHidden ? 'Đã ẩn bài viết.' : 'Đã hiển thị lại bài viết.',
        })
        router.refresh()
        return
      }

      const data = await res.json().catch(() => ({}))
      setToast({
        type: 'error',
        message: data?.errors?.[0]?.message ?? 'Cập nhật thất bại. Vui lòng thử lại.',
      })
    } catch {
      setToast({
        type: 'error',
        message: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid var(--border)',
    textDecoration: 'none',
    background: 'transparent',
    transition: 'background .1s',
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <Link href={`/edit-post/${postId}`} style={{ ...btnBase, color: GREEN }}>
          ✏️ Sửa
        </Link>

        <button
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          style={{
            ...btnBase,
            color: hidden ? GREEN : 'var(--muted-foreground)',
            borderColor: hidden ? 'rgba(26,92,56,0.3)' : 'var(--border)',
            background: hidden ? 'rgba(26,92,56,0.06)' : 'transparent',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {hidden ? '👁 Hiện bài' : '🙈 Ẩn bài'}
        </button>
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => !loading && setConfirmOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 2100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--foreground)' }}>
              {hidden ? 'Hiện bài viết?' : 'Ẩn bài viết?'}
            </h3>
            <p style={{ margin: '8px 0 16px', fontSize: 14, color: 'var(--muted-foreground)' }}>
              {hidden
                ? 'Bài viết sẽ hiển thị lại trên hồ sơ và feed công khai.'
                : 'Bài viết sẽ bị ẩn khỏi feed công khai và trang chi tiết.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirmOpen(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 9999,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--foreground)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  await toggleHidden()
                  setConfirmOpen(false)
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 9999,
                  border: 'none',
                  background: GREEN,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Đang xử lý...' : hidden ? 'Hiện bài' : 'Ẩn bài'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 2200,
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: toast.type === 'success' ? GREEN : '#dc2626',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
          }}
        >
          {toast.message}
        </div>
      )}
    </>
  )
}
