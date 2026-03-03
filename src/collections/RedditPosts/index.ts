import type { CollectionConfig } from 'payload'

import { slugField } from 'payload'

import { anyone } from '@/access/anyone'
import { authenticated } from '@/access/authenticated'
import { vietnameseSlug } from '@/utilities/vietnameseSlug'

export const RedditPosts: CollectionConfig<'reddit-posts'> = {
  slug: 'reddit-posts',
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' || data.generateSlug) {
          data.slug = vietnameseSlug(data.title ?? '')
        }
        return data
      },
      // Gallery hook: if galleryItems[] is sent in the body, create/update the
      // Gallery doc and set data.gallery to its ID. Runs in the same DB connection
      // as the parent request, so no deadlock risk.
      async ({ data, req }) => {
        if (!Array.isArray(data.galleryItems)) return data

        const items = (data.galleryItems as number[]).filter(
          (id) => typeof id === 'number' && id > 0,
        )

        const existingGalleryId =
          typeof data.gallery === 'number' && data.gallery > 0 ? data.gallery : null

        if (existingGalleryId) {
          await req.payload.update({
            collection: 'galleries',
            id: existingGalleryId,
            data: { items },
            overrideAccess: true,
          })
        } else if (items.length > 0) {
          const gallery = await req.payload.create({
            collection: 'galleries',
            data: { items },
            overrideAccess: true,
          })
          data.gallery = gallery.id
        }

        // Clear the temp field so it isn't stored
        data.galleryItems = null
        return data
      },
    ],
  },
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
    useAsTitle: 'title',
    defaultColumns: ['title', 'community', 'author', 'upvotes', 'downvotes', 'createdAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
    },
    slugField({
      fieldToUse: 'title',
    }),
    {
      name: 'content',
      type: 'textarea',
      defaultValue: '',
    },
    {
      name: 'gallery',
      type: 'relationship',
      relationTo: 'galleries',
      hasMany: false,
      admin: {
        description: 'Gallery ảnh/video của bài viết.',
      },
    },
    {
      // Temporary field: client sends media IDs here; the beforeChange hook
      // creates/updates the Gallery doc and clears this field before saving.
      name: 'galleryItems',
      type: 'json',
      admin: {
        hidden: true,
        description: 'Dùng nội bộ — danh sách media ID để tạo/cập nhật gallery.',
      },
    },
    {
      name: 'community',
      type: 'relationship',
      relationTo: 'communities',
      required: true,
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
      name: 'hidden',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Ẩn bài viết khỏi các feed công khai.',
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
