import api from './api'

export async function getNotifications() {
  const response = await api.get('notifications/')
  return response.data.results || response.data
}