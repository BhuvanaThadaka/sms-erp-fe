import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { marksAPI, academicReportsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, AttendanceRing } from '../../components/ui'
import { BarChart3, Download, Layers } from 'lucide-react'
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

  const { data: academicReports } = useQuery({
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

  const structure = reportCard.academicStructure
  const activeExams = structure 
    ? structure.terms.flatMap(t => t.exams.map(e => ({ ...e, termName: t.name })))
    : QUARTERS.map(q => ({ name: q, code: q, termName: '' }))

  return (
    <div className="space-y-5">
      <SectionHeader 
        title="My Report Card" 
        subtitle={structure ? `Session ${currentYear} • ${structure.name}` : `Session ${currentYear}`} 
      />

      {structure && (
        <div className="bg-azure-500/5 border border-azure-500/10 rounded-xl px-4 py-3 flex items-center gap-3 text-azure-400 text-sm">
          <Layers className="w-4 h-4" />
          <span>Follows dynamic structure: <strong>{structure.name}</strong></span>
        </div>
      )}

      {/* Overall summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 flex flex-col items-center justify-center gap-3">
          <AttendanceRing percentage={reportCard.overallPercentage} size={100} />
          <div className="text-center">
            <p className="font-display font-bold text-white text-xl">{reportCard.overallPercentage}%</p>
            <span className={clsx('text-xs px-3 py-0.5 rounded-full border font-bold font-display mt-1 inline-block', GRADE_COLORS[reportCard.overallGrade])}>
              Overall Grade: {reportCard.overallGrade}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full text-center">
            <div className="bg-ink-700 rounded-lg py-2">
              <p className="font-display font-bold text-jade-400">{reportCard.grandTotal?.obtained}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Obtained</p>
            </div>
            <div className="bg-ink-700 rounded-lg py-2">
              <p className="font-display font-bold text-slate-400">{reportCard.grandTotal?.max}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Maximum</p>
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
        <div className="px-5 py-4 border-b border-white/5 bg-white/2">
          <h2 className="section-title">Academic Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-ink-800">
                <th className="table-th">Subject</th>
                {activeExams.map(exam => (
                  <th key={exam.code} className="table-th text-center">
                    <span className="block">{exam.code}</span>
                    {exam.termName && <span className="text-[9px] text-slate-500 font-normal">{exam.termName}</span>}
                  </th>
                ))}
                <th className="table-th text-center">Total</th>
                <th className="table-th text-center">%</th>
                <th className="table-th text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reportCard.subjects.map((s, i) => (
                <tr key={i} className="hover:bg-white/2 transition-colors">
                  <td className="table-td py-4">
                    <p className="text-white font-medium">{s.subject?.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{s.subject?.code}</p>
                  </td>
                  {activeExams.map(exam => {
                    const examData = s.quarters?.[`${exam.termName} - ${exam.code}`] || s.quarters?.[exam.code]
                    return (
                      <td key={exam.code} className="table-td text-center">
                        {examData ? (
                          <div>
                            <p className={clsx('font-mono font-bold', examData.isAbsent ? 'text-rose-400' : 'text-white')}>
                              {examData.isAbsent ? 'AB' : examData.marksObtained}
                            </p>
                            <p className="text-[10px] text-slate-500">/{examData.maxMarks}</p>
                          </div>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                    )
                  })}
                  <td className="table-td text-center border-l border-white/5">
                    <p className="font-mono font-bold text-white">{s.totalObtained}/{s.totalMax}</p>
                  </td>
                  <td className="table-td text-center">
                    <p className={clsx('font-mono font-bold', s.percentage >= 40 ? 'text-jade-400' : 'text-rose-400')}>{s.percentage}%</p>
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
              <tr className="border-t border-white/10 bg-azure-500/5 font-bold">
                <td className="table-td text-white" colSpan={activeExams.length + 1}>Overall Performance</td>
                <td className="table-td text-center text-white font-mono">{reportCard.grandTotal?.obtained}/{reportCard.grandTotal?.max}</td>
                <td className="table-td text-center text-azure-400 font-mono">{reportCard.overallPercentage}%</td>
                <td className="table-td text-center">
                  <span className={clsx('text-sm px-3 py-1 rounded-full border font-bold font-display inline-block', GRADE_COLORS[reportCard.overallGrade])}>
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
          <h2 className="section-title mb-4">Official Reports</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {academicReports.map(r => (
              <div key={r._id} className="bg-ink-700/50 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-azure-400">{r.quarter}</span>
                  <span className={clsx('text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase', GRADE_COLORS[r.overallGrade])}>{r.overallGrade}</span>
                </div>
                <p className="text-white font-bold text-2xl font-display">{r.percentage}%</p>
                <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-wider">{r.totalObtained} / {r.totalMax} MARKS</p>
                {r.pdfUrl && (
                  <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs btn-secondary py-2 w-full justify-center rounded-lg">
                    <Download className="w-3.5 h-3.5" /> View PDF
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
