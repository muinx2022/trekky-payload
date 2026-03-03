import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="Trekky Logo"
      width={120}
      height={40}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('w-auto h-[40px]', className)}
      src="/logo.png"
      style={{ filter: 'brightness(0) invert(1)' }}
    />
  )
}
