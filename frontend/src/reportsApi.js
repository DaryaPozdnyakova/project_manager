import api from './api'

export async function downloadProjectReport(projectId, format) {
  const response = await api.get(`projects/${projectId}/report_${format}/`, {
    responseType: 'blob',
  })

  const extension = format === 'excel' ? 'xlsx' : 'pdf'
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')

  link.href = url
  link.download = `project-report.${extension}`
  link.click()

  window.URL.revokeObjectURL(url)
}

export async function downloadProjectPassportTemplate(projectId) {
  const response = await api.get(`projects/${projectId}/passport_template/`, {
    responseType: 'blob',
  })

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')

  link.href = url
  link.download = 'Шаблон паспорта проекта.xlsx'
  link.click()

  window.URL.revokeObjectURL(url)
}