import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { scheduleAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState } from '../../components/ui'
import { Clock } from 'lucide-react'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
const DAY_COLORS = ['azure','jade','amber','rose','azure']

export default function StudentSchedule() {
  const { user } = useAuth()
  const classId = user?.classId?._id || user?.classId

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule-class', classId],
    queryFn: () => scheduleAPI.getByClass(classId, { academicYear: '2024-2025' }),
    enabled: !!classId,
  })

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = schedule?.filter(s => s.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)) || []
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <SectionHeader title="My Timetable" subtitle="Weekly class schedule" />
      {!classId ? (
        <EmptyState icon={Clock} title="No class assigned" />
      ) : isLoading ? <LoadingState /> : (
        <div className="grid gap-4">
          {DAYS.map((day, i) => (
            <div key={day} className="card overflow-hidden">
              <div className={`px-5 py-3 border-b border-white/5 bg-${DAY_COLORS[i]}-500/5`}>
                <h3 className={`font-display font-semibold text-${DAY_COLORS[i]}-400`}>{day}</h3>
              </div>
              {byDay[day].length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-600">No classes scheduled</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {byDay[day].map(s => (
                    <div key={s._id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="text-right flex-shrink-0 w-20">
                        <p className="text-xs font-mono text-white">{s.startTime}</p>
                        <p className="text-xs font-mono text-slate-500">{s.endTime}</p>
                      </div>
                      <div className={`w-px h-8 bg-${DAY_COLORS[i]}-500/30 flex-shrink-0`} />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{s.subject}</p>
                        <p className="text-xs text-slate-500">{s.teacher?.firstName} {s.teacher?.lastName}</p>
                      </div>
                      {s.room && <span className="text-xs text-slate-500 bg-ink-700 px-2 py-0.5 rounded">{s.room}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
