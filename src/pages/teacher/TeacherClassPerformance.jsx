import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { marksAPI, classesAPI, subjectsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, AttendanceRing } from '../../components/ui'
import { BarChart3, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const GRADE_COLORS = { 'A+': 'text-jade-400 bg-jade-500/10 border-jade-500/20', A: 'text-jade-400 bg-jade-500/10 border-jade-500/20', B: 'text-azure-400 bg-azure-500/10 border-azure-500/20', C: 'text-amber-400 bg-amber-500/10 border-amber-500/20', D: 'text-rose-400 bg-rose-500/10 border-rose-500/20', F: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }

export default function TeacherClassPerformance() {
  const { user } = useAuth()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedQuarter, setSelectedQuarter] = useState('')
  const [expandedStudent, setExpandedStudent] = useState(null)
  const currentYear = '2024-2025'

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: currentYear }),
  })

  const { data: performance, isLoading } = useQuery({
    queryKey: ['class-performance', selectedClass, selectedQuarter, currentYear],
    queryFn: () => marksAPI.getClassPerformance(selectedClass, { academicYear: currentYear, quarter: selectedQuarter || undefined }),
    enabled: !!selectedClass,
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects', selectedClass],
    queryFn: () => subjectsAPI.getByClass(selectedClass, { academicYear: currentYear }),
    enabled: !!selectedClass,
  })

  const getGradeStyle = (grade) => GRADE_COLORS[grade] || 'text-slate-400 bg-ink-700 border-white/10'

  return (
    <div className="space-y-5">
      <SectionHeader title="Class Performance" subtitle="Subject-wise marks and grade analysis for your class" />

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <select className="input flex-1" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">Select class...</option>
          {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => setSelectedQuarter('')}
            className={clsx('px-3 py-2 rounded-lg text-xs border transition-all', !selectedQuarter ? 'bg-azure-600/20 text-azure-400 border-azure-500/30' : 'bg-ink-700 text-slate-400 border-white/10')}>
            All
          </button>
          {QUARTERS.map(q => (
            <button key={q} onClick={() => setSelectedQuarter(q)}
              className={clsx('px-3 py-2 rounded-lg text-xs border transition-all', selectedQuarter === q ? 'bg-azure-600/20 text-azure-400 border-azure-500/30' : 'bg-ink-700 text-slate-400 border-white/10')}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {!selectedClass ? (
        <EmptyState icon={BarChart3} title="Select a class" description="Choose a class to view performance overview" />
      ) : isLoading ? <LoadingState /> : !performance?.length ? (
        <EmptyState icon={BarChart3} title="No marks data" description="No marks have been entered for this class yet" />
      ) : (
        <div className="space-y-3">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold text-white">{performance.length}</p>
              <p className="text-xs text-slate-500 mt-1">Students</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold text-jade-400">
                {performance.filter(s => s.overallGrade === 'A+' || s.overallGrade === 'A').length}
              </p>
              <p className="text-xs text-slate-500 mt-1">A/A+ Grades</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold text-azure-400">
                {Math.round(performance.reduce((sum, s) => sum + s.overallPercentage, 0) / performance.length)}%
              </p>
              <p className="text-xs text-slate-500 mt-1">Class Average</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold text-rose-400">
                {performance.filter(s => s.overallPercentage < 40).length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Below Pass</p>
            </div>
          </div>

          {/* Student list */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="section-title">Student-wise Performance</h2>
            </div>
            <div className="divide-y divide-white/5">
              {performance.map(studentData => (
                <div key={studentData.student?._id}>
                  <button
                    onClick={() => setExpandedStudent(prev => prev === studentData.student?._id ? null : studentData.student?._id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-ink-700 border border-white/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-slate-300">
                        {studentData.student?.firstName?.[0]}{studentData.student?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{studentData.student?.firstName} {studentData.student?.lastName}</p>
                      <p className="text-xs text-slate-500">{studentData.student?.enrollmentNumber}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-bold font-display">{studentData.overallPercentage}%</p>
                        <p className="text-xs text-slate-500">{studentData.totalObtained}/{studentData.totalMax}</p>
                      </div>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-bold font-display', getGradeStyle(studentData.overallGrade))}>
                        {studentData.overallGrade}
                      </span>
                      <ChevronDown className={clsx('w-4 h-4 text-slate-500 transition-transform', expandedStudent === studentData.student?._id && 'rotate-180')} />
                    </div>
                  </button>

                  {/* Expanded: subject breakdown */}
                  {expandedStudent === studentData.student?._id && (
                    <div className="px-5 pb-4 bg-white/2 border-t border-white/5">
                      <div className="grid gap-2 mt-3">
                        {Object.entries(studentData.subjects || {}).map(([subId, subData]) => {
                          const pct = subData.max > 0 ? Math.round((subData.total / subData.max) * 100) : 0
                          const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F'
                          return (
                            <div key={subId} className="flex items-center gap-4 bg-ink-700 rounded-lg px-4 py-3">
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{subData.subject?.name}</p>
                                <p className="text-xs text-slate-500">{subData.subject?.code}</p>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                {QUARTERS.map(q => (
                                  <div key={q} className="text-center min-w-[40px]">
                                    <p className="text-slate-500 text-xs">{q}</p>
                                    <p className={clsx('font-mono font-bold', subData.quarters?.[q] !== undefined ? 'text-white' : 'text-slate-600')}>
                                      {subData.quarters?.[q] ?? '—'}
                                    </p>
                                  </div>
                                ))}
                                <div className="text-center min-w-[60px] border-l border-white/5 pl-3">
                                  <p className="text-slate-500 text-xs">Total</p>
                                  <p className="font-mono font-bold text-white">{subData.total}/{subData.max}</p>
                                </div>
                                <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-bold', getGradeStyle(grade))}>{grade}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
