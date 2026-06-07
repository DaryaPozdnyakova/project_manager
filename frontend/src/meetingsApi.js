import api from './api'

export async function getMeetings(projectId) {
  const response = await api.get(`meetings/?project=${projectId}`)
  return response.data.results || response.data
}

export async function createMeeting(data) {
  const response = await api.post('meetings/', data)
  return response.data
}

export async function deleteMeeting(id) {
  await api.delete(`meetings/${id}/`)
}