import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getCurrentUser } from '@/utilities/getCurrentUser'
import { Navbar } from '../Navbar'
import { SubmitForm } from './SubmitForm'

export const dynamic = 'force-dynamic'

export default async function SubmitPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) redirect('/?toast=login-required')

  const user = await getCurrentUser()
  if (!user) redirect('/?toast=login-required')

  const payload = await getPayload({ config: configPromise })
  const communitiesResult = await payload.find({
    collection: 'communities',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return (
    <>
      <Navbar username={user.username ?? null} />
      {communitiesResult.totalDocs === 0 ? (
        <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 16px' }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Chưa có cộng đồng nào</p>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>
            Cần tạo ít nhất một cộng đồng trước khi đăng bài.
          </p>
        </div>
      ) : (
        <SubmitForm communities={communitiesResult.docs} token={token} username={user.username ?? ''} />
      )}
    </>
  )
}
