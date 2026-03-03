import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React, { Suspense } from 'react'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import { LoginModalProvider } from './LoginModalProvider'
import { AuthToastFromQuery } from './AuthToastFromQuery'
import { SystemThemeSync } from './SystemThemeSync'

import '../(frontend)/globals.css'
import './winku.css'

export default function RedditLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="vi" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        <link href="/logo.png" rel="apple-touch-icon" />
      </head>
      <body>
        <Providers>
          <SystemThemeSync />
          <LoginModalProvider>
            <Suspense>
              <AuthToastFromQuery />
            </Suspense>
            {children}
          </LoginModalProvider>
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
}
