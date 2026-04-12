import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { attendanceAPI, reportsAPI, sessionsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { StatCard, AttendanceRing, LoadingState } from '../../components/ui'
import { Activity, FileText, BookMarked, Clock, ChevronRight, Download } from 'lucide-react'
import { format } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { lastAttendanceUpdate, lastReportGenerated } = useSocket()
  const currentYear = '2024-2025'

  const { data: summary } = useQuery({
    queryKey: ['attendance-summary', user?._id, currentYear, lastAttendanceUpdate],
    queryFn: () => attendanceAPI.getStudentSummary(user._id, currentYear),
    enabled: !!user?._id,
  })

  const { data: reports } = useQuery({
    queryKey: ['my-reports', user?._id, lastReportGenerated],
    queryFn: () => reportsAPI.getAll({ academicYear: currentYear }),
    enabled: !!user?._id,
  })

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll({ academicYear: currentYear }),
  })

  const pieData = summary ? [
    { name: 'Present', value: summary.present, color: '#10B981' },
    { name: 'Absent', value: summary.absent, color: '#F43F5E' },
    { name: 'Late', value: summary.late, color: '#F59E0B' },
  ].filter(d => d.value > 0) : []

  const latestReport = reports?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Welcome back, {user?.firstName}! {format(new Date(), 'EEEE, MMM d')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard icon={Activity} label="Attendance" value={`${summary?.percentage || 0}%`} sub={`${summary?.present || 0} / ${summary?.total || 0} days`} color={summary?.percentage >= 75 ? 'jade' : 'rose'} />
        <StatCard icon={FileText} label="Reports" value={reports?.length || 0} sub="Academic reports" color="azure" />
        <StatCard icon={BookMarked} label="Sessions" value={sessions?.length || 0} sub="Scheduled sessions" color="amber" />
        <StatCard icon={Clock} label="Schedule" value="View All" sub="Weekly classes" color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance breakdown */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Attendance Breakdown</h2>
          {summary ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={pieData} cx={75} cy={75} innerRadius={50} outerRadius={70} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v, '']} contentStyle={{ background: '#161E35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-display font-bold text-2xl text-white">{summary.percentage}%</p>
                  <p className="text-xs text-slate-500">Overall</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 w-full">
                {pieData.map(d => (
                  <div key={d.name} className="text-center">
                    <p className="font-display font-bold text-lg" style={{ color: d.color }}>{d.value}</p>
                    <p className="text-xs text-slate-500">{d.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : <LoadingState text="Loading..." />}
        </div>

        {/* Latest report */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Latest Report</h2>
            <Link to="/student/report-card" className="text-xs text-azure-400 hover:text-azure-300">All →</Link>
          </div>
          {latestReport ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-white text-lg">{latestReport.quarter}</p>
                  <p className="text-xs text-slate-500">{latestReport.createdAt ? format(new Date(latestReport.createdAt), 'MMM d, yyyy') : ''}</p>
                </div>
                <AttendanceRing percentage={latestReport.attendancePercentage} size={64} />
              </div>
              <div className="bg-ink-700 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Teacher Remarks</p>
                <p className="text-sm text-slate-300 line-clamp-3">{latestReport.teacherRemarks}</p>
              </div>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
                latestReport.overallPerformance === 'EXCELLENT' ? 'bg-jade-500/10 text-jade-400 border-jade-500/20' :
                latestReport.overallPerformance === 'GOOD' ? 'bg-azure-500/10 text-azure-400 border-azure-500/20' :
                'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {latestReport.overallPerformance}
              </span>
              {latestReport.pdfUrl && (
                <a href={latestReport.pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-azure-400 hover:text-azure-300"
                >
                  <Download className="w-3 h-3" /> Download PDF
                </a>
              )}
            </div>
          ) : <p className="text-sm text-slate-500 text-center py-8">No reports yet</p>}
        </div>

        {/* Quick links */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Quick Access</h2>
          <div className="space-y-2">
            {[
              { to: '/student/attendance', label: 'My Attendance', desc: 'View daily records', icon: Activity, color: 'azure' },
              { to: '/student/notes', label: 'Class Notes', desc: 'Download study materials', icon: FileText, color: 'jade' },
              { to: '/student/schedule', label: 'Timetable', desc: 'Weekly class schedule', icon: Clock, color: 'amber' },
              { to: '/student/reports', label: 'My Reports', desc: 'Download quarterly reports', icon: FileText, color: 'rose' },
              { to: '/events', label: 'Events', desc: 'Upcoming exams & holidays', icon: Clock, color: 'azure' },
            ].map(({ to, label, desc, icon: Icon, color }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <Icon className={`w-4 h-4 text-${color}-400`} />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Sessions</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions?.slice(0, 3).map(s => (
            <div key={s._id} className="bg-ink-700 rounded-xl p-4 border border-white/5">
              <p className="text-white font-medium text-sm mb-1">{s.topic}</p>
              <p className="text-xs text-slate-500">{s.classId?.name} · {s.duration} min</p>
              <p className="text-xs text-slate-600 mt-2">{format(new Date(s.sessionDate), 'MMM d, yyyy')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
