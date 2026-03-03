'use client'

import { useEffect } from 'react'

const THEME_KEY = 'payload-theme'

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function SystemThemeSync() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const applySystemTheme = () => {
      const next = getSystemTheme()
      document.documentElement.setAttribute('data-theme', next)
      window.localStorage.removeItem(THEME_KEY)
    }

    applySystemTheme()

    const onChange = () => applySystemTheme()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return null
}
