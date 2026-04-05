import React from 'react'
import { AttendanceRing } from './ui'
import { Calendar, BarChart3, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

export default function AttendanceStats({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="card h-32 bg-white/5 border-white/5" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const items = [
    { label: 'Daily', data: stats.daily, icon: Calendar, color: 'azure' },
    { label: 'Monthly', data: stats.monthly, icon: BarChart3, color: 'jade' },
    { label: 'Yearly', data: stats.yearly, icon: TrendingUp, color: 'amber' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map(({ label, data, icon: Icon, color }) => (
        <div key={label} className="card p-4 flex items-center justify-between group hover:border-white/10 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">{label} Overview</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{data.percentage}%</span>
              <span className="text-xs text-slate-500 font-medium">Present</span>
            </div>
            <p className="text-[10px] text-slate-600 font-mono">
              {data.present} / {data.total} students
            </p>
          </div>
          <AttendanceRing percentage={data.percentage} size={64} />
        </div>
      ))}
    </div>
  )
}
