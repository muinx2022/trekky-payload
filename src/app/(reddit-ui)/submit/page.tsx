import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { Navbar } from '../Navbar'
import { SubmitForm } from './SubmitForm'

export const dynamic = 'force-dynamic'

export default async function SubmitPage() {
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

  const payload = await getPayload({ config: configPromise })
  const communitiesResult = await payload.find({
    collection: 'communities',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  if (communitiesResult.totalDocs === 0) {
    redirect('/admin/collections/communities/create')
  }

  return (
    <>
      <Navbar username={user.username ?? null} />
      <SubmitForm communities={communitiesResult.docs} token={token} username={user.username ?? ''} />
    </>
  )
}
