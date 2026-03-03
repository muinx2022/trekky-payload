import type { Metadata } from 'next/types'
import Link from 'next/link'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_POST = {
  id: '1',
  communitySlug: 'trekky',
  communityName: 'Trekky',
  communityMembers: '38.5k',
  author: 'phuot_thu_vn',
  timeAgo: '3 giờ trước',
  score: 1247,
  flair: 'Kinh nghiệm',
  title: 'Kinh nghiệm leo Fansipan mùa đông – Những điều THỰC SỰ cần biết trước khi đi',
  body: `Mình vừa hoàn thành chuyến leo Fansipan 3 ngày 2 đêm vào tháng 12 năm ngoái và muốn chia sẻ những trải nghiệm thực tế mà bạn **không thấy trên các blog du lịch thông thường**.

## Thời tiết thực tế

Nhiệt độ đỉnh Fansipan tháng 12 có thể xuống âm 3–5°C vào ban đêm. Áo ấm loại "ấm vừa" là không đủ. Mình thấy rất nhiều bạn bị cảm vì mặc không đủ ấm.

**Những gì thực sự cần mang:**
- Áo base layer giữ nhiệt (loại chuyên dụng, không phải áo len thông thường)
- Áo giữ nhiệt lông vũ (down jacket)
- Áo gió chống thấm nước
- Găng tay, mũ che tai, khăn cổ

## Đường lên theo cáp treo hay đi bộ?

Nếu bạn muốn **trải nghiệm thực sự**, hãy đi bộ theo trail qua rừng nguyên sinh. Đường cáp treo rút ngắn thời gian nhưng bạn sẽ bỏ lỡ phần đẹp nhất.

**Lộ trình đi bộ gợi ý:**
1. Ngày 1: Sa Pa → Trạm Tôn → Lán 2600m (nghỉ đêm)
2. Ngày 2: Lán 2600 → Đỉnh Fansipan → Lán 2200 (nghỉ đêm)
3. Ngày 3: Lán 2200 → Trạm Tôn → Sa Pa

## Chi phí tham khảo

| Khoản | Chi phí |
|-------|---------|
| Porter (2 ngày) | 600.000đ |
| Lán ngủ (2 đêm) | 300.000đ |
| Đồ ăn mang theo | 400.000đ |
| Thuê đồ leo núi | 200.000đ |
| **Tổng** | **~1.5 triệu** |

## Kết luận

Fansipan mùa đông rất đẹp nhưng cần chuẩn bị kỹ. Đừng để bị sập bẫy bởi những hình ảnh "sống ảo" mà quên chuẩn bị đồ đúng cách.

Nếu bạn có câu hỏi gì cứ hỏi trong phần bình luận nhé!`,
}

