import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsAPI, classesAPI, usersAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, AttendanceRing } from '../../components/ui'
import { BarChart3, Plus, Download, Users } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const QUARTERS = ['Q1','Q2','Q3','Q4']
const PERFORMANCE_COLORS = { EXCELLENT: 'jade', GOOD: 'azure', AVERAGE: 'amber', BELOW_AVERAGE: 'rose' }

export default function TeacherReports() {
  const qc = useQueryClient()
  const [showGenerate, setShowGenerate] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const currentYear = '2024-2025'
  const [form, setForm] = useState({ studentId: '', classId: '', quarter: 'Q1', academicYear: currentYear, teacherRemarks: '', participationSummary: '', overallPerformance: 'GOOD' })

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsAPI.getAll({ academicYear: currentYear }),
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
    mutationFn: reportsAPI.generate,
    onSuccess: () => { toast.success('Report generated!'); qc.invalidateQueries({ queryKey: ['reports'] }); setShowGenerate(false) },
  })

  const bulkMutation = useMutation({
    mutationFn: reportsAPI.bulkGenerate,
    onSuccess: (data) => {
      const ok = data.filter(r => r.success).length
      toast.success(`Generated ${ok} reports`)
      qc.invalidateQueries({ queryKey: ['reports'] })
    },
  })

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Reports"
        subtitle={`${reports?.length || 0} reports generated`}
        action={
          <div className="flex gap-2">
            <button onClick={() => { if (!selectedClass) return toast.error('Select a class first'); bulkMutation.mutate({ classId: selectedClass, quarter: 'Q1', academicYear: currentYear }) }}
              disabled={!selectedClass || bulkMutation.isPending}
              className="btn-secondary disabled:opacity-50"
            >
              <Users className="w-4 h-4" /> Bulk Generate
            </button>
            <button onClick={() => setShowGenerate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Generate
            </button>
          </div>
        }
      />

      {/* Class filter */}
      <div className="card p-4">
        <select className="input max-w-xs" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">Filter by class...</option>
          {(classes?.classes || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? <LoadingState /> : !reports?.length ? (
        <EmptyState icon={BarChart3} title="No reports yet" description="Generate your first quarterly report" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports
            .filter(r => !selectedClass || r.classId?._id === selectedClass || r.classId === selectedClass)
            .map(r => {
              const pColor = PERFORMANCE_COLORS[r.overallPerformance] || 'azure'
              return (
                <div key={r._id} className="card card-hover p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-white font-semibold font-display">{r.studentId?.firstName} {r.studentId?.lastName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{r.classId?.name}</p>
                    </div>
                    <AttendanceRing percentage={r.attendancePercentage} size={56} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-azure-500/10 text-azure-400 border border-azure-500/20 text-xs px-2 py-0.5 rounded-full font-mono">{r.quarter}</span>
                    <span className={`bg-${pColor}-500/10 text-${pColor}-400 border border-${pColor}-500/20 text-xs px-2 py-0.5 rounded-full`}>{r.overallPerformance}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="bg-jade-500/5 rounded-lg py-2">
                      <p className="font-display font-bold text-jade-400">{r.presentDays}</p>
                      <p className="text-xs text-slate-600">Present</p>
                    </div>
                    <div className="bg-rose-500/5 rounded-lg py-2">
                      <p className="font-display font-bold text-rose-400">{r.absentDays}</p>
                      <p className="text-xs text-slate-600">Absent</p>
                    </div>
                    <div className="bg-amber-500/5 rounded-lg py-2">
                      <p className="font-display font-bold text-amber-400">{r.lateDays}</p>
                      <p className="text-xs text-slate-600">Late</p>
                    </div>
                  </div>
                  {r.pdfUrl && (
                    <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-azure-400 hover:text-azure-300 transition-colors"
                    >
                      <Download className="w-3 h-3" /> Download PDF
                    </a>
                  )}
                  <p className="text-xs text-slate-600 mt-2">{format(new Date(r.generatedAt), 'MMM d, yyyy')}</p>
                </div>
              )
            })}
        </div>
      )}

      {/* Generate Modal */}
      <Modal open={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Report" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); generateMutation.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <select className="input" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value, studentId: '' }))} required>
                <option value="">Select class...</option>
                {(classes?.classes || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Student">
              <select className="input" value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))} required disabled={!form.classId}>
                <option value="">Select student...</option>
                {students?.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quarter">
              <select className="input" value={form.quarter} onChange={e => setForm(p => ({ ...p, quarter: e.target.value }))}>
                {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </Field>
            <Field label="Performance">
              <select className="input" value={form.overallPerformance} onChange={e => setForm(p => ({ ...p, overallPerformance: e.target.value }))}>
                {Object.keys(PERFORMANCE_COLORS).map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Teacher Remarks">
            <textarea className="input min-h-[80px] resize-none" value={form.teacherRemarks} onChange={e => setForm(p => ({ ...p, teacherRemarks: e.target.value }))} placeholder="Overall performance comments..." />
          </Field>
          <Field label="Participation Summary">
            <textarea className="input min-h-[60px] resize-none" value={form.participationSummary} onChange={e => setForm(p => ({ ...p, participationSummary: e.target.value }))} placeholder="Class participation notes..." />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={generateMutation.isPending} className="btn-primary flex-1 justify-center">
              {generateMutation.isPending ? 'Generating PDF...' : 'Generate Report'}
            </button>
            <button type="button" onClick={() => setShowGenerate(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
