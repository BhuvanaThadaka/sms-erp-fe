import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { StatCard, LoadingState, Badge } from '../../components/ui'
import { Users, BookOpen, FileText, ChevronRight, Shield, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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

export default function AdminDashboard() {
  const { user } = useAuth()
  const { connected } = useSocket()
  
  const [selectedYear, setSelectedYear] = useState('2024-2025')

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats', selectedYear],
    queryFn: () => dashboardAPI.getAdminStats({ academicYear: selectedYear }),
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">Welcome back, {user?.firstName}. Here's your system overview.</p>
        </div>
        {connected && (
          <div className="flex items-center gap-2 text-xs text-jade-400 bg-jade-500/10 border border-jade-500/20 px-3 py-1.5 rounded-full whitespace-nowrap">
            <span className="live-dot" />
            Live
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard icon={Users} label="Total Students" value={stats.totalStudents || 0} sub="Active enrollments" color="azure" />
        <StatCard icon={Users} label="Total Teachers" value={stats.totalTeachers || 0} sub="Active faculty" color="jade" />
        <StatCard icon={BookOpen} label="Classes" value={stats.totalClasses || 0} sub="Active classes" color="amber" />
        <StatCard icon={FileText} label="Reports" value={stats.totalReports || 0} sub="Academic reports" color="rose" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance trend */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Attendance Trend</h2>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.attendanceTrend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="present" fill="#3B82F6" radius={[4,4,0,0]} name="Present" />
              <Bar dataKey="absent" fill="#F43F5E" radius={[4,4,0,0]} name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Reports by quarter */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Reports by Quarter</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.reportsByQuarter}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="quarter" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#10B981" radius={[4,4,0,0]} name="Reports" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/admin/users', label: 'Manage Users', icon: Users, color: 'azure' },
              { to: '/admin/classes', label: 'Manage Classes', icon: BookOpen, color: 'jade' },
              { to: '/events', label: 'View Events', icon: Activity, color: 'amber' },
              { to: '/admin/audit-logs', label: 'Audit Logs', icon: Shield, color: 'rose' },
            ].map(({ to, label, icon: Icon, color }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <Icon className={`w-4 h-4 text-${color}-400`} />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-azure-400 hover:text-azure-300">View all →</Link>
          </div>
          <div className="space-y-2">
            {stats.recentUsers?.map(u => (
              <div key={u._id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/3 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-ink-700 border border-white/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-slate-300">{u.firstName?.charAt(0)}{u.lastName?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <Badge status={u.role} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

