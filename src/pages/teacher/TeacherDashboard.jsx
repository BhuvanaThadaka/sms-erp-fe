import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { classesAPI, sessionsAPI, attendanceAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { StatCard, LoadingState, Badge } from '../../components/ui'
import { BookOpen, ClipboardList, BookMarked, BarChart3, ChevronRight, Activity } from 'lucide-react'
import { format } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-ink-800 border border-white/10 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { lastAttendanceUpdate, connected } = useSocket()
  const currentYear = '2024-2025'

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: currentYear }),
  })

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions', user?._id],
    queryFn: () => sessionsAPI.getAll({ academicYear: currentYear }),
  })

  // Weekly attendance trend mock
  const trend = ['Mon','Tue','Wed','Thu','Fri'].map(day => ({
    day,
    present: Math.floor(Math.random() * 10 + 20),
    absent: Math.floor(Math.random() * 5 + 1),
  }))

  const recentSessions = sessions?.slice(0, 4) || []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Teacher Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {format(new Date(), 'EEEE, MMMM d yyyy')}
          </p>
        </div>
        {connected && (
          <div className="flex items-center gap-2 text-xs text-jade-400 bg-jade-500/10 border border-jade-500/20 px-3 py-1.5 rounded-full">
            <span className="live-dot" /> Live Updates
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard icon={BookOpen} label="My Classes" value={classes?.total ?? classes?.length ?? 0} color="azure" />
        <StatCard icon={BookMarked} label="Sessions" value={sessions?.length || 0} color="jade" />
        <StatCard icon={ClipboardList} label="Today's Classes" value={classes?.total ?? classes?.length ?? 0} color="amber" />
        <StatCard icon={Activity} label="Avg Attendance" value="82%" color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Weekly Attendance</h2>
            <Link to="/teacher/attendance" className="text-xs text-azure-400 hover:text-azure-300">Mark →</Link>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="present" stroke="#3B82F6" fill="url(#presentGrad)" strokeWidth={2} name="Present" />
              <Area type="monotone" dataKey="absent" stroke="#F43F5E" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Absent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/teacher/attendance', label: 'Mark Attendance', icon: ClipboardList, desc: 'Record today\'s attendance', color: 'azure' },
              { to: '/teacher/sessions', label: 'Create Session', icon: BookMarked, desc: 'Log a teaching session', color: 'jade' },
              { to: '/teacher/reports', label: 'Generate Reports', icon: BarChart3, desc: 'Create quarterly reports', color: 'amber' },
              { to: '/teacher/schedule', label: 'View Schedule', icon: Activity, desc: 'Manage class timetable', color: 'rose' },
            ].map(({ to, label, icon: Icon, desc, color }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5"
              >
                <div className={`w-9 h-9 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 text-${color}-400`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Sessions</h2>
          <Link to="/teacher/sessions" className="text-xs text-azure-400 hover:text-azure-300">View all →</Link>
        </div>
        {loadingSessions ? <LoadingState text="Loading sessions..." /> : recentSessions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No sessions recorded yet</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map(s => (
              <div key={s._id} className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-white/3 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-azure-500/10 border border-azure-500/20 flex items-center justify-center flex-shrink-0">
                  <BookMarked className="w-4 h-4 text-azure-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{s.topic}</p>
                  <p className="text-slate-500 text-xs">{s.classId?.name} · {s.duration} min</p>
                </div>
                <p className="text-slate-500 text-xs flex-shrink-0">{format(new Date(s.sessionDate), 'MMM d')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
