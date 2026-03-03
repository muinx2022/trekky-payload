'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TiptapLink from '@tiptap/extension-link'
import TiptapImage from '@tiptap/extension-image'

import type { RedditPost } from '@/payload-types'

const GREEN = '#0369a1'

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
        background: active ? 'rgba(26,92,56,0.15)' : 'transparent',
        color: active ? GREEN : 'var(--foreground)',
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
  return (
    <div
      style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '0 2px' }}
    />
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
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

  const addImage = () => {
    const url = window.prompt('URL hình ảnh:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
        padding: '6px 10px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--muted)',
      }}
    >
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Gạch ngang"><s>S</s></ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Danh sách">≡</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Danh sách số">1≡</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Trích dẫn">{'"'}</ToolBtn>
      <Divider />
      <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Chèn link">🔗</ToolBtn>
      <ToolBtn onClick={addImage} active={false} title="Chèn ảnh">🖼</ToolBtn>
      <Divider />
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} active={false} title="Hoàn tác">↩</ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} active={false} title="Làm lại">↪</ToolBtn>
    </div>
  )
}

export function EditPostForm({
  post,
  token,
}: {
  post: RedditPost & { hidden?: boolean }
  token: string
}) {
  const router = useRouter()
  const [title, setTitle] = useState(post.title)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Nội dung bài đăng…' }),
      TiptapLink.configure({ openOnClick: false }),
      TiptapImage,
    ],
    content: post.content ?? '',
    editorProps: {
      attributes: {
        style:
          'min-height:240px; padding:14px; outline:none; font-size:14px; line-height:1.7; color:var(--foreground)',
      },
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Tiêu đề không được để trống.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess(false)

    const res = await fetch(`/api/reddit-posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
      body: JSON.stringify({
        title: title.trim(),
        content: editor?.getHTML() ?? '',
      }),
      credentials: 'include',
    })

    if (res.ok) {
      setSuccess(true)
      router.refresh()
      setTimeout(() => router.push(`/post/${post.slug}--${post.id}`), 800)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d?.errors?.[0]?.message ?? 'Có lỗi xảy ra, vui lòng thử lại.')
    }
    setLoading(false)
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

  return (
    <>
      <style>{`
        .edit-tiptap .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          pointer-events: none;
          float: left;
          height: 0;
        }
        .edit-tiptap .ProseMirror:focus { outline: none; }
        .edit-tiptap .ProseMirror h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
        .edit-tiptap .ProseMirror h2 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0; }
        .edit-tiptap .ProseMirror h3 { font-size: 1.1em; font-weight: 700; margin: 0.5em 0; }
        .edit-tiptap .ProseMirror ul { list-style: disc; padding-left: 1.4em; }
        .edit-tiptap .ProseMirror ol { list-style: decimal; padding-left: 1.4em; }
        .edit-tiptap .ProseMirror blockquote { border-left: 3px solid #0369a1; padding-left: 12px; color: var(--muted-foreground); margin: 8px 0; }
        .edit-tiptap .ProseMirror pre { background: var(--muted); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px; }
        .edit-tiptap .ProseMirror code { background: var(--muted); padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
        .edit-tiptap .ProseMirror a { color: #0369a1; text-decoration: underline; }
        .edit-tiptap .ProseMirror img { max-width: 100%; border-radius: 6px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f0f9ff' }}>
        <div style={{ maxWidth: 760, margin: '28px auto', padding: '0 16px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', marginBottom: 16 }}>
            Sửa bài viết
          </h1>

          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Tiêu đề *
              </label>
              <input
                type="text"
                required
                maxLength={300}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ ...inputStyle, fontSize: 16, fontWeight: 500 }}
              />
              <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4, textAlign: 'right' }}>
                {title.length}/300
              </p>
            </div>

            {/* Content editor */}
            <div
              className="edit-tiptap"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 12,
              }}
            >
              <Toolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  fontSize: 13,
                  color: '#dc2626',
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(26,92,56,0.08)',
                  border: '1px solid rgba(26,92,56,0.2)',
                  fontSize: 13,
                  color: GREEN,
                  marginBottom: 12,
                }}
              >
                ✓ Đã lưu! Đang chuyển hướng…
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Link
                href="/my-posts"
                style={{
                  padding: '9px 20px',
                  borderRadius: 9999,
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Hủy
              </Link>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '9px 24px',
                  borderRadius: 9999,
                  border: 'none',
                  background: loading ? '#6b9e7e' : GREEN,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
