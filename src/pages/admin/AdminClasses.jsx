import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesAPI, usersAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, Table, Pagination } from '../../components/ui'
import { BookOpen, Plus, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']

export default function AdminClasses() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showAssign, setShowAssign] = useState(null)
  const [page, setPage] = useState(1)
  const limit = 10
  const [form, setForm] = useState({ name: '', grade: '', section: '', academicYear: '2026-2027', room: '', maxStudents: 35 })
  const [assignTeacherId, setAssignTeacherId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['classes', page],
    queryFn: () => classesAPI.getAll({ page, limit }),
    keepPreviousData: true
  })

  const rawClasses = data?.classes || (Array.isArray(data) ? data : [])
  const total = data?.total || rawClasses.length
  const totalPages = data?.totalPages || Math.ceil(total / limit) || 1

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => usersAPI.getAll({ role: 'TEACHER' }),
  })

  const createMutation = useMutation({
    mutationFn: classesAPI.create,
    onSuccess: () => { toast.success('Class created'); qc.invalidateQueries({ queryKey: ['classes'] }); setShowCreate(false) },
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, teacherId }) => classesAPI.assignTeacher(id, teacherId),
    onSuccess: () => { toast.success('Teacher assigned'); qc.invalidateQueries({ queryKey: ['classes'] }); setShowAssign(null) },
  })

  const displayedClasses = (data && !data.classes && rawClasses.length > limit)
    ? rawClasses.slice((page - 1) * limit, page * limit)
    : rawClasses

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Classes"
        subtitle={`${total || 0} classes this academic year`}
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Class
          </button>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? <LoadingState /> : (
          <>
            <Table
              headers={['S.No', 'Class', 'Grade', 'Room', 'Class Teacher', 'Teachers', 'Students Cap', 'Actions']}
              empty={!displayedClasses.length ? <EmptyState icon={BookOpen} title="No classes yet" /> : null}
            >
              {displayedClasses.map((cls, idx) => (
                <tr key={cls._id} className="table-row">
                  <td className="table-td text-xs text-slate-400">{(page - 1) * limit + idx + 1}</td>
                  <td className="table-td">
                    <p className="text-white font-medium">{cls.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{cls.academicYear}</p>
                  </td>
                  <td className="table-td">
                    <span className="bg-azure-500/10 text-azure-400 border border-azure-500/20 text-xs px-2 py-0.5 rounded-full">
                      Grade {cls.grade} — {cls.section}
                    </span>
                  </td>
                  <td className="table-td text-slate-400">{cls.room || '—'}</td>
                  <td className="table-td">
                    {cls.classTeacher ? (
                      <p className="text-sm text-white">{cls.classTeacher.firstName} {cls.classTeacher.lastName}</p>
                    ) : <span className="text-slate-600">Unassigned</span>}
                  </td>
                  <td className="table-td">
                    <span className="text-slate-400">{cls.teachers?.length || 0} teachers</span>
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-slate-400">{cls.maxStudents}</span>
                  </td>
                  <td className="table-td">
                    <button
                      onClick={() => { setShowAssign(cls); setAssignTeacherId('') }}
                      className="flex items-center gap-1.5 text-xs text-azure-400 hover:text-azure-300 border border-azure-500/20 hover:border-azure-500/40 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      <Users className="w-3 h-3" /> Assign Teacher
                    </button>
                  </td>
                </tr>
              ))}
            </Table>

            <Pagination 
              page={page} 
              totalPages={totalPages} 
              total={total} 
              limit={limit} 
              onPageChange={setPage} 
            />
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Class">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <Field label="Class Name">
            <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Grade 10 - Section A" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Grade">
              <input className="input" value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} placeholder="10" required />
            </Field>
            <Field label="Section">
              <input className="input" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} placeholder="A" required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room">
              <input className="input" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="Room 101" />
            </Field>
            <Field label="Max Students">
              <input type="number" className="input" value={form.maxStudents} onChange={e => setForm(p => ({ ...p, maxStudents: Number(e.target.value) }))} />
            </Field>
          </div>
          <Field label="Academic Year">
            <input className="input" value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))} required />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
              {createMutation.isPending ? 'Creating...' : 'Create Class'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Assign Teacher Modal */}
      <Modal open={!!showAssign} onClose={() => setShowAssign(null)} title={`Assign Teacher — ${showAssign?.name}`} size="sm">
        <div className="space-y-4">
          <Field label="Select Teacher">
            <select className="input" value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)}>
              <option value="">Choose a teacher...</option>
              {teachers?.map(t => (
                <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
          </Field>
          <div className="flex gap-3">
            <button
              disabled={!assignTeacherId || assignMutation.isPending}
              onClick={() => assignMutation.mutate({ id: showAssign._id, teacherId: assignTeacherId })}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign'}
            </button>
            <button onClick={() => setShowAssign(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
