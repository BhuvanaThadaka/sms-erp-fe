import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { academicReportsAPI, classesAPI, usersAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, AttendanceRing } from '../../components/ui'
import { FileText, Plus, Users, Download, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const GRADE_COLORS = { 'A+': 'jade', A: 'jade', B: 'azure', C: 'amber', D: 'rose', F: 'rose' }

export default function TeacherAcademicReports() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [classFilter, setClassFilter] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)
  const [showReport, setShowReport] = useState(null)
  const [form, setForm] = useState({ studentId: '', classId: '', quarter: 'Q1', academicYear: '2024-2025', teacherRemarks: '' })
  const currentYear = '2024-2025'

  const { data: reports, isLoading } = useQuery({
    queryKey: ['academic-reports', classFilter, currentYear],
    queryFn: () => academicReportsAPI.getAll({ classId: classFilter || undefined, academicYear: currentYear }),
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: currentYear }),
  })

  const { data: students } = useQuery({
    queryKey: ['students', form.classId],
    queryFn: () => usersAPI.getStudentsByClass(form.classId),
    enabled: !!form.classId,
  })

  const generateMutation = useMutation({
    mutationFn: academicReportsAPI.generate,
    onSuccess: () => { toast.success('Academic report generated!'); qc.invalidateQueries({ queryKey: ['academic-reports'] }); setShowGenerate(false) },
  })

  const bulkMutation = useMutation({
    mutationFn: academicReportsAPI.bulkGenerate,
    onSuccess: (data) => {
      const ok = data.filter(r => r.success).length
      toast.success(`Generated ${ok} reports`)
      qc.invalidateQueries({ queryKey: ['academic-reports'] })
    },
  })

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Academic Reports"
        subtitle="Generate and view detailed academic performance reports"
        action={
          <div className="flex gap-2">
            {classFilter && (
              <button
                onClick={() => {
                  const q = prompt('Generate for which quarter? (Q1/Q2/Q3/Q4)', 'Q1')
                  if (!q) return
                  bulkMutation.mutate({ classId: classFilter, quarter: q, academicYear: currentYear })
                }}
                disabled={bulkMutation.isPending}
                className="btn-secondary disabled:opacity-50"
              >
                <Users className="w-4 h-4" /> Bulk Generate
              </button>
            )}
            <button onClick={() => setShowGenerate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Generate Report
            </button>
          </div>
        }
      />

      <div className="card p-4">
        <select className="input max-w-xs" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingState /> : !reports?.length ? (
        <EmptyState icon={FileText} title="No reports yet" description="Generate academic reports for your students" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map(r => {
            const gc = GRADE_COLORS[r.overallGrade] || 'azure'
            return (
              <div key={r._id} className="card card-hover p-5 cursor-pointer" onClick={() => setShowReport(r)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white font-semibold font-display">{r.studentId?.firstName} {r.studentId?.lastName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.classId?.name}</p>
                    <p className="text-xs text-slate-600 font-mono">{r.studentId?.enrollmentNumber}</p>
                  </div>
                  <AttendanceRing percentage={r.percentage} size={56} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-azure-500/10 text-azure-400 border border-azure-500/20 text-xs px-2 py-0.5 rounded-full font-mono">{r.quarter}</span>
                  <span className={`bg-${gc}-500/10 text-${gc}-400 border border-${gc}-500/20 text-xs px-2 py-0.5 rounded-full font-bold`}>{r.overallGrade}</span>
                </div>
                <div className="grid grid-cols-3 gap-1 mb-3">
                  <div className="bg-ink-700 rounded-lg py-1.5 text-center">
                    <p className="font-display font-bold text-white text-sm">{r.totalObtained}</p>
                    <p className="text-xs text-slate-600">Obtained</p>
                  </div>
                  <div className="bg-ink-700 rounded-lg py-1.5 text-center">
                    <p className="font-display font-bold text-slate-400 text-sm">{r.totalMax}</p>
                    <p className="text-xs text-slate-600">Max</p>
                  </div>
                  <div className="bg-ink-700 rounded-lg py-1.5 text-center">
                    <p className="font-display font-bold text-azure-400 text-sm">{r.percentage}%</p>
                    <p className="text-xs text-slate-600">Score</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">{format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Generate Modal */}
      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Academic Report" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); generateMutation.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <select className="input" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, studentId: '' }))} required>
                <option value="">Select class...</option>
                {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Student">
              <select className="input" value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))} required disabled={!form.classId}>
                <option value="">Select student...</option>
                {students?.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Quarter">
            <div className="flex gap-2">
              {QUARTERS.map(q => (
                <button key={q} type="button" onClick={() => setForm(p => ({ ...p, quarter: q }))}
                  className={clsx('flex-1 py-2 rounded-lg text-sm border transition-all',
                    form.quarter === q ? 'bg-azure-600/20 text-azure-400 border-azure-500/30' : 'bg-ink-700 text-slate-400 border-white/10'
                  )}>
                  {q}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Teacher Remarks">
            <textarea className="input min-h-[80px] resize-none" value={form.teacherRemarks}
              onChange={e => setForm(p => ({ ...p, teacherRemarks: e.target.value }))}
              placeholder="Optional remarks for the student..." />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={generateMutation.isPending} className="btn-primary flex-1 justify-center">
              {generateMutation.isPending ? 'Generating...' : 'Generate Report'}
            </button>
            <button type="button" onClick={() => setShowGenerate(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Report Detail Modal */}
      <Modal open={!!showReport} onClose={() => setShowReport(null)} title="Academic Report Detail" size="xl">
        {showReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-ink-700 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Student</p>
                <p className="text-white font-semibold">{showReport.studentId?.firstName} {showReport.studentId?.lastName}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{showReport.studentId?.enrollmentNumber}</p>
              </div>
              <div className="bg-ink-700 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Class & Quarter</p>
                <p className="text-white font-semibold">{showReport.classId?.name}</p>
                <p className="text-xs text-azure-400 font-mono mt-0.5">{showReport.quarter} — {showReport.academicYear}</p>
              </div>
              <div className="bg-ink-700 rounded-xl p-4 text-center">
                <AttendanceRing percentage={showReport.percentage} size={72} />
                <span className={clsx('mt-2 inline-block text-xs px-2 py-0.5 rounded-full border font-bold',
                  `bg-${GRADE_COLORS[showReport.overallGrade] || 'azure'}-500/10 text-${GRADE_COLORS[showReport.overallGrade] || 'azure'}-400 border-${GRADE_COLORS[showReport.overallGrade] || 'azure'}-500/20`
                )}>Grade {showReport.overallGrade}</span>
              </div>
            </div>

            {/* Subject breakdown */}
            {showReport.reportData?.subjects && (
              <div>
                <h3 className="section-title mb-3">Subject-wise Marks</h3>
                <div className="space-y-2">
                  {showReport.reportData.subjects.map((s, i) => (
                    <div key={i} className="bg-ink-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white font-medium">{s.subject?.name}</p>
                          <p className="text-xs text-slate-500">{s.subject?.code}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-white font-bold font-display">{s.totalObtained}/{s.totalMax}</p>
                          <span className="text-xs font-bold text-azure-400">{s.percentage}%</span>
                          <span className={clsx('text-xs px-1.5 py-0.5 rounded font-bold font-display', `text-${GRADE_COLORS[s.overallGrade] || 'azure'}-400`)}>
                            {s.overallGrade}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {QUARTERS.map(q => (
                          <div key={q} className={clsx('flex-1 text-center py-2 rounded-lg', s.quarters?.[q] ? 'bg-ink-800' : 'bg-ink-900 opacity-40')}>
                            <p className="text-xs text-slate-500">{q}</p>
                            <p className="font-mono font-bold text-white text-sm">{s.quarters?.[q]?.marksObtained ?? '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showReport.teacherRemarks && (
              <div className="bg-azure-500/5 border border-azure-500/20 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1">Teacher Remarks</p>
                <p className="text-slate-300 text-sm">{showReport.teacherRemarks}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {showReport.pdfUrl && (
                <a href={showReport.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 justify-center">
                  <Download className="w-4 h-4" /> Download PDF
                </a>
              )}
              <button onClick={() => setShowReport(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
