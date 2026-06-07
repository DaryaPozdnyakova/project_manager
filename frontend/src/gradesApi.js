import api from './api'

export async function getGrades(projectId) {
  const response = await api.get(`grades/?project=${projectId}`)
  return response.data.results || response.data
}

export async function createGrade(data) {
  const response = await api.post('grades/', data)
  return response.data
}

export async function updateGrade(id, data) {
  const response = await api.patch(`grades/${id}/`, data)
  return response.data
}

export async function deleteGrade(id) {
  await api.delete(`grades/${id}/`)
}