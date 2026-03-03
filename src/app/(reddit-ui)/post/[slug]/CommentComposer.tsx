'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useLoginModal } from '../../LoginModalProvider'

const GREEN = '#0369a1'

type SubmitAction = (formData: FormData) => Promise<void>

type ComposerContextType = {
  activeKey: string | null
  setActiveKey: (key: string | null) => void
}

const ComposerContext = createContext<ComposerContextType | null>(null)

function useComposerContext() {
  const ctx = useContext(ComposerContext)
  if (!ctx) {
    throw new Error('Comment composer context is missing.')
  }
  return ctx
}

export function CommentComposerProvider({ children }: { children: React.ReactNode }) {
  const [activeKey, setActiveKey] = useState<string | null>(null)

  return <ComposerContext.Provider value={{ activeKey, setActiveKey }}>{children}</ComposerContext.Provider>
}

function PendingSubmitButton({
  label,
  pendingLabel,
  size = 'm',
}: {
  label: string
  pendingLabel: string
  size?: 's' | 'm'
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`winku-comment-submit ${size === 's' ? 'winku-comment-submit--s' : ''}`}
      style={{
        background: pending ? '#7da5c4' : GREEN,
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

function AutoCloseWhenDone({ open, onDone }: { open: boolean; onDone: () => void }) {
  const { pending } = useFormStatus()
  const wasPending = useRef(false)

  useEffect(() => {
    if (!open) return
    if (!wasPending.current && pending) {
      wasPending.current = true
      return
    }
    if (wasPending.current && !pending) {
      wasPending.current = false
      onDone()
    }
  }, [open, pending, onDone])

  return null
}

export function ReplyComposer({
  action,
  postID,
  parentID,
  postPath,
  author,
  composerKey,
  isAuthenticated,
  currentUsername,
  currentAvatarURL,
}: {
  action: SubmitAction
  postID: number
  parentID: number
  postPath: string
  author: string
  composerKey: string
  isAuthenticated: boolean
  currentUsername?: string | null
  currentAvatarURL?: string | null
}) {
  const { openLoginModal } = useLoginModal()
  const { activeKey, setActiveKey } = useComposerContext()
  const open = activeKey === composerKey

  return (
    <>
      <button
        type="button"
        className="winku-comment-link"
        title="Phản hồi"
        aria-label="Phản hồi"
        onClick={() => {
          if (!isAuthenticated) {
            openLoginModal()
            return
          }
          setActiveKey(open ? null : composerKey)
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 8 4 12l5 4v-3h6a5 5 0 0 1 5 5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && isAuthenticated && (
        <div style={{ flexBasis: '100%' }}>
          <form action={action} className="winku-comment-form winku-comment-form--reply">
            <AutoCloseWhenDone open={open} onDone={() => setActiveKey(null)} />

            <input type="hidden" name="postID" value={postID} />
            <input type="hidden" name="parentID" value={parentID} />
            <input type="hidden" name="postPath" value={postPath} />
            <div className="winku-comment-form-layout">
              <div className="winku-comment-form-avatar">
                {currentAvatarURL ? (
                  <img src={currentAvatarURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (currentUsername?.[0] ?? 'U').toUpperCase()
                )}
              </div>
              <div className="winku-comment-form-main">
                <textarea
                  name="content"
                  rows={3}
                  required
                  placeholder={`Trả lời u/${author}...`}
                  className="winku-comment-textarea"
                />
              </div>
            </div>
            <div className="winku-comment-form__actions">
              <button type="button" className="winku-comment-cancel" onClick={() => setActiveKey(null)}>
                Hủy
              </button>
              <PendingSubmitButton label="Gửi phản hồi" pendingLabel="Đang gửi..." size="s" />
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export function TopCommentComposer({
  action,
  postID,
  postPath,
  username,
  avatarURL,
  composerKey,
}: {
  action: SubmitAction
  postID: number
  postPath: string
  username: string | null
  avatarURL?: string | null
  composerKey: string
}) {
  const { openLoginModal } = useLoginModal()
  const { activeKey, setActiveKey } = useComposerContext()
  const open = activeKey === composerKey

  return (
    <details open={open} style={{ width: '100%' }}>
      <summary
        className="winku-comment-trigger"
        onClick={(e) => {
          e.preventDefault()
          if (!username) {
            openLoginModal()
            return
          }
          setActiveKey(open ? null : composerKey)
        }}
      >
        <span className="winku-comment-trigger__title">Viết bình luận</span>
        <span className="winku-comment-trigger__sub">Tham gia trò chuyện</span>
      </summary>

      {open && username && (
        <form action={action} className="winku-comment-form" style={{ marginTop: 12 }}>
          <AutoCloseWhenDone open={open} onDone={() => setActiveKey(null)} />

          <input type="hidden" name="postID" value={postID} />
          <input type="hidden" name="postPath" value={postPath} />
          <div className="winku-comment-form-layout">
            <div className="winku-comment-form-avatar">
              {avatarURL ? (
                <img src={avatarURL} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                username[0]?.toUpperCase()
              )}
            </div>
            <div className="winku-comment-form-main">
              <textarea
                name="content"
                required
                placeholder="Chia sẻ suy nghĩ của bạn..."
                rows={4}
                className="winku-comment-textarea"
              />
            </div>
          </div>
          <div className="winku-comment-form__actions">
            <button type="button" className="winku-comment-cancel" onClick={() => setActiveKey(null)}>
              Hủy
            </button>
            <PendingSubmitButton label="Đăng bình luận" pendingLabel="Đang gửi..." />
          </div>
        </form>
      )}
    </details>
  )
}
