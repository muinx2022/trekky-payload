'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TiptapLink from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'

import type { Community } from '@/payload-types'
import { vietnameseSlug } from '@/utilities/vietnameseSlug'

const GREEN = '#0369a1'
const MAX_IMAGE_WIDTH = 1280
const MAX_VIDEO_DURATION_SECONDS = 60
const RECOMMENDED_VIDEO_WIDTH = 960
type Tab = 'text' | 'media'

type EditPost = {
  id: number
  title: string
  content: string
  communityId: string
  slug: string
  galleryId?: number | null
  galleryItems?: Array<{ id: number; url: string | null; mimeType: string | null }>
}

function detectTab(content: string): Tab {
  const t = content.trim()
  if (/^<img /i.test(t) || /^<video /i.test(t)) return 'media'
  return 'text'
}

function parseMediaState(content: string) {
  const imgMatch = content.match(/<img src="([^"]*)"[^>]*>/)
  const capMatch = content.match(/<p>(.*?)<\/p>/)
  return { url: imgMatch?.[1] ?? '', caption: capMatch?.[1] ?? '' }
}



async function imageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Không đọc được ảnh.'))
      img.src = url
    })
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function cropImageToMaxWidth(file: File, maxWidth: number): Promise<File> {
  const image = await imageFromFile(file)
  if (image.naturalWidth <= maxWidth) return file

  const sx = Math.floor((image.naturalWidth - maxWidth) / 2)
  const sy = 0
  const sw = maxWidth
  const sh = image.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = maxWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, maxWidth, image.naturalHeight)

  const outputType = file.type || 'image/webp'
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, 0.92)
  })
  if (!blob) return file

  return new File([blob], file.name, { type: blob.type || outputType })
}

async function videoMeta(file: File): Promise<{ duration: number }> {
  const url = URL.createObjectURL(file)
  try {
    const meta = await new Promise<{ duration: number }>((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => resolve({ duration: video.duration })
      video.onerror = () => reject(new Error('Không đọc được video.'))
      video.src = url
    })
    return meta
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function trimVideoToMaxDuration(file: File, maxDuration: number): Promise<File> {
  const meta = await videoMeta(file)
  if (meta.duration <= maxDuration) return file

  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.src = url
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Không thể mở video để cắt.'))
    })

    const capture = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream
    const stream = capture?.call(video)
    if (!stream || typeof MediaRecorder === 'undefined') return file

    const supportedMimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm'

    const recorder = new MediaRecorder(stream, { mimeType: supportedMimeType })
    const chunks: Blob[] = []

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data)
    }

    await new Promise<void>((resolve, reject) => {
      let stopped = false

      const stopAll = () => {
        if (stopped) return
        stopped = true
        if (recorder.state !== 'inactive') recorder.stop()
      }

      recorder.onerror = () => reject(new Error('Lỗi khi cắt video.'))
      recorder.onstop = () => resolve()

      video.currentTime = 0
      recorder.start(250)
      void video.play().catch(() => {
        stopAll()
      })

      const timeout = window.setTimeout(() => stopAll(), maxDuration * 1000)
      video.ontimeupdate = () => {
        if (video.currentTime >= maxDuration) {
          window.clearTimeout(timeout)
          stopAll()
        }
      }
    })

    const blob = new Blob(chunks, { type: supportedMimeType })
    if (!blob.size) return file

    const baseName = file.name.replace(/\.[^/.]+$/, '')
    return new File([blob], `${baseName}-trimmed.webm`, { type: supportedMimeType })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Toolbar button

function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: '4px 8px',
        borderRadius: 4,
        border: 'none',
        background: active ? 'rgba(26,92,56,0.12)' : 'transparent',
        color: active ? GREEN : '#1c1c1c',
        fontWeight: active ? 700 : 400,
        fontSize: 13,
        cursor: 'pointer',
        minWidth: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, background: '#edeff1', alignSelf: 'stretch', margin: '0 2px' }} />
}

// Tiptap toolbar

