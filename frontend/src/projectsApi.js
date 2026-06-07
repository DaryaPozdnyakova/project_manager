import api from './api'

export async function getProjects() {
  const response = await api.get('projects/')
  return response.data.results || response.data
}

export async function inviteToProject(projectId, email, role = '') {
  const response = await api.post(`projects/${projectId}/invite/`, {
    email,
    role,
  })

  return response.data
}

export async function updateProject(id, data) {
  const response = await api.patch(`projects/${id}/`, data)
  return response.data
}

export async function deleteProject(id) {
  await api.delete(`projects/${id}/`)
}

export async function createProject(data) {
  const response = await api.post('projects/', data)
  return response.data
}