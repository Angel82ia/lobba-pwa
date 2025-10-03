import * as UserFollow from '../models/UserFollow.js'
import * as User from '../models/User.js'
import * as Post from '../models/Post.js'

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params
    const followerId = req.user.id

    if (followerId === userId) {
      return res.status(400).json({ message: 'No puedes seguirte a ti mismo' })
    }

    const userToFollow = await User.findUserById(userId)
    if (!userToFollow) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const follow = await UserFollow.followUser({ followerId, followingId: userId })
    if (!follow) {
      return res.status(400).json({ message: 'Ya sigues a este usuario' })
    }

    res.json({ message: 'Usuario seguido correctamente' })
  } catch (error) {
    console.error('Follow user error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params
    const followerId = req.user.id

    const unfollow = await UserFollow.unfollowUser({ followerId, followingId: userId })
    if (!unfollow) {
      return res.status(404).json({ message: 'No sigues a este usuario' })
    }

    res.json({ message: 'Usuario dejado de seguir correctamente' })
  } catch (error) {
    console.error('Unfollow user error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 50 } = req.query

    const followers = await UserFollow.findFollowers(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    })
    res.json(followers)
  } catch (error) {
    console.error('Get followers error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 50 } = req.query

    const following = await UserFollow.findFollowing(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    })
    res.json(following)
  } catch (error) {
    console.error('Get following error:', error)
    res.status(500).json({ message: error.message })
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const viewerId = req.user?.id

    const user = await User.findUserById(userId)
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const followerCount = await UserFollow.getFollowerCount(userId)
    const followingCount = await UserFollow.getFollowingCount(userId)
    const posts = await Post.findPostsByUserId(userId, { page: 1, limit: 10, viewerId })
    const isFollowing = viewerId ? await UserFollow.isFollowing(viewerId, userId) : false

    delete user.password_hash

    res.json({
      user,
      stats: {
        followers: followerCount,
        following: followingCount,
        posts: posts.length
      },
      isFollowing,
      recentPosts: posts
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ message: error.message })
  }
}