function Toolbar({
  editor,
  onUploadMedia,
}: {
  editor: Editor | null
  onUploadMedia: (files: File[]) => Promise<void>
}) {
  const uploadInputRef = useRef<HTMLInputElement>(null)

  if (!editor) return null

  const setLink = () => {
    const url = window.prompt('URL link:')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
        padding: '6px 10px',
        borderBottom: '1px solid #edeff1',
        background: '#f6f7f8',
      }}
    >
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
        <b>B</b>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
        <i>I</i>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <s>S</s>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
        {'</>'}
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
        H1
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        H2
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        H3
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Danh sách">
        ≡
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Danh sách số">
        1≡
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Trích dẫn">
        {'"'}
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
        {'{ }'}
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Đường kẻ ngang">
        —
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Chèn link">
        🔗
      </ToolBtn>
      <ToolBtn onClick={() => uploadInputRef.current?.click()} active={false} title="Tải media">
        🖼
      </ToolBtn>
      <input
        ref={uploadInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length > 0) await onUploadMedia(files)
          e.target.value = ''
        }}
      />

      <Divider />

      <ToolBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Hoàn tác">
        ↩
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Làm lại">
        ↪
      </ToolBtn>
    </div>
  )
}

// Form
export function SubmitForm({
  communities,
  token,
  username,
  editPost,
}: {
  communities: Community[]
  token: string
  username: string
  editPost?: EditPost
}) {
  const router = useRouter()

  // Compute initial values for edit mode (only used as useState defaults)
  const initGalleryItems = editPost?.galleryItems ?? []
  const initTab: Tab = editPost ? detectTab(editPost.content) : 'text'
  const initMedia = editPost && initTab === 'media' ? parseMediaState(editPost.content) : { url: '', caption: '' }
  const initEditorContent = editPost && initTab === 'text' ? editPost.content : ''

  const [tab, setTab] = useState<Tab>(initTab)
  const [title, setTitle] = useState(editPost?.title ?? '')
  const [communityId, setCommunityId] = useState(
    editPost?.communityId ?? '',
  )
  const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [editorPendingUploads, setEditorPendingUploads] = useState<
    Array<{ tempURL: string; file: File; isVideo: boolean }>
  >([])
  const [existingGallery, setExistingGallery] = useState(initGalleryItems)
  const [isDragging, setIsDragging] = useState(false)
  const [mediaCaption, setMediaCaption] = useState(initMedia.caption)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const communityDropdownRef = useRef<HTMLDivElement>(null)
  const mediaPreviewsRef = useRef<string[]>([])
  const editorPendingUploadsRef = useRef<Array<{ tempURL: string; file: File; isVideo: boolean }>>([])

  useEffect(() => {
    mediaPreviewsRef.current = mediaPreviews
  }, [mediaPreviews])

  useEffect(() => {
    editorPendingUploadsRef.current = editorPendingUploads
  }, [editorPendingUploads])

  useEffect(() => {
    return () => {
      mediaPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url))
      editorPendingUploadsRef.current.forEach((item) => URL.revokeObjectURL(item.tempURL))
    }
  }, [])

  useEffect(() => {
    if (!communityDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (communityDropdownRef.current && !communityDropdownRef.current.contains(e.target as Node)) {
        setCommunityDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [communityDropdownOpen])

  async function normalizeMediaFile(file: File): Promise<File> {
    if (file.type.startsWith('image/')) {
      return cropImageToMaxWidth(file, MAX_IMAGE_WIDTH)
    }

    if (file.type.startsWith('video/')) {
      return trimVideoToMaxDuration(file, MAX_VIDEO_DURATION_SECONDS)
    }

    return file
  }

  async function uploadMediaFiles(files: File[], altText: string) {
    const uploaded: Array<{ id: number; url?: string | null; mimeType?: string | null }> = []

    for (const file of files) {
      const processedFile = await normalizeMediaFile(file)

      const formData = new FormData()
      formData.append('file', processedFile)
      formData.append('_payload', JSON.stringify({ alt: altText || processedFile.name }))

      const uploadRes = await fetch('/api/media', {
        method: 'POST',
        headers: { Authorization: `JWT ${token}` },
        body: formData,
        credentials: 'include',
      })

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}))
        throw new Error(errData?.errors?.[0]?.message ?? `Upload media thất bại (HTTP ${uploadRes.status}).`)
      }

      const { doc } = await uploadRes.json()
      uploaded.push({
        id: doc.id,
        url: doc.url,
        mimeType: doc.mimeType,
      })
    }

    return uploaded
  }

  async function resolveEditorPendingContent(html: string) {
    if (!editorPendingUploads.length) return html

    const uploads = [...editorPendingUploads]
    const uploadedMap = new Map<string, string>()

    for (const item of uploads) {
      const uploaded = await uploadMediaFiles([item.file], title.trim() || item.file.name)
      const mediaURL = uploaded[0]?.url
      if (mediaURL) uploadedMap.set(item.tempURL, mediaURL)
    }

    const parsed = new DOMParser().parseFromString(html, 'text/html')
    const nodes = parsed.body.querySelectorAll('img[src], video[src], [data-temp-upload-key]')
    nodes.forEach((node) => {
      const key = node.getAttribute('src') || node.getAttribute('data-temp-upload-key')
      if (!key) return
      const finalURL = uploadedMap.get(key)
      if (!finalURL) return
      node.setAttribute('src', finalURL)
      node.removeAttribute('data-temp-upload-key')
    })

    uploads.forEach((item) => URL.revokeObjectURL(item.tempURL))
    setEditorPendingUploads([])

    return parsed.body.innerHTML
  }

  async function addFiles(files: File[]) {
    const valid = files.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))

    if (!valid.length) return

    const previews = valid.map((f) => URL.createObjectURL(f))
    setMediaFiles((prev) => [...prev, ...valid])
    setMediaPreviews((prev) => [...prev, ...previews])
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    await addFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(mediaPreviews[index])
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index))
  }
  function removeExistingGalleryItem(index: number) {
    setExistingGallery((prev) => prev.filter((_, i) => i !== index))
  }
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    content: initEditorContent,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Nội dung bài đăng...' }),
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage,
    ],
    editorProps: {
      attributes: {
        style: 'min-height:200px; padding:14px 16px; outline:none; font-size:14px; line-height:1.7; color:#1c1c1c',
      },
    },
  })

  const handleEditorUploadMedia = useCallback(
    async (files: File[]) => {
      if (!editor) return

      try {
        const validFiles = files.filter((f) => f.type.startsWith('image/') || f.type.startsWith('video/'))
        if (!validFiles.length) return

        const nextPending: Array<{ tempURL: string; file: File; isVideo: boolean }> = []

        for (const file of validFiles) {
          const tempURL = URL.createObjectURL(file)
          const isVideo = file.type.startsWith('video/')
          nextPending.push({ tempURL, file, isVideo })

          if (isVideo) {
            editor
              .chain()
              .focus()
              .insertContent(
                `<p><video src="${tempURL}" controls style="max-width:100%; width:min(100%, ${RECOMMENDED_VIDEO_WIDTH}px); border-radius:8px;"></video></p>`,
              )
              .run()
          } else {
            editor
              .chain()
              .focus()
              .insertContent(`<img src="${tempURL}" alt="${file.name}" />`)
              .run()
          }
        }

        if (nextPending.length) {
          setEditorPendingUploads((prev) => [...prev, ...nextPending])
        }
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : 'Tải media thất bại.'
        setError(message)
      }
    },
    [editor],
  )

  const isValid = useCallback((): boolean => {
    if (!title.trim() || !communityId) return false
    if (tab === 'text') return (editor?.getText().trim().length ?? 0) > 0
    if (tab === 'media') return mediaFiles.length > 0 || existingGallery.length > 0
    return false
  }, [tab, title, communityId, editor, mediaFiles, existingGallery.length])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid()) { setError('Vui lòng điền đầy đủ thông tin.'); return }
    setLoading(true)
    setError('')
    setSuccess('')

    // Always capture editor HTML regardless of active tab
    let content = editor?.getHTML() ?? ''
    let galleryItemIds: number[] | undefined

    try {
      // Always resolve pending editor uploads (no-op if none)
      content = await resolveEditorPendingContent(content)

      if (tab === 'media') {
        const newUploaded =
          mediaFiles.length > 0
            ? await uploadMediaFiles(mediaFiles, mediaCaption || title.trim())
            : []
        const keptIds = existingGallery.map((item) => item.id)
        const newIds = newUploaded.map((item) => item.id)
        galleryItemIds = [...keptIds, ...newIds]
      }
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Tải media thất bại.'
      setError(message)
      setLoading(false)
      return
    }

    const isEdit = !!editPost
    const postBody: Record<string, unknown> = {
      title: title.trim(),
      content,
      community: Number(communityId),
    }
    if (tab === 'media') {
      // Pass media IDs via the galleryItems temp field; the server's beforeChange
      // hook creates/updates the Gallery doc and stores its ID in post.gallery.
      postBody.galleryItems = galleryItemIds ?? []
      if (isEdit && editPost!.galleryId) postBody.gallery = editPost!.galleryId
    }
    if (!isEdit) postBody.slug = vietnameseSlug(title.trim())

    const res = await fetch(
      isEdit ? `/api/reddit-posts/${editPost!.id}` : '/api/reddit-posts',
      {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify(postBody),
        credentials: 'include',
      },
    )

    if (res.ok) {
      const { doc } = await res.json()
      if (isEdit) {
        setSuccess('Đã lưu thay đổi.')
        setLoading(false)
        router.refresh()
        return
      }

      const postSlug = doc.slug
      const postId = doc.id
      router.push(`/post/${postSlug}--${postId}`)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data?.errors?.[0]?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--muted)',
    fontSize: 14, color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box',
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'text', label: 'Bài viết' },
    { id: 'media', label: 'Hình ảnh & Video' },
  ]

  const selectedCommunity = communities.find((c) => c.id.toString() === communityId)

  return (
    <>
      {/* Tiptap global styles */}
      <style>{`
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          pointer-events: none;
          float: left;
          height: 0;
        }
        .tiptap-editor .ProseMirror:focus { outline: none; }
        .tiptap-editor .ProseMirror p { margin: 0 0 0.5em 0; }
        .tiptap-editor .ProseMirror h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
        .tiptap-editor .ProseMirror h2 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0; }
        .tiptap-editor .ProseMirror h3 { font-size: 1.1em; font-weight: 700; margin: 0.5em 0; }
        .tiptap-editor .ProseMirror ul { list-style: disc; padding-left: 1.4em; }
        .tiptap-editor .ProseMirror ol { list-style: decimal; padding-left: 1.4em; }
        .tiptap-editor .ProseMirror blockquote { border-left: 3px solid #0369a1; padding-left: 12px; color: var(--muted-foreground); margin: 8px 0; }
        .tiptap-editor .ProseMirror pre { background: var(--muted); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; overflow-x: auto; }
        .tiptap-editor .ProseMirror code { background: var(--muted); padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
        .tiptap-editor .ProseMirror a { color: #0369a1; text-decoration: underline; }
        .tiptap-editor .ProseMirror hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
        .tiptap-editor .ProseMirror img { max-width: 100%; border-radius: 6px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#dae0e6' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 48px', boxSizing: 'border-box' }}>

          {/* Page title */}
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1c1c1c', marginBottom: 20 }}>
            {editPost ? 'Chỉnh sửa bài viết' : 'Tạo bài đăng'}
          </h1>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Left: form */}
          <div style={{ flex: 1, minWidth: 0 }}>
          <form onSubmit={handleSubmit}>
            {/* Community selector – custom dropdown */}
            <div ref={communityDropdownRef} style={{ position: 'relative', marginBottom: 8 }}>
              {/* Trigger */}
              <div
                style={{
                  background: '#fff',
                  border: communityDropdownOpen ? `1px solid ${GREEN}` : '1px solid #edeff1',
                  borderRadius: communityDropdownOpen ? '4px 4px 0 0' : 4,
                  cursor: 'pointer',
                }}
              >
                {communityId === '' ? (
                  <button
                    type="button"
                    onClick={() => setCommunityDropdownOpen((v) => !v)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#edeff1', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#878a8c" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
                      </svg>
                    </div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#878a8c', textAlign: 'left' }}>
                      Lựa chọn cộng đồng
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#878a8c" strokeWidth="2"
                      style={{ transform: communityDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCommunityDropdownOpen((v) => !v)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: GREEN, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: 14,
                    }}>
                      {selectedCommunity?.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#878a8c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Đăng vào</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1c1c1c' }}>c/{selectedCommunity?.name}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#878a8c" strokeWidth="2"
                      style={{ transform: communityDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdown list */}
              {communityDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: '#fff',
                  border: `1px solid ${GREEN}`, borderTop: '1px solid #edeff1',
                  borderRadius: '0 0 4px 4px',
                  maxHeight: 260, overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}>
                  {communities.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCommunityId(c.id.toString()); setCommunityDropdownOpen(false) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', background: communityId === c.id.toString() ? 'rgba(26,92,56,0.06)' : 'transparent',
                        border: 'none', borderBottom: '1px solid #edeff1', cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(26,92,56,0.06)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = communityId === c.id.toString() ? 'rgba(26,92,56,0.06)' : 'transparent' }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: GREEN, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 13,
                      }}>
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1c1c1c' }}>c/{c.name}</p>
                        {c.description && (
                          <p style={{ margin: 0, fontSize: 12, color: '#878a8c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 340 }}>
                            {c.description}
                          </p>
                        )}
                      </div>
                      {communityId === c.id.toString() && (
                        <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main card */}
            <div style={{
              background: '#fff',
              border: '1px solid #edeff1',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 8,
            }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '1px solid #edeff1' }}>
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    style={{
                      padding: '12px 20px',
                      border: 'none',
                      borderBottom: tab === t.id ? `2px solid ${GREEN}` : '2px solid transparent',
                      background: 'transparent',
                      fontSize: 14,
                      fontWeight: tab === t.id ? 700 : 400,
                      color: tab === t.id ? '#1c1c1c' : '#878a8c',
                      cursor: 'pointer',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div style={{ padding: '16px 16px 0' }}>
                <div style={{ position: 'relative' }}>
                  <textarea
                    required
                    maxLength={300}
                    rows={2}
                    placeholder="Tiêu đề"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      // Auto-resize
                      e.target.style.height = 'auto'
                      e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                    style={{
                      width: '100%', padding: '10px 52px 10px 12px',
                      border: '1px solid #edeff1', borderRadius: 4,
                      fontSize: 16, fontWeight: 500, color: '#1c1c1c',
                      background: '#f6f7f8', outline: 'none',
                      resize: 'none', overflow: 'hidden',
                      lineHeight: 1.5, boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      transition: 'border-color .15s',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.background = '#fff' }}
                    onBlur={(e) => { e.target.style.borderColor = '#edeff1'; e.target.style.background = '#f6f7f8' }}
                  />
                  <span style={{
                    position: 'absolute', right: 10, bottom: 10,
                    fontSize: 11, color: title.length > 280 ? '#dc2626' : '#878a8c',
                    pointerEvents: 'none',
                  }}>
                    {title.length}/300
                  </span>
                </div>
              </div>

              {/* Tab content */}
              {tab === 'text' && (
                <div className="tiptap-editor" style={{ marginTop: 12 }}>
                  <Toolbar editor={editor} onUploadMedia={handleEditorUploadMedia} />
                  <EditorContent editor={editor} />
                </div>
              )}

              {tab === 'media' && (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  {/* Existing + new media grid */}
                  {(existingGallery.length > 0 || mediaFiles.length > 0) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                      {existingGallery.map((item, i) => (
                        <div
                          key={`existing-${item.id}`}
                          style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', background: '#f6f7f8', aspectRatio: '1' }}
                        >
                          {item.mimeType?.startsWith('video/') ? (
                            <video src={item.url ?? undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={item.url ?? undefined} alt={`media-${item.id}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingGalleryItem(i)}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              background: 'rgba(0,0,0,0.6)', color: '#fff',
                              border: 'none', borderRadius: '50%',
                              width: 24, height: 24, fontSize: 16, lineHeight: 1,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >×</button>
                        </div>
                      ))}
                      {mediaFiles.map((file, i) => (
                        <div
                          key={i}
                          style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', background: '#f6f7f8', aspectRatio: '1' }}
                        >
                          {file.type.startsWith('video/') ? (
                            <video src={mediaPreviews[i]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={mediaPreviews[i]} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              background: 'rgba(0,0,0,0.6)', color: '#fff',
                              border: 'none', borderRadius: '50%',
                              width: 24, height: 24, fontSize: 16, lineHeight: 1,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={async (e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      await addFiles(Array.from(e.dataTransfer.files))
                    }}
                    style={{
                      border: `1px dashed ${isDragging ? GREEN : '#878a8c'}`,
                      borderRadius: 4,
                      padding: '40px 24px',
                      textAlign: 'center',
                      background: isDragging ? 'rgba(26,92,56,0.04)' : '#f6f7f8',
                      cursor: 'pointer',
                      transition: 'border-color .15s, background .15s',
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#878a8c" strokeWidth="1.5" style={{ display: 'inline-block' }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                    <p style={{ fontWeight: 600, color: '#1c1c1c', marginBottom: 4, fontSize: 14 }}>
                      {existingGallery.length + mediaFiles.length > 0 ? 'Thêm ảnh/video' : 'Kéo thả hoặc click để tải lên'}
                    </p>
                    <p style={{ fontSize: 12, color: '#878a8c', margin: 0 }}>
                      Hỗ trợ ảnh và video
                    </p>
                  </div>

                  {/* Caption */}
                  <input
                    type="text"
                    placeholder="Chú thích (tuỳ chọn)"
                    value={mediaCaption}
                    onChange={(e) => setMediaCaption(e.target.value)}
                    style={{
                      width: '100%', padding: '9px 12px',
                      border: '1px solid #edeff1', borderRadius: 4,
                      fontSize: 14, color: '#1c1c1c', background: '#f6f7f8',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.background = '#fff' }}
                    onBlur={(e) => { e.target.style.borderColor = '#edeff1'; e.target.style.background = '#f6f7f8' }}
                  />
                  <p style={{ fontSize: 11, color: '#878a8c', margin: 0 }}>
                    Ảnh: tối đa {MAX_IMAGE_WIDTH}px · Video: tối đa {MAX_VIDEO_DURATION_SECONDS}s
                  </p>
                </div>
              )}

              {/* Footer bar */}
              <div style={{
                padding: '10px 16px',
                background: '#f6f7f8',
                borderTop: '1px solid #edeff1',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 8,
              }}>
                {error && (
                  <span style={{ flex: 1, fontSize: 13, color: '#dc2626' }}>{error}</span>
                )}
                {!error && success && (
                  <span style={{ flex: 1, fontSize: 13, color: GREEN, fontWeight: 600 }}>{success}</span>
                )}
                <Link
                  href={editPost ? '/my-posts' : '/'}
                  style={{
                    padding: '6px 18px', borderRadius: 9999,
                    border: `1px solid ${GREEN}`, color: GREEN,
                    fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    lineHeight: '20px', display: 'inline-block',
                  }}
                >
                  Hủy
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '6px 20px', borderRadius: 9999, border: 'none',
                    background: loading ? '#6b9e7e' : GREEN,
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    lineHeight: '20px',
                  }}
                >
                  {loading
                    ? (editPost ? 'Đang lưu...' : 'Đang đăng...')
                    : (editPost ? 'Lưu' : 'Đăng bài')}
                </button>
              </div>
            </div>
          </form>
          </div>{/* end left */}

          {/* Right sidebar */}
          <div style={{ width: 312, flexShrink: 0 }}>
            {selectedCommunity ? (
              <div style={{ background: '#fff', border: '1px solid #edeff1', borderRadius: 4, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: GREEN, padding: '40px 12px 12px', position: 'relative' }}>
                  {/* Avatar */}
                  <div style={{
                    position: 'absolute', top: 16, left: 12,
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#fff', border: `3px solid ${GREEN}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 800, color: GREEN,
                  }}>
                    {selectedCommunity.name[0]?.toUpperCase()}
                  </div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0, paddingLeft: 52 }}>
                    c/{selectedCommunity.name}
                  </p>
                </div>

                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedCommunity.description && (
                    <p style={{ fontSize: 14, color: '#1c1c1c', lineHeight: 1.6, margin: 0 }}>
                      {selectedCommunity.description}
                    </p>
                  )}

                  <div style={{ borderTop: '1px solid #edeff1', paddingTop: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#878a8c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      Quy tắc đăng bài
                    </p>
                    {[
                      'Tiêu đề rõ ràng, đúng nội dung.',
                      'Không spam hoặc quảng cáo.',
                      'Tôn trọng thành viên khác.',
                      'Tuân thủ nội quy cộng đồng.',
                    ].map((rule, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <span style={{ color: GREEN, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13, color: '#1c1c1c', lineHeight: 1.5 }}>{rule}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid #edeff1', paddingTop: 12 }}>
                    <Link
                      href={`/c/${selectedCommunity.slug}`}
                      style={{
                        display: 'block', textAlign: 'center',
                        padding: '7px 16px', borderRadius: 9999,
                        background: GREEN, color: '#fff',
                        fontSize: 14, fontWeight: 700, textDecoration: 'none',
                      }}
                    >
                      Xem cộng đồng
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #edeff1', borderRadius: 4, padding: 16 }}>
                <p style={{ fontSize: 14, color: '#878a8c', lineHeight: 1.6, margin: 0 }}>
                  Chọn cộng đồng để xem thông tin và quy tắc đăng bài.
                </p>
              </div>
            )}
          </div>{/* end right */}

          </div>{/* end two-col */}
        </div>
      </div>
    </>
  )
}

