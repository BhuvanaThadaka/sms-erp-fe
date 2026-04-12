import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { academicReportsAPI, classesAPI, usersAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, AttendanceRing } from '../../components/ui'
import { FileText, Plus, Users, Download, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const GRADE_COLORS = { 'A+': 'jade', A: 'jade', B: 'azure', C: 'amber', D: 'rose', F: 'rose' }

export default function TeacherAcademicReports() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [classFilter, setClassFilter] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showReport, setShowReport] = useState(null)
  const [form, setForm] = useState({ 
    studentId: '', 
    classId: '', 
    quarter: '', 
    termName: '', 
    examCode: '', 
    academicYear: '2024-2025', 
    teacherRemarks: '' 
  })
  const [bulkForm, setBulkForm] = useState({
    classId: '',
    termName: '',
    examCode: '',
    academicYear: '2024-2025'
  })
  const [errors, setErrors] = useState({})
  const currentDefaultYear = '2024-2025' // Fallback

  const { data: reports, isLoading } = useQuery({
    queryKey: ['academic-reports', classFilter],
    queryFn: () => academicReportsAPI.getAll({ classId: classFilter || undefined }),
  })

  const { data: classes } = useQuery({
    queryKey: ['classes', 'classTeacher'],
    queryFn: () => classesAPI.getAll({ isClassTeacher: 'true' }),
  })

  const classList = Array.isArray(classes) ? classes : classes?.classes || []
  const singleClass = classList.find(c => c._id === form.classId)
  const bulkClass = classList.find(c => c._id === bulkForm.classId)
  
  const singleStructure = singleClass?.academicStructure
  const bulkStructure = bulkClass?.academicStructure

  const { data: students } = useQuery({
    queryKey: ['students', form.classId],
    queryFn: () => usersAPI.getStudentsByClass(form.classId),
    enabled: !!form.classId,
  })

  const generateMutation = useMutation({
    mutationFn: academicReportsAPI.generate,
    onSuccess: () => { 
      toast.success('Academic report generated!')
      qc.invalidateQueries({ queryKey: ['academic-reports'] })
      setShowGenerate(false)
      setErrors({})
      setForm({ 
        studentId: '', 
        classId: '', 
        quarter: '', 
        termName: '', 
        examCode: '', 
        academicYear: '2024-2025', 
        teacherRemarks: '' 
      })
    },
  })

  const validateReport = (data) => {
    const errs = {}
    if (!data.classId) errs.classId = 'Class is required.'
    if (!data.studentId) errs.studentId = 'Student is required.'
    // No specific period check needed if Annual is allowed (no selection = Annual)
    return errs
  }

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
            <button
              onClick={() => {
                if (!classFilter) {
                  toast.error('Please select a class first')
                  return
                }
                const cls = classList.find(c => c._id === classFilter)
                setBulkForm(p => ({ ...p, classId: classFilter, academicYear: cls?.academicYear || currentDefaultYear }))
                setShowBulkModal(true)
              }}
              disabled={bulkMutation.isPending}
              className="btn-secondary disabled:opacity-50"
            >
              <Users className="w-4 h-4" /> Bulk Generate
            </button>
            <button onClick={() => setShowGenerate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Generate Report
            </button>
          </div>
        }
      />

      <div className="card p-4">
        <select className="input max-w-xs" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {(Array.isArray(classes) ? classes : classes?.classes || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
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
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-azure-500/10 text-azure-400 border border-azure-500/20 text-[10px] uppercase px-2 py-0.5 rounded-md font-bold tracking-wider">
                    {r.examCode || r.termName || 'Annual Report'}
                  </span>
                  <span className={`bg-${gc}-500/10 text-${gc}-400 border border-${gc}-500/20 text-[10px] uppercase px-2 py-0.5 rounded-md font-bold tracking-wider`}>
                    Grade {r.overallGrade}
                  </span>
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
      <Modal open={showGenerate} onClose={() => { setShowGenerate(false); setErrors({}) }} title="Generate Academic Report" size="lg">
        <form onSubmit={(e) => { 
          e.preventDefault()
          const errs = validateReport(form)
          if (Object.keys(errs).length > 0) {
            setErrors(errs)
            return
          }
          const cleanData = Object.fromEntries(
            Object.entries(form).filter(([_, v]) => v !== '')
          )
          generateMutation.mutate(cleanData) 
        }} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class" required error={errors.classId}>
              <select className={clsx('input', errors.classId && 'border-rose-500/50')} value={form.classId} onChange={e => { 
                const cid = e.target.value
                const cls = (Array.isArray(classes) ? classes : classes?.classes || []).find(c => c._id === cid)
                setForm(p => ({ ...p, classId: cid, studentId: '', academicYear: cls?.academicYear || '2024-2025' }))
                setErrors(p => ({ ...p, classId: undefined })) 
              }} required>
                <option value="">Select class...</option>
                {(Array.isArray(classes) ? classes : classes?.classes || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Student" required error={errors.studentId}>
              <select className={clsx('input', errors.studentId && 'border-rose-500/50')} value={form.studentId} onChange={e => { setForm(p => ({ ...p, studentId: e.target.value })); setErrors(p => ({ ...p, studentId: undefined })) }} required disabled={!form.classId}>
                <option value="">Select student...</option>
                {students?.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Select Period" required error={errors.period}>
            <div className="space-y-4">
              {singleStructure ? (
                <>
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Aggregate Reports</p>
                    <div className="flex gap-2">
                      <button type="button" 
                        onClick={() => {
                          setForm(p => ({ ...p, termName: '', examCode: '', quarter: '' }))
                          setErrors(p => ({ ...p, period: undefined }))
                        }}
                        className={clsx('flex-1 py-2 rounded-lg text-sm border transition-all',
                          (!form.termName && !form.examCode && !form.quarter) ? 'bg-azure-600/20 text-azure-400 border-azure-500/30' : 'bg-ink-700 text-slate-400 border-white/10'
                        )}>
                        Annual (Full Year)
                      </button>
                    </div>
                  </div>

                  {singleStructure.terms?.map(term => (
                    <div key={term.name} className="space-y-2">
                      <p className="text-xs text-slate-500 uppercase tracking-widest">{term.name}</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" 
                          onClick={() => {
                            setForm(p => ({ ...p, termName: term.name, examCode: '', quarter: '' }))
                            setErrors(p => ({ ...p, period: undefined }))
                          }}
                          className={clsx('px-4 py-2 rounded-lg text-sm border transition-all',
                            (form.termName === term.name && !form.examCode) ? 'bg-azure-600/20 text-azure-400 border-azure-500/30' : 'bg-ink-700 text-slate-400 border-white/10'
                          )}>
                          Consolidated {term.name}
                        </button>
                        {term.exams?.map(exam => (
                          <button key={exam.code} type="button" 
                            onClick={() => {
                              setForm(p => ({ ...p, termName: term.name, examCode: exam.code, quarter: '' }))
                              setErrors(p => ({ ...p, period: undefined }))
                            }}
                            className={clsx('px-4 py-2 rounded-lg text-sm border transition-all',
                              (form.examCode === exam.code) ? 'bg-jade-600/20 text-jade-400 border-jade-500/30' : 'bg-ink-700 text-slate-400 border-white/10'
                            )}>
                            {exam.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                  <p className="text-xs text-amber-500">No academic structure linked to this class. Please contact admin.</p>
                </div>
              )}
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
      
      {/* Bulk Generate Modal */}
      {showBulkModal && (
        <Modal open={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Generate Reports">
          <form onSubmit={(e) => {
            e.preventDefault()
            const cleanBulkData = Object.fromEntries(
              Object.entries(bulkForm).filter(([_, v]) => v !== '')
            )
            bulkMutation.mutate(cleanBulkData)
            setShowBulkModal(false)
          }} className="space-y-4">
            <div className="bg-azure-500/5 border border-azure-500/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-azure-400">Generate reports for all students in the selected class for a specific term or exam.</p>
            </div>

            <Field label="Target Term">
              <select 
                className="input" 
                value={bulkForm.termName} 
                onChange={e => {
                  setBulkForm(p => ({ ...p, termName: e.target.value, examCode: '' }))
                }}
              >
                <option value="">Annual (Full Year)</option>
                {bulkStructure?.terms?.map(t => (
                  <option key={t.name} value={t.name}>{t.name}</option>
                ))}
              </select>
            </Field>

            {bulkForm.termName && (
              <Field label="Specific Exam (Optional)">
                <select 
                  className="input" 
                  value={bulkForm.examCode} 
                  onChange={e => setBulkForm(p => ({ ...p, examCode: e.target.value }))}
                >
                  <option value="">Whole Term</option>
                  {bulkStructure?.terms?.find(t => t.name === bulkForm.termName)?.exams.map(ex => (
                    <option key={ex.code} value={ex.code}>{ex.name}</option>
                  ))}
                </select>
              </Field>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setShowBulkModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={bulkMutation.isPending}>
                {bulkMutation.isPending ? 'Generating...' : 'Start Bulk Generation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

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
                <p className="text-white font-semibold">{showReport.classId?.name}</p>
                <p className="text-xs text-azure-400 font-mono mt-0.5">
                  {showReport.examCode || showReport.termName || 'Annual'} — {showReport.academicYear}
                </p>
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
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(s.quarters || {}).map(([key, val]) => (
                          <div key={key} className="flex-1 min-w-[80px] text-center py-2 rounded-lg bg-ink-800">
                            <p className="text-[10px] text-slate-500 uppercase">{key}</p>
                            <p className="font-mono font-bold text-white text-sm">{val.marksObtained ?? '—'}</p>
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
