import api from './api'

export async function getProjectMembers(projectId) {
  const response = await api.get(`project-members/?project=${projectId}`)
  return response.data.results || response.data
}

export async function deleteProjectMember(memberId) {
  await api.delete(`project-members/${memberId}/`)
}

export async function updateProjectMember(memberId, data) {
  const response = await api.patch(
    `project-members/${memberId}/`,
    data
  )

  return response.data
}