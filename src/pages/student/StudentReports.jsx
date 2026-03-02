import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { SectionHeader, LoadingState, EmptyState, AttendanceRing } from '../../components/ui'
import { BarChart3, Download } from 'lucide-react'
import { format } from 'date-fns'

const PERF_COLOR = { EXCELLENT:'jade', GOOD:'azure', AVERAGE:'amber', BELOW_AVERAGE:'rose' }

export default function StudentReports() {
  const { user } = useAuth()
  const { lastReportGenerated } = useSocket()
  const currentYear = '2024-2025'

  const { data: reports, isLoading } = useQuery({
    queryKey: ['my-reports', user?._id, lastReportGenerated],
    queryFn: () => reportsAPI.getAll({ academicYear: currentYear }),
    enabled: !!user?._id,
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="My Reports" subtitle="Quarterly academic performance reports" />

      {isLoading ? <LoadingState /> : !reports?.length ? (
        <EmptyState icon={BarChart3} title="No reports yet" description="Your teacher will generate reports at the end of each quarter" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {reports.map(r => {
            const pc = PERF_COLOR[r.overallPerformance] || 'azure'
            return (
              <div key={r._id} className="card p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-white text-xl">{r.quarter}</span>
                      <span className="text-slate-500 text-sm">· {r.academicYear}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border bg-${pc}-500/10 text-${pc}-400 border-${pc}-500/20`}>
                      {r.overallPerformance?.replace('_', ' ')}
                    </span>
                  </div>
                  <AttendanceRing percentage={r.attendancePercentage} size={72} />
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { l: 'Total', v: r.totalDays, c: 'slate' },
                    { l: 'Present', v: r.presentDays, c: 'jade' },
                    { l: 'Absent', v: r.absentDays, c: 'rose' },
                    { l: 'Late', v: r.lateDays, c: 'amber' },
                  ].map(({ l, v, c }) => (
                    <div key={l} className="bg-ink-700 rounded-lg p-2 text-center">
                      <p className={`font-display font-bold text-${c === 'slate' ? 'white' : c + '-400'}`}>{v}</p>
                      <p className="text-xs text-slate-600">{l}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-ink-700 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Teacher Remarks</p>
                    <p className="text-sm text-slate-300">{r.teacherRemarks || 'No remarks'}</p>
                  </div>
                  {r.participationSummary && (
                    <div className="bg-ink-700 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">Participation</p>
                      <p className="text-sm text-slate-300">{r.participationSummary}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">Generated {format(new Date(r.generatedAt), 'MMM d, yyyy')}</p>
                  {r.pdfUrl && (
                    <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs btn-secondary py-1.5"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
