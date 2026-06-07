import api from './api'

export async function getTasks(projectId) {
  const response = await api.get(`tasks/?project=${projectId}`)
  return response.data.results || response.data
}

export async function createTask(data) {
  const response = await api.post('tasks/', data)
  return response.data
}

export async function updateTask(id, data) {
  const response = await api.patch(`tasks/${id}/`, data)
  return response.data
}

export async function deleteTask(id) {
  await api.delete(`tasks/${id}/`)
}

export async function selfAssignTask(id) {
  const response = await api.post(`tasks/${id}/self_assign/`)
  return response.data
}

export async function cancelSelfAssignTask(id) {
  const response = await api.post(`tasks/${id}/cancel_self_assign/`)
  return response.data
}