import api from './api'

export async function login(username, password) {
  const response = await api.post('auth/token/', {
    username,
    password,
  })

  localStorage.setItem('access', response.data.access)
  localStorage.setItem('refresh', response.data.refresh)

  return response.data
}

export function logout() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
}

export async function getMe() {
  const response = await api.get('users/me/')
  return response.data
}

export async function register({ username, email, full_name, group_number, password }) {
  const response = await api.post('auth/register/', {
    username,
    email,
    full_name,
    group_number,
    password,
  })

  return response.data
}

export async function updateMe(data) {
  const response = await api.patch('users/me/', data)
  return response.data
}

export async function changePassword(data) {
  const response = await api.post('users/change_password/', data)
  return response.data
}

export async function updateUser(id, data) {
  const response = await api.patch(`users/${id}/`, data)
  return response.data
}

export async function requestPasswordReset(email) {
  const response = await api.post('/password-reset/', {
    email,
  })

  return response.data
}

export async function confirmPasswordReset(uid, token, newPassword) {
  const response = await api.post('/password-reset-confirm/', {
    uid,
    token,
    new_password: newPassword,
  })

  return response.data
}

export async function getAdminMetrics() {
  const response = await api.get('/admin-metrics/')
  return response.data
}

export async function getTeacherTaskControl() {
  const response = await api.get('/teacher-task-control/')
  return response.data
}