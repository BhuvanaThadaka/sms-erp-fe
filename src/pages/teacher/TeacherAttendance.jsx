import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesAPI, usersAPI, attendanceAPI } from '../../api'
import { useSocket } from '../../contexts/SocketContext'
import { SectionHeader, LoadingState, EmptyState } from '../../components/ui'
import { ClipboardList, Check, X, Clock, Save, Users, Wifi } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE']
const STATUS_STYLES = {
  PRESENT: { active: 'bg-jade-500/20 text-jade-400 border-jade-500/40', icon: Check },
  ABSENT: { active: 'bg-rose-500/20 text-rose-400 border-rose-500/40', icon: X },
  LATE: { active: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: Clock },
}

export default function TeacherAttendance() {
  const qc = useQueryClient()
  const { joinClass, leaveClass, lastAttendanceUpdate } = useSocket()
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [records, setRecords] = useState({}) // { studentId: status }
  const currentYear = '2024-2025'

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: currentYear }),
  })

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: () => usersAPI.getStudentsByClass(selectedClass),
    enabled: !!selectedClass,
  })

  const { data: existing } = useQuery({
    queryKey: ['attendance', selectedClass, date],
    queryFn: () => attendanceAPI.getAll({ classId: selectedClass, date }),
    enabled: !!selectedClass,
  })

  // Pre-fill existing attendance
  useEffect(() => {
    if (existing && students) {
      const init = {}
      students.forEach(s => {
        const rec = existing.find(e => e.studentId?._id === s._id || e.studentId === s._id)
        init[s._id] = rec?.status || 'PRESENT'
      })
      setRecords(init)
    }
  }, [existing, students])

  // Join class room for real-time
  useEffect(() => {
    if (selectedClass) {
      joinClass(selectedClass)
      return () => leaveClass(selectedClass)
    }
  }, [selectedClass])

  // Show toast on real-time update
  useEffect(() => {
    if (lastAttendanceUpdate) {
      toast.success('Attendance updated in real-time', { duration: 2000 })
    }
  }, [lastAttendanceUpdate])

  const bulkMutation = useMutation({
    mutationFn: attendanceAPI.bulkMark,
    onSuccess: () => {
      toast.success('Attendance saved successfully!')
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
  })

  const handleSave = () => {
    if (!selectedClass || !students?.length) return
    const payload = {
      classId: selectedClass,
      date,
      academicYear: currentYear,
      records: Object.entries(records).map(([studentId, status]) => ({ studentId, status })),
    }
    bulkMutation.mutate(payload)
  }

  const markAll = (status) => {
    const updated = {}
    students?.forEach(s => { updated[s._id] = status })
    setRecords(updated)
  }

  const presentCount = Object.values(records).filter(s => s === 'PRESENT').length
  const absentCount = Object.values(records).filter(s => s === 'ABSENT').length
  const lateCount = Object.values(records).filter(s => s === 'LATE').length

  return (
    <div className="space-y-5">
      <SectionHeader title="Mark Attendance" subtitle="Record real-time student attendance" />

      {/* Controls */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Select Class</label>
            <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Choose class...</option>
              {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => markAll('PRESENT')} className="btn-secondary flex-1 justify-center text-jade-400 border-jade-500/20 hover:bg-jade-500/5">
              All Present
            </button>
            <button onClick={() => markAll('ABSENT')} className="btn-secondary flex-1 justify-center text-rose-400 border-rose-500/20 hover:bg-rose-500/5">
              All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      {selectedClass && students?.length > 0 && (
        <div className="flex gap-3">
          {[
            { label: 'Present', count: presentCount, color: 'jade' },
            { label: 'Absent', count: absentCount, color: 'rose' },
            { label: 'Late', count: lateCount, color: 'amber' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`card px-4 py-3 flex-1 text-center bg-${color}-500/5 border-${color}-500/10`}>
              <p className={`font-display text-2xl font-bold text-${color}-400`}>{count}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Student list */}
      {!selectedClass ? (
        <EmptyState icon={Users} title="Select a class" description="Choose a class to start marking attendance" />
      ) : loadingStudents ? <LoadingState /> : !students?.length ? (
        <EmptyState icon={Users} title="No students" description="No students assigned to this class" />
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-sm text-slate-400">{students.length} students · {format(new Date(date), 'MMMM d, yyyy')}</p>
            <div className="flex items-center gap-2 text-xs text-jade-400">
              <Wifi className="w-3 h-3" /> Real-time sync
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {students.map((student, idx) => {
              const status = records[student._id] || 'PRESENT'
              return (
                <div key={student._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
                  <span className="text-xs text-slate-600 w-6 flex-shrink-0">{idx + 1}</span>
                  <div className="w-9 h-9 rounded-lg bg-ink-700 border border-white/5 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-slate-300">{student.firstName[0]}{student.lastName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{student.firstName} {student.lastName}</p>
                    <p className="text-xs text-slate-500">{student.enrollmentNumber || student.email}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {STATUS_OPTIONS.map(s => {
                      const cfg = STATUS_STYLES[s]
                      const Icon = cfg.icon
                      return (
                        <button
                          key={s}
                          onClick={() => setRecords(p => ({ ...p, [student._id]: s }))}
                          className={clsx(
                            'w-9 h-9 rounded-lg border flex items-center justify-center transition-all text-xs font-medium',
                            status === s ? cfg.active : 'border-white/10 text-slate-600 hover:border-white/20 hover:text-slate-400'
                          )}
                          title={s}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="px-5 py-4 border-t border-white/5">
            <button
              onClick={handleSave}
              disabled={bulkMutation.isPending}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {bulkMutation.isPending ? 'Saving...' : `Save Attendance (${Object.keys(records).length} students)`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
