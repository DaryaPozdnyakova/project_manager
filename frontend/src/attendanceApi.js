import api from './api'

export async function getAttendance(projectId) {
  let results = []
  let url = `/attendance/?project=${projectId}`

  while (url) {
    const response = await api.get(url)
    const data = response.data

    if (Array.isArray(data)) {
      results = data
      url = null
    } else {
      results = [...results, ...(data.results || [])]
      url = data.next
        ? data.next.replace("http://127.0.0.1:8000/api", "")
        : null
    }
  }

  return results
}

export async function createAttendance(data) {
  const response = await api.post('attendance/', data)
  return response.data
}

export async function updateAttendance(id, data) {
  const response = await api.patch(`attendance/${id}/`, data)
  return response.data
}

export async function deleteAttendance(id) {
  await api.delete(`attendance/${id}/`)
}

export async function deleteAttendanceDate(projectId, date) {
  await api.delete(`attendance/delete-date/?project=${projectId}&date=${date}`)
}