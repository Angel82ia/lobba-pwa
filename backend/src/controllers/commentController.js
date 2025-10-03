import * as Comment from '../models/Comment.js'
import * as Post from '../models/Post.js'
import logger from '../utils/logger.js'

export const createComment = async (req, res) => {
  try {
    const { postId, content } = req.body
    const userId = req.user.id

    if (!postId || !content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Post ID y contenido son requeridos' })
    }

    const post = await Post.findPostById(postId)
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' })
    }

    const comment = await Comment.createComment({ postId, userId, content })
    await Post.incrementComments(postId)

    res.status(201).json(comment)
  } catch (error) {
    logger.error('Create comment error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params
    const { page = 1, limit = 50 } = req.query

    const comments = await Comment.findCommentsByPostId(postId, {
      page: parseInt(page),
      limit: parseInt(limit)
    })
    res.json(comments)
  } catch (error) {
    logger.error('Get comments error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const comment = await Comment.findCommentById(id)
    if (!comment) {
      return res.status(404).json({ message: 'Comentario no encontrado' })
    }

    if (comment.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para eliminar este comentario' })
    }

    await Comment.deleteComment(id)
    await Post.decrementComments(comment.post_id)

    res.json({ message: 'Comentario eliminado correctamente' })
  } catch (error) {
    logger.error('Delete comment error:', error)
    res.status(500).json({ message: error.message })
  }
}
