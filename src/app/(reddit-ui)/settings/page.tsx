import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import type { User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { Navbar } from '../Navbar'
import { SettingsForm } from './SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) redirect('/?toast=login-required')

  const meRes = await fetch(`${getServerSideURL()}/api/users/me`, {
    headers: { Authorization: `JWT ${token}` },
    cache: 'no-store',
  })
  if (!meRes.ok) redirect('/?toast=login-required')

  const { user }: { user: User | null } = await meRes.json()
  if (!user) redirect('/?toast=login-required')

  return (
    <>
      <Navbar username={user.username ?? null} />
      <SettingsForm user={user} token={token} />
    </>
  )
}
