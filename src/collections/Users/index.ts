import type { CollectionConfig } from 'payload'

import { adminOnly } from '../../access/adminOnly'
import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: adminOnly,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      saveToJWT: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'moderator', 'user'],
      defaultValue: ['user'],
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'oauthProvider',
      type: 'select',
      options: [
        { label: 'Google', value: 'google' },
        { label: 'GitHub', value: 'github' },
        { label: 'Facebook', value: 'facebook' },
      ],
      admin: {
        description: 'OAuth provider dùng để tạo tài khoản',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'oauthId',
      type: 'text',
      index: true,
      admin: {
        description: 'Provider user ID',
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
