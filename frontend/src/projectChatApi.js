import api from './api'

export async function getProjectChatMessages(projectId) {
  const response = await api.get(`project-chat-messages/?project=${projectId}`)
  return response.data.results || response.data
}

export async function createProjectChatMessage(projectId, text) {
  const response = await api.post('project-chat-messages/', {
    project: projectId,
    text,
  })

  return response.data
}