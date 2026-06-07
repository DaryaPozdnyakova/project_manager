import api from './api'

export async function getProjectActivities(projectId) {
  const response = await api.get(`project-activities/?project=${projectId}`)
  return response.data.results || response.data
}