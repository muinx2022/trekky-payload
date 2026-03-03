'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

const GREEN = '#0369a1'

export function AuthToastFromQuery() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)

  const toastType = searchParams.get('toast')
  const message = useMemo(() => {
    if (toastType === 'login-required') return 'Vui lòng đăng nhập để tiếp tục'
    if (toastType === 'oauth-error') return 'Đăng nhập bằng mạng xã hội thất bại. Vui lòng thử lại.'
    return ''
  }, [toastType])

  useEffect(() => {
    if (!message) return
    setVisible(true)

    const params = new URLSearchParams(searchParams.toString())
    params.delete('toast')
    const nextURL = params.size > 0 ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextURL)

    const timer = window.setTimeout(() => setVisible(false), 2600)
    return () => window.clearTimeout(timer)
  }, [message, pathname, router, searchParams])

  if (!visible || !message) return null

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 2100,
        background: GREEN,
        color: '#fff',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 14,
        fontWeight: 600,
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
      }}
    >
      {message}
    </div>
  )
}
