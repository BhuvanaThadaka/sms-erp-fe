import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attendanceAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { SectionHeader, LoadingState, Badge, AttendanceRing, EmptyState } from '../../components/ui'
import { Activity } from 'lucide-react'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function StudentAttendance() {
  const { user } = useAuth()
  const { lastAttendanceUpdate } = useSocket()
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const currentYear = '2024-2025'

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['attendance-summary', user?._id, currentYear, lastAttendanceUpdate],
    queryFn: () => attendanceAPI.getStudentSummary(user._id, currentYear),
    enabled: !!user?._id,
  })

  const { data: records, isLoading: loadingRecords } = useQuery({
    queryKey: ['attendance-records', user?._id, month, lastAttendanceUpdate],
    queryFn: () => attendanceAPI.getAll({ studentId: user._id, month }),
    enabled: !!user?._id,
  })

  // Group by week for chart
  const weeklyData = Array.from({ length: 4 }, (_, w) => ({
    week: `Wk ${w + 1}`,
    present: records?.filter((r, i) => Math.floor(i / 5) === w && r.status === 'PRESENT').length || 0,
    absent: records?.filter((r, i) => Math.floor(i / 5) === w && r.status === 'ABSENT').length || 0,
  }))

  return (
    <div className="space-y-5">
      <SectionHeader title="My Attendance" subtitle="Track your attendance across the academic year" />

      {/* Summary cards */}
      {loadingSummary ? <LoadingState text="Loading summary..." /> : summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger">
          <div className="lg:col-span-1 card p-5 flex flex-col items-center justify-center">
            <AttendanceRing percentage={summary.percentage} size={80} />
            <p className="text-xs text-slate-500 mt-2">Overall</p>
          </div>
          {[
            { label: 'Total Days', value: summary.total, color: 'slate' },
            { label: 'Present', value: summary.present, color: 'jade' },
            { label: 'Absent', value: summary.absent, color: 'rose' },
            { label: 'Late', value: summary.late, color: 'amber' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-5 text-center">
              <p className={`font-display text-3xl font-bold text-${color === 'slate' ? 'white' : color + '-400'}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-title">Monthly Overview</h2>
          <input type="month" className="input max-w-[160px]" value={month} onChange={e => setMonth(e.target.value)} />
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="week" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#161E35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="present" fill="#10B981" radius={[4,4,0,0]} name="Present" />
            <Bar dataKey="absent" fill="#F43F5E" radius={[4,4,0,0]} name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Records list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="section-title">Attendance Records</h2>
        </div>
        {loadingRecords ? <LoadingState /> : !records?.length ? (
          <EmptyState icon={Activity} title="No records" description="No attendance recorded for this month" />
        ) : (
          <div className="divide-y divide-white/5">
            {records.map(r => (
              <div key={r._id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-10 h-10 rounded-lg bg-ink-700 border border-white/5 flex flex-col items-center justify-center flex-shrink-0">
                  <p className="font-display font-bold text-white text-sm leading-none">{format(new Date(r.date), 'd')}</p>
                  <p className="text-xs text-slate-500">{format(new Date(r.date), 'MMM')}</p>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">{format(new Date(r.date), 'EEEE, MMMM d yyyy')}</p>
                  {r.remarks && <p className="text-xs text-slate-500">{r.remarks}</p>}
                </div>
                <Badge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
