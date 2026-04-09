import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { marksAPI, classesAPI, subjectsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState } from '../../components/ui'
import { BarChart3, ChevronDown, Layers } from 'lucide-react'
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
    queryFn: () => classesAPI.getAll({ academicYear: currentYear, limit: 500 }),
  })

  // Fetch full class details to get academic structure
  const { data: classDetails } = useQuery({
    queryKey: ['class-details', selectedClass],
    queryFn: () => classesAPI.getById(selectedClass),
    enabled: !!selectedClass,
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

  const structure = classDetails?.academicStructure
  const activeExams = structure 
    ? structure.terms.flatMap(t => t.exams.map(e => ({ ...e, termName: t.name })))
    : QUARTERS.map(q => ({ name: q, code: q, termName: '' }))

  return (
    <div className="space-y-5">
      <SectionHeader title="Class Performance" subtitle="Subject-wise marks and grade analysis for your class" />

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <select className="input flex-1" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedQuarter('') }}>
          <option value="">Select class...</option>
          {(classes?.classes || (Array.isArray(classes) ? classes : [])).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <div className="flex gap-2">
          {!structure && (
            <>
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
            </>
          )}
          {structure && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-white/2 px-3 py-2 rounded-lg border border-white/5">
              <Layers className="w-3.5 h-3.5" /> Using structure: {structure.name}
            </div>
          )}
        </div>
      </div>

      {!selectedClass ? (
        <EmptyState icon={BarChart3} title="Select a class" description="Choose a class to view performance overview" />
      ) : isLoading ? <LoadingState /> : !performance?.length ? (
        <EmptyState icon={BarChart3} title="No marks data" description="No marks have been entered for this class yet" />
      ) : (
        <div className="space-y-3">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <div className="w-10 h-10 rounded-xl bg-ink-700 border border-white/5 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      {studentData.student?.firstName?.[0]}{studentData.student?.lastName?.[0]}
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
                    <div className="px-5 pb-4 bg-white/2 border-t border-white/5 overflow-x-auto">
                      <div className="min-w-[600px] grid gap-2 mt-3">
                        {Object.entries(studentData.subjects || {}).map(([subId, subData]) => {
                          const pct = subData.max > 0 ? Math.round((subData.total / subData.max) * 100) : 0
                          const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 40 ? 'D' : 'F'
                          return (
                            <div key={subId} className="flex items-center gap-4 bg-ink-700 rounded-lg px-4 py-3 border border-white/5">
                              <div className="w-48 flex-shrink-0">
                                <p className="text-white text-sm font-medium truncate">{subData.subject?.name}</p>
                                <p className="text-xs text-slate-500">{subData.subject?.code}</p>
                              </div>
                              <div className="flex-1 flex items-center justify-around gap-2 text-sm">
                                {activeExams.map(exam => (
                                  <div key={exam.code} className="text-center min-w-[50px]">
                                    <p className="text-slate-500 text-[10px] uppercase font-bold">{exam.code}</p>
                                    <p className={clsx('font-mono font-bold text-sm', (subData.exams?.[exam.code] !== undefined || subData.quarters?.[exam.code] !== undefined) ? 'text-white' : 'text-slate-700')}>
                                      {subData.exams?.[exam.code] ?? subData.quarters?.[exam.code] ?? '—'}
                                    </p>
                                  </div>
                                ))}
                                <div className="text-center min-w-[70px] border-l border-white/10 pl-3">
                                  <p className="text-slate-500 text-[10px] uppercase font-bold">Total</p>
                                  <p className="font-mono font-bold text-white text-sm">{subData.total}/{subData.max}</p>
                                </div>
                                <div className={clsx('min-w-[40px] text-center text-xs px-2 py-0.5 rounded-full border font-bold', getGradeStyle(grade))}>
                                  {grade}
                                </div>
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
