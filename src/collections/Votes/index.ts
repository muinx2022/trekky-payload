import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  PayloadRequest,
  Where,
} from 'payload'

import { APIError } from 'payload'

import { authenticated } from '@/access/authenticated'
import type { Vote } from '@/payload-types'

const getRelationID = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (!value || typeof value !== 'object') return null

  const id = (value as { id?: unknown }).id
  return typeof id === 'number' ? id : null
}

const syncTargetVotes = async (args: {
  targetType: 'post' | 'comment'
  targetID: number
  req: PayloadRequest
}) => {
  const { targetID, targetType, req } = args

  const voteTargetWhere: Where =
    targetType === 'post'
      ? {
          post: {
            equals: targetID,
          },
        }
      : {
          comment: {
            equals: targetID,
          },
        }

  const { docs } = await req.payload.find({
    collection: 'votes',
    where: {
      and: [
        {
          targetType: {
            equals: targetType,
          },
        },
        voteTargetWhere,
      ],
    },
    limit: 10000,
    pagination: false,
    depth: 0,
    req,
    // This aggregation must include every vote on target, not only the current user's rows.
    overrideAccess: true,
  })

  const upvotes = docs.filter((vote) => vote.value === 1).length
  const downvotes = docs.filter((vote) => vote.value === -1).length

  if (targetType === 'post') {
    await req.payload.update({
      collection: 'reddit-posts',
      id: targetID,
      data: {
        upvotes,
        downvotes,
      },
      req,
      overrideAccess: true,
    })
    return
  }

  await req.payload.update({
    collection: 'comments',
    id: targetID,
    data: {
      upvotes,
      downvotes,
    },
    req,
    overrideAccess: true,
  })
}

const syncVotesAfterChange: CollectionAfterChangeHook<Vote> = async ({ doc, previousDoc, req }) => {
  const currentPostID = doc.targetType === 'post' ? getRelationID(doc.post) : null
  const currentCommentID = doc.targetType === 'comment' ? getRelationID(doc.comment) : null
  const previousPostID = previousDoc?.targetType === 'post' ? getRelationID(previousDoc.post) : null
  const previousCommentID =
    previousDoc?.targetType === 'comment' ? getRelationID(previousDoc.comment) : null

  if (currentPostID) {
    await syncTargetVotes({
      targetType: 'post',
      targetID: currentPostID,
      req,
    })
  }

  if (currentCommentID) {
    await syncTargetVotes({
      targetType: 'comment',
      targetID: currentCommentID,
      req,
    })
  }

  if (previousPostID && previousPostID !== currentPostID) {
    await syncTargetVotes({
      targetType: 'post',
      targetID: previousPostID,
      req,
    })
  }

  if (previousCommentID && previousCommentID !== currentCommentID) {
    await syncTargetVotes({
      targetType: 'comment',
      targetID: previousCommentID,
      req,
    })
  }

  return doc
}

const syncVotesAfterDelete: CollectionAfterDeleteHook<Vote> = async ({ doc, req }) => {
  const postID = doc.targetType === 'post' ? getRelationID(doc.post) : null
  const commentID = doc.targetType === 'comment' ? getRelationID(doc.comment) : null

  if (postID) {
    await syncTargetVotes({
      targetType: 'post',
      targetID: postID,
      req,
    })
  }

  if (commentID) {
    await syncTargetVotes({
      targetType: 'comment',
      targetID: commentID,
      req,
    })
  }

  return doc
}

const validateVote: CollectionBeforeValidateHook<Vote> = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!req.user) {
    throw new APIError('You must be logged in to vote.', 401)
  }

  const nextData = data ?? {}
  const targetType = nextData.targetType ?? originalDoc?.targetType
  const post = nextData.post ?? originalDoc?.post
  const comment = nextData.comment ?? originalDoc?.comment

  if (!targetType) {
    throw new APIError('targetType is required.', 400)
  }

  const postID = getRelationID(post)
  const commentID = getRelationID(comment)

  if (targetType === 'post' && !postID) {
    throw new APIError('post is required when targetType is post.', 400)
  }

  if (targetType === 'comment' && !commentID) {
    throw new APIError('comment is required when targetType is comment.', 400)
  }

  if (targetType === 'post') {
    nextData.comment = null
  }

  if (targetType === 'comment') {
    nextData.post = null
  }

  if (operation === 'create') {
    const where: Where =
      targetType === 'post'
        ? {
            and: [
              {
                targetType: {
                  equals: 'post',
                },
              },
              {
                post: {
                  equals: postID,
                },
              },
              {
                user: {
                  equals: req.user.id,
                },
              },
            ],
          }
        : {
            and: [
              {
                targetType: {
                  equals: 'comment',
                },
              },
              {
                comment: {
                  equals: commentID,
                },
              },
              {
                user: {
                  equals: req.user.id,
                },
              },
            ],
          }

    const existingVote = await req.payload.find({
      collection: 'votes',
      where,
      depth: 0,
      limit: 1,
      req,
      overrideAccess: false,
    })

    if (existingVote.totalDocs > 0) {
      throw new APIError('You already voted on this target.', 409)
    }
  }

  return nextData
}

export const Votes: CollectionConfig<'votes'> = {
  slug: 'votes',
  access: {
    create: authenticated,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true

      return {
        user: {
          equals: user.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true

      return {
        user: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true

      return {
        user: {
          equals: user.id,
        },
      }
    },
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['targetType', 'value', 'user', 'createdAt'],
  },
  fields: [
    {
      name: 'targetType',
      type: 'select',
      options: ['post', 'comment'],
      required: true,
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'reddit-posts',
      index: true,
      admin: {
        condition: (_, siblingData) => siblingData.targetType === 'post',
      },
    },
    {
      name: 'comment',
      type: 'relationship',
      relationTo: 'comments',
      index: true,
      admin: {
        condition: (_, siblingData) => siblingData.targetType === 'comment',
      },
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      min: -1,
      max: 1,
      validate: (value?: number | null) => {
        if (value !== -1 && value !== 1) {
          return 'Vote value must be either -1 or 1.'
        }

        return true
      },
    },
    {
      name: 'user',
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
  ],
  hooks: {
    beforeValidate: [validateVote],
    afterChange: [syncVotesAfterChange],
    afterDelete: [syncVotesAfterDelete],
  },
  timestamps: true,
}
