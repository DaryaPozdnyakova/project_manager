import api from './api'

export async function getSubmissions(taskId) {
  const response = await api.get(`submissions/?task=${taskId}`)
  return response.data.results || response.data
}

export async function createSubmission(formData) {
  const response = await api.post('submissions/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function updateSubmission(id, formData) {
  const response = await api.patch(`submissions/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function createSubmissionFile(formData) {
  const response = await api.post('submission-files/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function deleteSubmission(id) {
  await api.delete(`submissions/${id}/`)
}

export async function deleteSubmissionFile(id) {
  await api.delete(`submission-files/${id}/`)
}

export async function reviewSubmission(id, data) {
  const response = await api.patch(`submissions/${id}/`, data)
  return response.data
}