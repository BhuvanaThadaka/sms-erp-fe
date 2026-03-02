import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI, classesAPI, assignmentAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Table, Badge } from '../../components/ui'
import { UserCheck, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminStudentAssignment() {
  const qc = useQueryClient()
  const [classFilter, setClassFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [targetClass, setTargetClass] = useState('')
  const currentYear = '2024-2025'

  const { data: students, isLoading } = useQuery({
    queryKey: ['students-all'],
    queryFn: () => usersAPI.getAll({ role: 'STUDENT' }),
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: currentYear }),
  })

  const assignMutation = useMutation({
    mutationFn: ({ studentId, classId }) => assignmentAPI.assignStudent(studentId, classId),
    onSuccess: () => { qc.invalidateQueries(['students-all']); toast.success('Student assigned!') },
  })

  const bulkAssignMutation = useMutation({
    mutationFn: ({ studentIds, classId }) => assignmentAPI.bulkAssign(studentIds, classId),
    onSuccess: (res) => {
      const ok = res.filter(r => r.success).length
      toast.success(`${ok} students assigned to class`)
      qc.invalidateQueries(['students-all'])
      setSelectedStudents([])
    },
  })

  const filtered = students?.filter(s =>
    `${s.firstName} ${s.lastName} ${s.email} ${s.enrollmentNumber || ''}`.toLowerCase().includes(search.toLowerCase()) &&
    (!classFilter || (s.classId?._id === classFilter || s.classId === classFilter))
  ) || []

  const toggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedStudents.length === filtered.length) setSelectedStudents([])
    else setSelectedStudents(filtered.map(s => s._id))
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Student Assignment"
        subtitle="Assign students to their respective classes"
        action={
          selectedStudents.length > 0 && (
            <div className="flex items-center gap-3">
              <select className="input max-w-[180px]" value={targetClass} onChange={e => setTargetClass(e.target.value)}>
                <option value="">Select class...</option>
                {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <button
                onClick={() => { if (!targetClass) return toast.error('Select a class'); bulkAssignMutation.mutate({ studentIds: selectedStudents, classId: targetClass }) }}
                disabled={!targetClass || bulkAssignMutation.isPending}
                className="btn-primary disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                Assign {selectedStudents.length} Student{selectedStudents.length > 1 ? 's' : ''}
              </button>
            </div>
          )
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[200px]" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
          <option value="">All students</option>
          <option value="unassigned">Unassigned</option>
          {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <LoadingState /> : (
          <Table
            headers={['', 'Student', 'Enrollment No.', 'Current Class', 'Assign To', 'Action']}
            empty={!filtered.length ? <EmptyState icon={Users} title="No students found" /> : null}
          >
            <tr className="border-b border-white/5 bg-white/2">
              <td colSpan={6} className="px-4 py-2">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={selectedStudents.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="w-3.5 h-3.5 rounded" />
                  Select all {filtered.length} students
                </label>
              </td>
            </tr>
            {filtered.map(student => (
              <tr key={student._id} className={clsx('table-row', selectedStudents.includes(student._id) && 'bg-azure-500/5')}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={() => toggleStudent(student._id)}
                    className="w-4 h-4 rounded accent-azure-500"
                  />
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ink-700 border border-white/5 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-300">{student.firstName[0]}{student.lastName[0]}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{student.firstName} {student.lastName}</p>
                      <p className="text-slate-500 text-xs">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td font-mono text-xs text-slate-400">{student.enrollmentNumber || '—'}</td>
                <td className="table-td">
                  {student.classId ? (
                    <span className="text-sm text-jade-400 bg-jade-500/10 border border-jade-500/20 px-2 py-0.5 rounded-full text-xs">
                      {student.classId?.name || student.classId}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600 bg-ink-700 px-2 py-0.5 rounded-full">Unassigned</span>
                  )}
                </td>
                <td className="table-td">
                  <select className="input text-xs py-1.5 max-w-[150px]"
                    defaultValue=""
                    id={`class-${student._id}`}
                  >
                    <option value="">Choose...</option>
                    {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </td>
                <td className="table-td">
                  <button
                    onClick={() => {
                      const sel = document.getElementById(`class-${student._id}`)
                      if (!sel.value) return toast.error('Choose a class first')
                      assignMutation.mutate({ studentId: student._id, classId: sel.value })
                    }}
                    disabled={assignMutation.isPending}
                    className="text-xs btn-primary py-1.5 disabled:opacity-50"
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  )
}
