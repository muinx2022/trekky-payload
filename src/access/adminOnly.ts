import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type IsAdmin = (args: AccessArgs<User>) => boolean

export const adminOnly: IsAdmin = ({ req: { user } }) => {
  return Boolean(user?.roles?.includes('admin'))
}
