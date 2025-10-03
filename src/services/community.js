import apiClient from './api'

export const createPost = async (postData) => {
  const response = await apiClient.post('/posts', postData)
  return response.data
}

export const getFeed = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/posts/feed', { params: { page, limit } })
  return response.data
}

export const getAllPosts = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/posts/all', { params: { page, limit } })
  return response.data
}

export const getUserPosts = async (userId, page = 1, limit = 20) => {
  const response = await apiClient.get(`/posts/user/${userId}`, { params: { page, limit } })
  return response.data
}

export const getPostById = async (postId) => {
  const response = await apiClient.get(`/posts/${postId}`)
  return response.data
}

export const updatePost = async (postId, updates) => {
  const response = await apiClient.put(`/posts/${postId}`, updates)
  return response.data
}

export const deletePost = async (postId) => {
  const response = await apiClient.delete(`/posts/${postId}`)
  return response.data
}

export const likePost = async (postId) => {
  const response = await apiClient.post(`/posts/${postId}/like`)
  return response.data
}

export const unlikePost = async (postId) => {
  const response = await apiClient.delete(`/posts/${postId}/like`)
  return response.data
}

export const createComment = async (postId, content) => {
  const response = await apiClient.post('/comments', { postId, content })
  return response.data
}

export const getPostComments = async (postId, page = 1, limit = 50) => {
  const response = await apiClient.get(`/comments/post/${postId}`, { params: { page, limit } })
  return response.data
}

export const deleteComment = async (commentId) => {
  const response = await apiClient.delete(`/comments/${commentId}`)
  return response.data
}

export const followUser = async (userId) => {
  const response = await apiClient.post(`/community/follow/${userId}`)
  return response.data
}

export const unfollowUser = async (userId) => {
  const response = await apiClient.delete(`/community/follow/${userId}`)
  return response.data
}

export const getFollowers = async (userId, page = 1, limit = 50) => {
  const response = await apiClient.get(`/community/followers/${userId}`, { params: { page, limit } })
  return response.data
}

export const getFollowing = async (userId, page = 1, limit = 50) => {
  const response = await apiClient.get(`/community/following/${userId}`, { params: { page, limit } })
  return response.data
}

export const getUserProfile = async (userId) => {
  const response = await apiClient.get(`/community/profile/${userId}`)
  return response.data
}
