import type { CollectionConfig } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'

export const Comments: CollectionConfig<'comments'> = {
  slug: 'comments',
  access: {
    create: authenticated,
    read: anyone,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true

      return {
        author: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true

      return {
        author: {
          equals: user.id,
        },
      }
    },
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['post', 'author', 'createdAt'],
  },
  fields: [
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'reddit-posts',
      required: true,
      index: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments',
      index: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ req, operation, value }) => {
            if (operation === 'create' && req.user) {
              return req.user.id
            }

            return value
          },
        ],
      },
    },
    {
      name: 'upvotes',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
      access: {
        update: () => false,
      },
    },
    {
      name: 'downvotes',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
      access: {
        update: () => false,
      },
    },
  ],
  timestamps: true,
}
