import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'

export const Galleries: CollectionConfig<'galleries'> = {
  slug: 'galleries',
  access: {
    create: authenticated,
    read: anyone,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Danh sách ảnh/video trong gallery.',
      },
    },
  ],
  timestamps: true,
}
