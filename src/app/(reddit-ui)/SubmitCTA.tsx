'use client'

import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'

import { useLoginModal } from './LoginModalProvider'

type SubmitCTAProps = {
  isAuthenticated: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function SubmitCTA({ isAuthenticated, className, style, children }: SubmitCTAProps) {
  const { openLoginModal } = useLoginModal()

  if (isAuthenticated) {
    return (
      <Link href="/submit" className={className} style={style}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={openLoginModal} className={className} style={style}>
      {children}
    </button>
  )
}
