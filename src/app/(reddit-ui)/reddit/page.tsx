import type { Metadata } from 'next/types'
import Link from 'next/link'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const COMMUNITIES = [
  { slug: 'trekky', name: 'Trekky', members: 38500, description: 'Cộng đồng phượt thủ Việt Nam' },
  {
    slug: 'backpacking',
    name: 'BackpackingVN',
    members: 8200,
    description: 'Phượt bụi khắp nơi',
  },
  { slug: 'camping', name: 'CampingVN', members: 5600, description: 'Cắm trại & thiên nhiên' },
  {
    slug: 'motorbike',
    name: 'MotoTour',
    members: 9800,
    description: 'Phượt xe máy đường dài',
  },
  {
    slug: 'photography',
    name: 'TravelPhoto',
    members: 4300,
    description: 'Nhiếp ảnh du lịch',
  },
]

const POSTS = [
  {
    id: '1',
    communitySlug: 'trekky',
    communityName: 'Trekky',
    author: 'phuot_thu_vn',
    timeAgo: '3 giờ trước',
    score: 1247,
    title: 'Kinh nghiệm leo Fansipan mùa đông – Những điều THỰC SỰ cần biết trước khi đi',
    commentsCount: 89,
    flair: 'Kinh nghiệm',
    pinned: true,
  },
  {
    id: '2',
    communitySlug: 'motorbike',
    communityName: 'MotoTour',
    author: 'rider_hcm',
    timeAgo: '5 giờ trước',
    score: 892,
    title: 'Hành trình Hà Nội – Hà Giang 3 ngày 2 đêm bằng xe Win cà tàng',
    commentsCount: 134,
    flair: 'Trip Report',
    pinned: false,
  },
  {
    id: '3',
    communitySlug: 'camping',
    communityName: 'CampingVN',
    author: 'camping_lover',
    timeAgo: '1 ngày trước',
    score: 2341,
    title: 'Review lều Big Agnes Copper Spur HV UL2 – Có đáng tiền không?',
    commentsCount: 201,
    flair: 'Review',
    pinned: false,
  },
  {
    id: '4',
    communitySlug: 'backpacking',
    communityName: 'BackpackingVN',
    author: 'budget_traveler99',
    timeAgo: '8 giờ trước',
    score: 445,
    title: 'Chi phí đi Đà Lạt 5 ngày chỉ với 1.5 triệu – Budget breakdown chi tiết',
    commentsCount: 56,
    flair: 'Budget',
    pinned: false,
  },
  {
    id: '5',
    communitySlug: 'photography',
    communityName: 'TravelPhoto',
    author: 'photo_hiker',
    timeAgo: '12 giờ trước',
    score: 3102,
    title: 'Chụp Mộc Châu mùa hoa cải – Setup máy và những tips để có ảnh đẹp nhất',
    commentsCount: 278,
    flair: 'Photography',
    pinned: false,
  },
  {
    id: '6',
    communitySlug: 'trekky',
    communityName: 'Trekky',
    author: 'mountain_girl',
    timeAgo: '2 ngày trước',
    score: 567,
    title: 'Bạn có sợ đi một mình không? Chia sẻ kinh nghiệm solo travel của mình',
    commentsCount: 312,
    flair: 'Discussion',
    pinned: false,
  },
  {
    id: '7',
    communitySlug: 'motorbike',
    communityName: 'MotoTour',
    author: 'moto_vlogs',
    timeAgo: '6 giờ trước',
    score: 1089,
    title: '[Video] Xuyên Việt 45 ngày – Những khoảnh khắc không thể quên',
    commentsCount: 145,
    flair: 'Video',
    pinned: false,
  },
  {
    id: '8',
    communitySlug: 'camping',
    communityName: 'CampingVN',
    author: 'gear_nerd',
    timeAgo: '3 ngày trước',
    score: 234,
    title: 'Mua túi ngủ ở đâu tốt? So sánh các thương hiệu từ 500k – 5 triệu',
    commentsCount: 67,
    flair: 'Gear',
    pinned: false,
  },
  {
    id: '9',
    communitySlug: 'backpacking',
    communityName: 'BackpackingVN',
    author: 'hanoi_hiker',
    timeAgo: '4 giờ trước',
    score: 789,
    title: 'Những cung đường trekking đẹp nhất miền Bắc – Ranking theo độ khó',
    commentsCount: 93,
    flair: 'Danh sách',
    pinned: false,
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconArrowUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 4 3 15h6v5h6v-5h6L12 4Z" />
    </svg>
  )
}

function IconArrowDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 20 21 9h-6V4H9v5H3l9 11Z" />
    </svg>
  )
}

function IconComment() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  )
}

function IconBookmark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconPin() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

type Post = (typeof POSTS)[number]

function PostCard({ post }: { post: Post }) {
  return (
    <article
      className="reddit-post-card"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        display: 'flex',
        transition: 'border-color .15s',
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
          padding: '8px 6px',
          gap: 2,
          minWidth: 44,
        }}
      >
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
          }}
          aria-label="Upvote"
        >
          <IconArrowUp />
        </button>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--foreground)',
            lineHeight: 1,
          }}
        >
          {fmt(post.score)}
        </span>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
          }}
          aria-label="Downvote"
        >
          <IconArrowDown />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '10px 12px 8px' }}>
        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--muted-foreground)',
            marginBottom: 6,
            flexWrap: 'wrap',
          }}
        >
          {post.pinned && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                color: '#16a34a',
                fontWeight: 600,
              }}
            >
              <IconPin /> Ghim
            </span>
          )}
          <Link
            href={`/c/${post.communitySlug}`}
            style={{ fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}
          >
            r/{post.communitySlug}
          </Link>
          <span>•</span>
          <span>Đăng bởi</span>
          <Link
            href={`/reddit/u/${post.author}`}
            style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}
          >
            u/{post.author}
          </Link>
          <span>{post.timeAgo}</span>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          {post.flair && (
            <span
              style={{
                flexShrink: 0,
                display: 'inline-block',
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
          )}
          <Link
            href={`/reddit/post/${post.id}`}
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--foreground)',
              textDecoration: 'none',
              lineHeight: 1.4,
            }}
          >
            {post.title}
          </Link>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { icon: <IconComment />, label: `${post.commentsCount} Bình luận` },
            { icon: <IconShare />, label: 'Chia sẻ' },
            { icon: <IconBookmark />, label: 'Lưu' },
          ].map(({ icon, label }) => (
            <button
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 8px',
                borderRadius: 4,
                border: 'none',
                background: 'transparent',
                color: 'var(--muted-foreground)',
                fontSize: 12,
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
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RedditPage() {
  return (
    <div style={{ background: '#f0f9ff', minHeight: '100vh' }}>
      {/* ── Navy top bar ── */}
      <div
        style={{
          background: '#0369a1',
          color: '#fff',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        }}
      >
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
          {/* Logo */}
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
              letterSpacing: '-0.3px',
            }}
          >
            <span style={{ fontSize: 22 }}>🏔️</span>
            Trekky
          </Link>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 4 }}>
            {[
              { href: '/reddit', label: 'Trang chủ' },
              { href: '/reddit/communities', label: 'Cộng đồng' },
              { href: '/reddit/submit', label: 'Đăng bài' },
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

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 9999,
              padding: '5px 14px',
              gap: 8,
              width: 240,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm…"
              readOnly
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 13,
                width: '100%',
              }}
            />
          </div>

          {/* Auth */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                padding: '6px 16px',
                borderRadius: 9999,
                border: '1px solid rgba(255,255,255,0.5)',
                background: 'transparent',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Đăng nhập
            </button>
            <button
              style={{
                padding: '6px 16px',
                borderRadius: 9999,
                border: 'none',
                background: '#fff',
                color: '#0369a1',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Đăng ký
            </button>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
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
        {/* ─── Feed ─── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Create post */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--muted-foreground)"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tạo bài đăng mới…"
              readOnly
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 4,
                border: '1px solid var(--border)',
                background: 'var(--muted)',
                fontSize: 14,
                color: 'var(--muted-foreground)',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
            <button
              style={{
                padding: '8px 16px',
                borderRadius: 9999,
                border: 'none',
                background: '#0369a1',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Đăng
            </button>
          </div>

          {/* Sort bar */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'flex',
              gap: 4,
            }}
          >
            {[
              { label: '🔥 Hot', active: true },
              { label: '⭐ Mới', active: false },
              { label: '📈 Top', active: false },
              { label: '🚀 Rising', active: false },
            ].map(({ label, active }) => (
              <button
                key={label}
                style={{
                  padding: '6px 14px',
                  borderRadius: 9999,
                  border: 'none',
                  background: active ? 'rgba(26,92,56,0.1)' : 'transparent',
                  color: active ? '#0369a1' : 'var(--muted-foreground)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Posts */}
          {POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* ─── Sidebar ─── */}
        <aside
          style={{
            width: 300,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Community card */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {/* Banner */}
            <div
              style={{
                height: 60,
                background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
              }}
            />
            <div style={{ padding: '12px 16px 16px' }}>
              <h3
                style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: 'var(--foreground)' }}
              >
                🏔️ Trekky Community
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 14 }}>
                Nơi kết nối cộng đồng phượt thủ, khám phá thiên nhiên và chia sẻ hành trình.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  marginBottom: 14,
                  paddingBottom: 14,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)' }}>38.5k</p>
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Thành viên</p>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 16, color: '#16a34a' }}>● 142</p>
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Đang online</p>
                </div>
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#0369a1',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 8,
                }}
              >
                Tham gia cộng đồng
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 9999,
                  border: '1px solid #0369a1',
                  background: 'transparent',
                  color: '#0369a1',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Tạo bài đăng
              </button>
            </div>
          </div>

          {/* Top communities */}
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
              Cộng đồng nổi bật
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {COMMUNITIES.map((c, i) => (
                <li key={c.slug} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{ fontSize: 12, color: 'var(--muted-foreground)', width: 16, textAlign: 'right' }}
                  >
                    {i + 1}
                  </span>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: `hsl(${210 + i * 25}deg 70% 45%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {c.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/c/${c.slug}`}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        textDecoration: 'none',
                        display: 'block',
                      }}
                    >
                      r/{c.slug}
                    </Link>
                    <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
                      {c.members.toLocaleString('vi-VN')} thành viên
                    </p>
                  </div>
                  <button
                    style={{
                      padding: '3px 10px',
                      borderRadius: 9999,
                      border: '1px solid #0369a1',
                      background: 'transparent',
                      color: '#0369a1',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Tham gia
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Rules */}
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
              Nội quy cộng đồng
            </h3>
            <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Tôn trọng mọi thành viên',
                'Không spam hoặc quảng cáo',
                'Chia sẻ nội dung thực tế, có ích',
                'Gắn flair phù hợp cho bài đăng',
                'Không vi phạm pháp luật Việt Nam',
              ].map((rule) => (
                <li key={rule} style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                  {rule}
                </li>
              ))}
            </ol>
          </div>

          {/* Footer links */}
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.8 }}>
            <Link href="/reddit" style={{ color: 'inherit' }}>
              Trang chủ
            </Link>{' '}
            •{' '}
            <Link href="/reddit/help" style={{ color: 'inherit' }}>
              Trợ giúp
            </Link>{' '}
            •{' '}
            <Link href="/reddit/privacy" style={{ color: 'inherit' }}>
              Chính sách
            </Link>{' '}
            •{' '}
            <Link href="/reddit/terms" style={{ color: 'inherit' }}>
              Điều khoản
            </Link>
            <br />
            Trekky Community © 2025
          </p>
        </aside>
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: 'Trekky – Cộng đồng phượt thủ Việt Nam',
    description: 'Khám phá, kết nối và chia sẻ hành trình phượt thủ cùng cộng đồng Trekky.',
  }
}
