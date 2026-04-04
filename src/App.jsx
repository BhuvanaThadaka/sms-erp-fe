import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'

// Pages
import LoginPage from './pages/LoginPage'
import RegistrationPage from './pages/RegistrationPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminClasses from './pages/admin/AdminClasses'
import AdminSubjects from './pages/admin/AdminSubjects'
import AdminStudentAssignment from './pages/admin/AdminStudentAssignment'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherAttendance from './pages/teacher/TeacherAttendance'
import TeacherSessions from './pages/teacher/TeacherSessions'
import TeacherSchedule from './pages/teacher/TeacherSchedule'
import TeacherReports from './pages/teacher/TeacherReports'
import TeacherMarksEntry from './pages/teacher/TeacherMarksEntry'
import TeacherClassPerformance from './pages/teacher/TeacherClassPerformance'
import TeacherAcademicReports from './pages/teacher/TeacherAcademicReports'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentAttendance from './pages/student/StudentAttendance'
import StudentNotes from './pages/student/StudentNotes'
import StudentSchedule from './pages/student/StudentSchedule'
import StudentReports from './pages/student/StudentReports'
import StudentReportCard from './pages/student/StudentReportCard'
import EventsPage from './pages/EventsPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/layout/Layout'

function PrivateRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.map(r => r.toUpperCase()).includes(user?.role?.toUpperCase())) return <Navigate to="/" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const role = user.role?.toUpperCase()
  if (role === 'ADMIN') return <Navigate to="/admin" replace />
  if (role === 'TEACHER') return <Navigate to="/teacher" replace />
  if (role === 'STUDENT') return <Navigate to="/student" replace />
  return <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <RoleRedirect /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <RoleRedirect /> : <RegistrationPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <RoleRedirect /> : <ForgotPasswordPage />} />
      <Route path="/reset-password" element={isAuthenticated ? <RoleRedirect /> : <ResetPasswordPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<RoleRedirect />} />

        {/* Admin */}
        <Route path="admin" element={<PrivateRoute roles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
        <Route path="admin/users" element={<PrivateRoute roles={['ADMIN']}><AdminUsers /></PrivateRoute>} />
        <Route path="admin/classes" element={<PrivateRoute roles={['ADMIN']}><AdminClasses /></PrivateRoute>} />
        <Route path="admin/subjects" element={<PrivateRoute roles={['ADMIN']}><AdminSubjects /></PrivateRoute>} />
        <Route path="admin/student-assignment" element={<PrivateRoute roles={['ADMIN']}><AdminStudentAssignment /></PrivateRoute>} />
        <Route path="admin/audit-logs" element={<PrivateRoute roles={['ADMIN']}><AdminAuditLogs /></PrivateRoute>} />

        {/* Teacher */}
        <Route path="teacher" element={<PrivateRoute roles={['TEACHER']}><TeacherDashboard /></PrivateRoute>} />
        <Route path="teacher/attendance" element={<PrivateRoute roles={['TEACHER']}><TeacherAttendance /></PrivateRoute>} />
        <Route path="teacher/marks" element={<PrivateRoute roles={['TEACHER']}><TeacherMarksEntry /></PrivateRoute>} />
        <Route path="teacher/class-performance" element={<PrivateRoute roles={['TEACHER']}><TeacherClassPerformance /></PrivateRoute>} />
        <Route path="teacher/sessions" element={<PrivateRoute roles={['TEACHER']}><TeacherSessions /></PrivateRoute>} />
        <Route path="teacher/schedule" element={<PrivateRoute roles={['TEACHER']}><TeacherSchedule /></PrivateRoute>} />
        <Route path="teacher/reports" element={<PrivateRoute roles={['TEACHER']}><TeacherReports /></PrivateRoute>} />
        <Route path="teacher/academic-reports" element={<PrivateRoute roles={['TEACHER']}><TeacherAcademicReports /></PrivateRoute>} />

        {/* Student */}
        <Route path="student" element={<PrivateRoute roles={['STUDENT']}><StudentDashboard /></PrivateRoute>} />
        <Route path="student/report-card" element={<PrivateRoute roles={['STUDENT']}><StudentReportCard /></PrivateRoute>} />
        <Route path="student/attendance" element={<PrivateRoute roles={['STUDENT']}><StudentAttendance /></PrivateRoute>} />
        <Route path="student/notes" element={<PrivateRoute roles={['STUDENT']}><StudentNotes /></PrivateRoute>} />
        <Route path="student/schedule" element={<PrivateRoute roles={['STUDENT']}><StudentSchedule /></PrivateRoute>} />
        <Route path="student/reports" element={<PrivateRoute roles={['STUDENT']}><StudentReports /></PrivateRoute>} />

        {/* Shared */}
        <Route path="events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
        <Route path="profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  )
}