const MOCK_COMMENTS = [
  {
    id: 'c1',
    author: 'mountain_lover_99',
    timeAgo: '2 giờ trước',
    score: 234,
    text: 'Bài viết rất hữu ích! Mình đang lên kế hoạch cho tháng 1 này. Bạn có thể chia sẻ thêm về porter không? Có cần đặt trước không?',
    replies: [
      {
        id: 'c1r1',
        author: 'phuot_thu_vn',
        timeAgo: '1 giờ 30 phút trước',
        score: 89,
        text: 'Porter thì nên đặt trước qua các homestay ở Sa Pa hoặc qua các group Facebook chuyên về trekking Fansipan. Mùa đông porter khá đắt hàng nên đặt sớm trước 1-2 tuần là tốt nhất!',
        replies: [],
      },
    ],
  },
  {
    id: 'c2',
    author: 'sapalocal',
    timeAgo: '2 giờ 15 phút trước',
    score: 156,
    text: 'Là người Sa Pa mình xác nhận thông tin nhiệt độ là đúng. Tháng 12-1 lạnh nhất trong năm. Ngoài đồ ấm còn nên mang kem chống nắng vì tia UV trên cao rất mạnh dù trời lạnh.',
    replies: [],
  },
  {
    id: 'c3',
    author: 'trekker_hanoi',
    timeAgo: '1 giờ trước',
    score: 98,
    text: 'Cảm ơn bạn! Mình đã leo theo cáp treo rồi và thực sự thấy tiếc vì bỏ lỡ cung đường rừng. Lần sau nhất định sẽ đi bộ.',
    replies: [
      {
        id: 'c3r1',
        author: 'backpacker_vn',
        timeAgo: '45 phút trước',
        score: 34,
        text: 'Mình cũng vậy! Lần đầu đi cáp, lần hai đi bộ, khác nhau hoàn toàn. Cung đường bộ đẹp hơn nhiều.',
        replies: [],
      },
    ],
  },
  {
    id: 'c4',
    author: 'gear_reviewer',
    timeAgo: '3 giờ trước',
    score: 67,
    text: 'Về đồ leo núi, mình gợi ý thêm: gậy trekking rất quan trọng cho đường xuống. Đầu gối sẽ cảm ơn bạn! Có thể thuê tại Sa Pa khoảng 30-50k/ngày.',
    replies: [],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ─── Comment Component ────────────────────────────────────────────────────────

type Reply = { id: string; author: string; timeAgo: string; score: number; text: string; replies: Reply[] }
type Comment = { id: string; author: string; timeAgo: string; score: number; text: string; replies: Reply[] }

function CommentItem({ comment, depth = 0 }: { comment: Comment | Reply; depth?: number }) {
  return (
    <div
      style={{
        paddingLeft: depth > 0 ? 16 : 0,
        borderLeft: depth > 0 ? '2px solid var(--border)' : 'none',
        marginLeft: depth > 0 ? 16 : 0,
      }}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        {/* Avatar */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `hsl(${comment.author.length * 37}deg 55% 50%)`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {comment.author[0].toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          {/* Meta */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
              fontSize: 12,
              color: 'var(--muted-foreground)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>u/{comment.author}</span>
            <span>•</span>
            <span>{comment.timeAgo}</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4 3 15h6v5h6v-5h6L12 4Z" />
              </svg>
              {comment.score}
            </span>
          </div>

          {/* Text */}
          <p style={{ fontSize: 14, color: 'var(--foreground)', lineHeight: 1.6, margin: 0 }}>
            {comment.text}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {['Thích', 'Phản hồi', 'Báo cáo'].map((action) => (
              <button
                key={action}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted-foreground)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PostDetailPage() {
  const post = MOCK_POST

  return (
    <div style={{ background: '#f0f9ff', minHeight: '100vh' }}>
      {/* ── Navy top bar ── */}
      <div style={{ background: '#0369a1', color: '#fff' }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 16px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <Link
            href="/reddit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 700,
              fontSize: 18,
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 22 }}>🏔️</span>
            Trekky
          </Link>
          <nav style={{ display: 'flex', gap: 4 }}>
            {[
              { href: '/reddit', label: 'Trang chủ' },
              { href: '/reddit/communities', label: 'Cộng đồng' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '5px 12px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.85)',
                  textDecoration: 'none',
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div style={{ background: '#0369a1', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '6px 16px',
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
            display: 'flex',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <Link href="/reddit" style={{ color: 'inherit', textDecoration: 'none' }}>
            Trang chủ
          </Link>
          <span>›</span>
          <Link
            href={`/c/${post.communitySlug}`}
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            r/{post.communitySlug}
          </Link>
          <span>›</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>Bài đăng</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '20px 16px',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* ─── Main ─── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Post card */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              display: 'flex',
            }}
          >
            {/* Vote column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'color-mix(in oklch, var(--muted) 50%, transparent)',
                borderRadius: '8px 0 0 8px',
                padding: '16px 8px',
                gap: 4,
                minWidth: 48,
              }}
            >
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4 3 15h6v5h6v-5h6L12 4Z" />
                </svg>
              </button>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--foreground)' }}>
                {fmt(post.score)}
              </span>
              <button
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20 21 9h-6V4H9v5H3l9 11Z" />
                </svg>
              </button>
            </div>

            {/* Post content */}
            <div style={{ flex: 1, padding: '16px 20px' }}>
              {/* Meta */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--muted-foreground)',
                  marginBottom: 10,
                }}
              >
                <Link
                  href={`/c/${post.communitySlug}`}
                  style={{ fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}
                >
                  r/{post.communitySlug}
                </Link>
                <span>•</span>
                <span>Đăng bởi u/{post.author}</span>
                <span>•</span>
                <span>{post.timeAgo}</span>
                {post.flair && (
                  <>
                    <span>•</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 600,
                        background: 'rgba(26,92,56,0.12)',
                        color: '#0369a1',
                      }}
                    >
                      {post.flair}
                    </span>
                  </>
                )}
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  marginBottom: 16,
                  lineHeight: 1.4,
                }}
              >
                {post.title}
              </h1>

              {/* Body — rendered as plain text with line breaks for now */}
              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: 'var(--foreground)',
                  whiteSpace: 'pre-line',
                  marginBottom: 16,
                }}
              >
                {post.body}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                {[
                  {
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    ),
                    label: `${MOCK_COMMENTS.length} Bình luận`,
                  },
                  {
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
                      </svg>
                    ),
                    label: 'Chia sẻ',
                  },
                  {
                    icon: (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    ),
                    label: 'Lưu',
                  },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 4,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--muted-foreground)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Comments ── */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '16px 20px',
            }}
          >
            {/* Comment input */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 8 }}>
                Bình luận với tư cách{' '}
                <span style={{ color: '#0369a1', fontWeight: 600 }}>u/trekky_user</span>
              </p>
              <textarea
                placeholder="Chia sẻ suy nghĩ của bạn…"
                readOnly
                rows={4}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--muted)',
                  fontSize: 14,
                  color: 'var(--foreground)',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  style={{
                    padding: '8px 20px',
                    borderRadius: 9999,
                    border: 'none',
                    background: '#0369a1',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Bình luận
                </button>
              </div>
            </div>

            {/* Sort */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)' }}>
                Sắp xếp:
              </span>
              {['Tốt nhất', 'Mới nhất', 'Nhiều vote'].map((s, i) => (
                <button
                  key={s}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 9999,
                    border: 'none',
                    background: i === 0 ? 'rgba(26,92,56,0.1)' : 'transparent',
                    color: i === 0 ? '#0369a1' : 'var(--muted-foreground)',
                    fontWeight: i === 0 ? 700 : 500,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Comment list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {MOCK_COMMENTS.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <aside style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Community info */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: 48,
                background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
              }}
            />
            <div style={{ padding: '12px 16px 16px' }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: 'var(--foreground)' }}>
                r/{post.communitySlug}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12 }}>
                {post.communityMembers} thành viên
              </p>
              <button
                style={{
                  width: '100%',
                  padding: '7px',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#0369a1',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Tham gia
              </button>
            </div>
          </div>

          {/* About post author */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <h3
              style={{
                fontWeight: 700,
                fontSize: 13,
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--muted-foreground)',
              }}
            >
              Tác giả
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                P
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--foreground)', margin: 0 }}>
                  u/{post.author}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
                  Phượt thủ kỳ cựu
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted-foreground)' }}>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>2.4k</p>
                <p style={{ margin: 0 }}>Karma</p>
              </div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>47</p>
                <p style={{ margin: 0 }}>Bài đăng</p>
              </div>
            </div>
          </div>

          {/* Back link */}
          <Link
            href="/reddit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#0369a1',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← Về trang chủ
          </Link>
        </aside>
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `${MOCK_POST.title} – Trekky`,
  }
}
