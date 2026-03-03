import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/utilities/getCurrentUser'
import { Navbar } from '../Navbar'
import { SettingsForm } from './SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) redirect('/?toast=login-required')

  const user = await getCurrentUser()
  if (!user) redirect('/?toast=login-required')

  return (
    <>
      <Navbar username={user.username ?? null} />
      <SettingsForm user={user} token={token} />
    </>
  )
}
