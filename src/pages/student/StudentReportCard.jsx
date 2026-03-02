import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { marksAPI, academicReportsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, AttendanceRing } from '../../components/ui'
import { BarChart3, Download } from 'lucide-react'
import { format } from 'date-fns'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import clsx from 'clsx'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const GRADE_COLORS = {
  'A+': 'text-jade-400 bg-jade-500/10 border-jade-500/20',
  A: 'text-jade-400 bg-jade-500/10 border-jade-500/20',
  B: 'text-azure-400 bg-azure-500/10 border-azure-500/20',
  C: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  D: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  F: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
}

export default function StudentReportCard() {
  const { user } = useAuth()
  const currentYear = '2024-2025'
  const classId = user?.classId?._id || user?.classId

  const { data: reportCard, isLoading: loadingCard } = useQuery({
    queryKey: ['my-report-card', user?._id, currentYear],
    queryFn: () => marksAPI.getStudentReportCard(user._id, { academicYear: currentYear, classId }),
    enabled: !!user?._id,
  })

  const { data: academicReports, isLoading: loadingReports } = useQuery({
    queryKey: ['my-academic-reports', user?._id, currentYear],
    queryFn: () => academicReportsAPI.getAll({ academicYear: currentYear }),
    enabled: !!user?._id,
  })

  const radarData = reportCard?.subjects?.map(s => ({
    subject: s.subject?.name?.slice(0, 8),
    score: s.percentage,
  })) || []

  if (loadingCard) return <div className="space-y-5"><SectionHeader title="My Report Card" /><LoadingState /></div>

  if (!reportCard?.subjects?.length) {
    return (
      <div className="space-y-5">
        <SectionHeader title="My Report Card" subtitle="Your academic performance overview" />
        <EmptyState icon={BarChart3} title="No marks yet" description="Your teachers haven't entered marks for this academic year yet." />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="My Report Card" subtitle={`Academic Year ${currentYear}`} />

      {/* Overall summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 flex flex-col items-center justify-center gap-3">
          <AttendanceRing percentage={reportCard.overallPercentage} size={100} />
          <div className="text-center">
            <p className="font-display font-bold text-white text-xl">{reportCard.overallPercentage}%</p>
            <span className={clsx('text-sm px-3 py-0.5 rounded-full border font-bold font-display mt-1 inline-block', GRADE_COLORS[reportCard.overallGrade])}>
              Overall Grade: {reportCard.overallGrade}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full text-center">
            <div className="bg-ink-700 rounded-lg py-2">
              <p className="font-display font-bold text-jade-400">{reportCard.grandTotal?.obtained}</p>
              <p className="text-xs text-slate-500">Total Obtained</p>
            </div>
            <div className="bg-ink-700 rounded-lg py-2">
              <p className="font-display font-bold text-slate-400">{reportCard.grandTotal?.max}</p>
              <p className="text-xs text-slate-500">Total Max</p>
            </div>
          </div>
        </div>

        {/* Radar chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="section-title mb-4">Subject Performance Radar</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip contentStyle={{ background: '#161E35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject-wise breakdown */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="section-title">Subject-wise Marks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="table-th">Subject</th>
                <th className="table-th text-center">Q1</th>
                <th className="table-th text-center">Q2</th>
                <th className="table-th text-center">Q3</th>
                <th className="table-th text-center">Q4</th>
                <th className="table-th text-center">Total</th>
                <th className="table-th text-center">%</th>
                <th className="table-th text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {reportCard.subjects.map((s, i) => (
                <tr key={i} className="table-row">
                  <td className="table-td">
                    <p className="text-white font-medium">{s.subject?.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{s.subject?.code}</p>
                  </td>
                  {QUARTERS.map(q => {
                    const qData = s.quarters?.[q]
                    return (
                      <td key={q} className="table-td text-center">
                        {qData ? (
                          <div>
                            <p className={clsx('font-mono font-bold', qData.isAbsent ? 'text-rose-400' : 'text-white')}>
                              {qData.isAbsent ? 'AB' : qData.marksObtained}
                            </p>
                            <p className="text-xs text-slate-500">/{qData.maxMarks}</p>
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                    )
                  })}
                  <td className="table-td text-center">
                    <p className="font-mono font-bold text-white">{s.totalObtained}/{s.totalMax}</p>
                  </td>
                  <td className="table-td text-center">
                    <p className={clsx('font-mono font-bold', s.percentage >= 60 ? 'text-jade-400' : 'text-rose-400')}>{s.percentage}%</p>
                  </td>
                  <td className="table-td text-center">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-bold font-display', GRADE_COLORS[s.overallGrade])}>
                      {s.overallGrade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 bg-azure-500/5">
                <td className="table-td font-bold text-white" colSpan={5}>Grand Total</td>
                <td className="table-td text-center font-bold text-white font-mono">{reportCard.grandTotal?.obtained}/{reportCard.grandTotal?.max}</td>
                <td className="table-td text-center font-bold text-azure-400 font-mono">{reportCard.overallPercentage}%</td>
                <td className="table-td text-center">
                  <span className={clsx('text-sm px-2 py-0.5 rounded-full border font-bold font-display', GRADE_COLORS[reportCard.overallGrade])}>
                    {reportCard.overallGrade}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Academic reports with PDFs */}
      {academicReports?.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-4">Generated Reports</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {academicReports.map(r => (
              <div key={r._id} className="bg-ink-700 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-azure-400">{r.quarter}</span>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-bold', GRADE_COLORS[r.overallGrade])}>{r.overallGrade}</span>
                </div>
                <p className="text-white font-bold text-lg font-display">{r.percentage}%</p>
                <p className="text-xs text-slate-500 mb-3">{r.totalObtained}/{r.totalMax} marks</p>
                {r.pdfUrl && (
                  <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 w-full justify-center">
                    <Download className="w-3 h-3" /> PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
