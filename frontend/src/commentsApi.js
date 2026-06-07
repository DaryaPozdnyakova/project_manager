import api from './api'

export async function getComments(taskId) {
  const response = await api.get(`comments/?task=${taskId}`)
  return response.data.results || response.data
}

export async function createComment(taskId, text, parent = null) {
  const response = await api.post('comments/', {
    task: taskId,
    text,
    parent,
  })

  return response.data
}

export async function updateComment(id, text) {
  const response = await api.patch(`comments/${id}/`, {
    text,
  })

  return response.data
}

export async function deleteComment(id) {
  await api.delete(`comments/${id}/`)
}