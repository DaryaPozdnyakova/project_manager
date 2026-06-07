import api from './api'

export async function getProjectFolders(projectId) {
  const response = await api.get(`project-folders/?project=${projectId}`)
  return response.data.results || response.data
}

export async function getProjectFiles(projectId) {
  const response = await api.get(`project-files/?project=${projectId}`)
  return response.data.results || response.data
}

export async function createProjectFile(formData) {
  const response = await api.post('project-files/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function deleteProjectFile(id) {
  await api.delete(`project-files/${id}/`)
}

export async function createProjectFolder(data) {
  const response = await api.post('project-folders/', data)
  return response.data
}

export async function updateProjectFolder(id, data) {
  const response = await api.patch(`project-folders/${id}/`, data)
  return response.data
}

export async function deleteProjectFolder(id) {
  await api.delete(`project-folders/${id}/`)
}

export async function updateProjectFile(id, data) {
  const response = await api.patch(`project-files/${id}/`, data)
  return response.data
}