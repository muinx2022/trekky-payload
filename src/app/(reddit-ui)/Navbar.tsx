import Link from 'next/link'

import { NavUser } from './NavUser'

export function Navbar({
  username,
  avatarURL = null,
}: {
  username: string | null
  avatarURL?: string | null
}) {
  const isLoggedIn = Boolean(username)

  return (
    <header className="winku-header">
      <div className="winku-header__inner">
        <Link href="/" className="winku-brand">
          <span className="winku-brand__icon">T</span>
          Trekky
        </Link>

        <form action="/reddit" method="get" className="winku-search" role="search" aria-label="Tìm kiếm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input type="text" name="q" placeholder="Tìm..." />
          <button type="submit" className="winku-search__btn">
            Search
          </button>
        </form>

        {isLoggedIn && (
          <Link href="/submit" className="winku-header-submit-btn">
            + Đăng bài
          </Link>
        )}

        <NavUser username={username} avatarURL={avatarURL} />
      </div>
    </header>
  )
}
