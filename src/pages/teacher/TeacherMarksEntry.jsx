import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectsAPI, usersAPI, marksAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Field } from '../../components/ui'
import { ClipboardList, Save, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const GRADE_COLORS = { 'A+': 'text-jade-400', A: 'text-jade-400', B: 'text-azure-400', C: 'text-amber-400', D: 'text-rose-400', F: 'text-rose-500' }

const calcGrade = (pct) => {
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 40) return 'D'
  return 'F'
}

export default function TeacherMarksEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedQuarter, setSelectedQuarter] = useState('Q1')
  const [marks, setMarks] = useState({}) // { studentId: { marks, remarks, isAbsent } }
  const currentYear = '2024-2025'

  const { data: mySubjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: () => subjectsAPI.getMy({ academicYear: currentYear }),
  })

  const currentSubject = mySubjects?.find(s => s._id === selectedSubject)
  const classId = currentSubject?.classId?._id || currentSubject?.classId

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', classId],
    queryFn: () => usersAPI.getStudentsByClass(classId),
    enabled: !!classId,
  })

  const { data: existingMarks } = useQuery({
    queryKey: ['marks', selectedSubject, selectedQuarter],
    queryFn: () => marksAPI.getAll({ subjectId: selectedSubject, quarter: selectedQuarter, academicYear: currentYear }),
    enabled: !!selectedSubject,
  })

  // Pre-fill existing marks
  useEffect(() => {
    if (existingMarks && students) {
      const init = {}
      students.forEach(s => {
        const rec = existingMarks.find(m => m.studentId?._id === s._id || m.studentId === s._id)
        init[s._id] = rec
          ? { marksObtained: rec.marksObtained, remarks: rec.teacherRemarks || '', isAbsent: rec.isAbsent || false }
          : { marksObtained: '', remarks: '', isAbsent: false }
      })
      setMarks(init)
    }
  }, [existingMarks, students])

  const bulkMutation = useMutation({
    mutationFn: marksAPI.bulkEnter,
    onSuccess: () => {
      toast.success('Marks saved successfully!')
      qc.invalidateQueries(['marks'])
    },
  })

  const handleSave = () => {
    if (!selectedSubject || !students?.length) return
    const maxMarks = currentSubject?.maxMarks || 100
    const records = Object.entries(marks)
      .filter(([_, v]) => v.isAbsent || (v.marksObtained !== '' && v.marksObtained !== undefined))
      .map(([studentId, v]) => ({
        studentId,
        marksObtained: v.isAbsent ? 0 : Number(v.marksObtained),
        teacherRemarks: v.remarks,
        isAbsent: v.isAbsent || false,
      }))

    if (!records.length) return toast.error('Enter at least one student\'s marks')

    bulkMutation.mutate({
      subjectId: selectedSubject,
      classId,
      quarter: selectedQuarter,
      maxMarks,
      academicYear: currentYear,
      records,
    })
  }

  const updateMark = (studentId, field, value) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
  }

  const filledCount = Object.values(marks).filter(m => m.marksObtained !== '' || m.isAbsent).length

  return (
    <div className="space-y-5">
      <SectionHeader title="Enter Marks" subtitle="Enter quarterly marks for your assigned subjects" />

      {/* Subject & Quarter selector */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="My Subject">
            {loadingSubjects ? <div className="input flex items-center text-slate-500 text-sm">Loading...</div> : (
              <select className="input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                <option value="">Select subject...</option>
                {mySubjects?.map(s => (
                  <option key={s._id} value={s._id}>{s.name} — {s.classId?.name}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Quarter">
            <div className="flex gap-2">
              {QUARTERS.map(q => (
                <button key={q} onClick={() => setSelectedQuarter(q)}
                  className={clsx('flex-1 py-2 rounded-lg text-sm font-medium border transition-all',
                    selectedQuarter === q ? 'bg-azure-600/20 text-azure-400 border-azure-500/30' : 'bg-ink-700 text-slate-400 border-white/10 hover:border-white/20'
                  )}>
                  {q}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Subject Info">
            {currentSubject ? (
              <div className="bg-ink-700 rounded-lg px-3 py-2.5 border border-white/5 text-sm">
                <p className="text-white font-medium">{currentSubject.name}</p>
                <p className="text-slate-500 text-xs">Max: {currentSubject.maxMarks} · Pass: {currentSubject.passingMarks}</p>
              </div>
            ) : (
              <div className="bg-ink-700 rounded-lg px-3 py-2.5 border border-white/5 text-slate-600 text-sm">Select a subject</div>
            )}
          </Field>
        </div>
      </div>

      {!selectedSubject ? (
        <EmptyState icon={BookOpen} title="Select a subject" description="Choose a subject to start entering marks" />
      ) : loadingStudents ? <LoadingState /> : !students?.length ? (
        <EmptyState icon={ClipboardList} title="No students" description="No students assigned to this class" />
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold font-display">{currentSubject?.name} — {selectedQuarter}</p>
              <p className="text-slate-500 text-xs">{students.length} students · {filledCount} filled</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                const init = {}
                students.forEach(s => { init[s._id] = { marksObtained: '', remarks: '', isAbsent: false } })
                setMarks(init)
              }} className="btn-secondary text-xs py-1.5">Clear All</button>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-3 px-5 py-2.5 bg-white/2 text-xs text-slate-500 uppercase tracking-wider font-medium">
              <div className="col-span-3">Student</div>
              <div className="col-span-2">Marks / {currentSubject?.maxMarks}</div>
              <div className="col-span-1 text-center">%</div>
              <div className="col-span-1 text-center">Grade</div>
              <div className="col-span-1 text-center">Absent</div>
              <div className="col-span-4">Remarks</div>
            </div>

            {students.map((student, idx) => {
              const m = marks[student._id] || {}
              const maxM = currentSubject?.maxMarks || 100
              const pct = m.isAbsent ? 0 : (m.marksObtained !== '' ? Math.round((Number(m.marksObtained) / maxM) * 100) : null)
              const grade = pct !== null ? calcGrade(pct) : '—'
              const isPass = pct !== null && pct >= ((currentSubject?.passingMarks || 40) / maxM * 100)

              return (
                <div key={student._id} className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-white/2 transition-colors">
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="text-xs text-slate-600 w-5">{idx + 1}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-slate-500">{student.enrollmentNumber || ''}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      max={maxM}
                      disabled={m.isAbsent}
                      className={clsx('input text-sm py-1.5', m.isAbsent && 'opacity-40')}
                      value={m.isAbsent ? 'AB' : (m.marksObtained ?? '')}
                      onChange={e => updateMark(student._id, 'marksObtained', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {pct !== null ? (
                      <span className={clsx('text-sm font-mono font-bold', isPass ? 'text-jade-400' : 'text-rose-400')}>
                        {pct}%
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={clsx('text-sm font-bold font-display', GRADE_COLORS[grade] || 'text-slate-500')}>{grade}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <input
                      type="checkbox"
                      checked={m.isAbsent || false}
                      onChange={e => updateMark(student._id, 'isAbsent', e.target.checked)}
                      className="w-4 h-4 rounded accent-rose-500"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      className="input text-sm py-1.5"
                      value={m.remarks || ''}
                      onChange={e => updateMark(student._id, 'remarks', e.target.value)}
                      placeholder="Optional remarks..."
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-4 border-t border-white/5">
            <button onClick={handleSave} disabled={bulkMutation.isPending} className="btn-primary w-full justify-center py-2.5 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {bulkMutation.isPending ? 'Saving...' : `Save Marks (${filledCount} entries)`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
