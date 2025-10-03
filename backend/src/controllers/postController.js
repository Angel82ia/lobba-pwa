import * as Post from '../models/Post.js'
import * as PostLike from '../models/PostLike.js'
import logger from '../utils/logger.js'

export const createPost = async (req, res) => {
  try {
    const { content, imageUrl } = req.body
    const userId = req.user.id

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'El contenido es requerido' })
    }

    const post = await Post.createPost({ userId, content, imageUrl })
    res.status(201).json(post)
  } catch (error) {
    logger.error('Create post error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getFeed = async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20 } = req.query

    const posts = await Post.findFeedPosts(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    })
    res.json(posts)
  } catch (error) {
    logger.error('Get feed error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getAllPosts = async (req, res) => {
  try {
    const userId = req.user?.id
    const { page = 1, limit = 20 } = req.query

    const posts = await Post.findAllPosts({
      page: parseInt(page),
      limit: parseInt(limit),
      userId
    })
    res.json(posts)
  } catch (error) {
    logger.error('Get all posts error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    const post = await Post.findPostById(id, userId)
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' })
    }

    res.json(post)
  } catch (error) {
    logger.error('Get post error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params
    const viewerId = req.user?.id
    const { page = 1, limit = 20 } = req.query

    const posts = await Post.findPostsByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      viewerId
    })
    res.json(posts)
  } catch (error) {
    logger.error('Get user posts error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const updates = req.body

    const post = await Post.findPostById(id)
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' })
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ message: 'No autorizado para editar este post' })
    }

    const updatedPost = await Post.updatePost(id, updates)
    res.json(updatedPost)
  } catch (error) {
    logger.error('Update post error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const post = await Post.findPostById(id)
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' })
    }

    if (post.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para eliminar este post' })
    }

    await Post.deletePost(id)
    res.json({ message: 'Post eliminado correctamente' })
  } catch (error) {
    logger.error('Delete post error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const likePost = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const post = await Post.findPostById(id)
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado' })
    }

    const like = await PostLike.likePost({ postId: id, userId })
    if (!like) {
      return res.status(400).json({ message: 'Ya has dado like a este post' })
    }

    await Post.incrementLikes(id)
    res.json({ message: 'Like añadido correctamente' })
  } catch (error) {
    logger.error('Like post error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const unlikePost = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const unlike = await PostLike.unlikePost({ postId: id, userId })
    if (!unlike) {
      return res.status(404).json({ message: 'No has dado like a este post' })
    }

    await Post.decrementLikes(id)
    res.json({ message: 'Like eliminado correctamente' })
  } catch (error) {
    logger.error('Unlike post error:', error)
    res.status(500).json({ message: error.message })
  }
}
