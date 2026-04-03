import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Request: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: unwrap data, handle errors
api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  (err) => {
    const msg = err.response?.data?.message || 'Something went wrong'
    if (err.response?.status === 401) {
      localStorage.removeItem('erp_token')
      localStorage.removeItem('erp_user')
      window.location.href = '/login'
    } else if (err.response?.status !== 403) {
      toast.error(Array.isArray(msg) ? msg[0] : msg)
    }
    return Promise.reject(err)
  }
)

// ─── Auth ──────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ─── Users ─────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getMe: () => api.get('/users/me'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
  getStudentsByClass: (classId) => api.get(`/users/class/${classId}/students`),
}

// ─── Classes ───────────────────────────────────────────
export const classesAPI = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.patch(`/classes/${id}`, data),
  assignTeacher: (id, teacherId) => api.post(`/classes/${id}/assign-teacher`, { teacherId }),
}

// ─── Attendance ────────────────────────────────────────
export const attendanceAPI = {
  mark: (data) => api.post('/attendance/mark', data),
  bulkMark: (data) => api.post('/attendance/bulk-mark', data),
  getAll: (params) => api.get('/attendance', { params }),
  getStudentSummary: (studentId, academicYear) =>
    api.get(`/attendance/student/${studentId}/summary`, { params: { academicYear } }),
  getClassStats: (classId, date) =>
    api.get(`/attendance/class/${classId}/stats`, { params: { date } }),
}

// ─── Sessions ──────────────────────────────────────────
export const sessionsAPI = {
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  create: (data) => api.post('/sessions', data),
  update: (id, data) => api.patch(`/sessions/${id}`, data),
}

// ─── Notes ─────────────────────────────────────────────
export const notesAPI = {
  getByClass: (classId, params) => api.get(`/notes/class/${classId}`, { params }),
  create: (data) => api.post('/notes', data),
  delete: (id) => api.delete(`/notes/${id}`),
}

// ─── Schedule ──────────────────────────────────────────
export const scheduleAPI = {
  getByClass: (classId, params) => api.get(`/schedule/class/${classId}`, { params }),
  getByTeacher: (teacherId, params) => api.get(`/schedule/teacher/${teacherId}`, { params }),
  getMy: (params) => api.get('/schedule/my', { params }),
  create: (data) => api.post('/schedule', data),
  reschedule: (id, data) => api.patch(`/schedule/${id}/reschedule`, data),
  delete: (id) => api.delete(`/schedule/${id}`),
}

// ─── Events ────────────────────────────────────────────
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.patch(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
}

// ─── Reports ───────────────────────────────────────────
export const reportsAPI = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  generate: (data) => api.post('/reports/generate', data),
  bulkGenerate: (data) => api.post('/reports/bulk-generate', data),
}

// ─── Audit Logs ────────────────────────────────────────
export const auditAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
}

// ─── Subjects ──────────────────────────────────────────
export const subjectsAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getByClass: (classId, params) => api.get(`/subjects/class/${classId}`, { params }),
  getMy: (params) => api.get('/subjects/my', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.patch(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

// ─── Marks ─────────────────────────────────────────────
export const marksAPI = {
  enter: (data) => api.post('/marks', data),
  bulkEnter: (data) => api.post('/marks/bulk', data),
  getAll: (params) => api.get('/marks', { params }),
  getStudentReportCard: (studentId, params) => api.get(`/marks/student/${studentId}/report-card`, { params }),
  getClassPerformance: (classId, params) => api.get(`/marks/class/${classId}/performance`, { params }),
  update: (id, data) => api.patch(`/marks/${id}`, data),
}

// ─── Academic Reports ──────────────────────────────────
export const academicReportsAPI = {
  generate: (data) => api.post('/academic-reports/generate', data),
  bulkGenerate: (data) => api.post('/academic-reports/bulk-generate', data),
  getAll: (params) => api.get('/academic-reports', { params }),
  getById: (id) => api.get(`/academic-reports/${id}`),
}

// ─── Class Assignment (users) ──────────────────────────
export const assignmentAPI = {
  assignStudent: (studentId, classId) => api.post(`/users/${studentId}/assign-class`, { classId }),
  bulkAssign: (studentIds, classId) => api.post('/users/bulk-assign-class', { studentIds, classId }),
}

// ─── Notifications ─────────────────────────────────────
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

export default api
