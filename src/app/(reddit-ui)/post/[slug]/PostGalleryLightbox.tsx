'use client'

import { useEffect, useMemo, useState } from 'react'

type GalleryItem = {
  src: string
  type: 'image' | 'video'
}

export function PostGalleryLightbox({ items }: { items: GalleryItem[] }) {
  const [open, setOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const imageItems = useMemo(() => items.filter((item) => item.type === 'image'), [items])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
      if (event.key === 'ArrowLeft') {
        setActiveImageIndex((prev) => (prev - 1 + imageItems.length) % imageItems.length)
        return
      }
      if (event.key === 'ArrowRight') {
        setActiveImageIndex((prev) => (prev + 1) % imageItems.length)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, imageItems.length])

  if (!items.length) return null

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {items.map((item, index) => {
          if (item.type === 'video') {
            return (
              <video
                key={`media-${index}`}
                src={item.src}
                controls
                style={{ width: '100%', maxWidth: 960, borderRadius: 8, background: '#111' }}
              />
            )
          }

          const imageIndex = imageItems.findIndex((img) => img.src === item.src)

          return (
            <button
              key={`media-${index}`}
              type="button"
              onClick={() => {
                setActiveImageIndex(imageIndex >= 0 ? imageIndex : 0)
                setOpen(true)
              }}
              style={{
                border: 'none',
                padding: 0,
                cursor: 'zoom-in',
                background: 'transparent',
              }}
            >
              <img
                src={item.src}
                alt=""
                style={{ width: '100%', maxWidth: 1280, borderRadius: 8, display: 'block' }}
              />
            </button>
          )
        })}
      </div>

      {open && imageItems.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.82)',
            zIndex: 2200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setOpen(false)
            }}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'rgba(0,0,0,0.35)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ×
          </button>

          {imageItems.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setActiveImageIndex((prev) => (prev - 1 + imageItems.length) % imageItems.length)
              }}
              style={{
                position: 'absolute',
                left: 12,
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 22,
              }}
            >
              ‹
            </button>
          )}

          <img
            src={imageItems[activeImageIndex]?.src}
            alt=""
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '86vh',
              borderRadius: 10,
              objectFit: 'contain',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            }}
          />

          {imageItems.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setActiveImageIndex((prev) => (prev + 1) % imageItems.length)
              }}
              style={{
                position: 'absolute',
                right: 12,
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 22,
              }}
            >
              ›
            </button>
          )}

          {imageItems.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 12px',
                borderRadius: 9999,
                background: 'rgba(0,0,0,0.35)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {activeImageIndex + 1}/{imageItems.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
