import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classesAPI, usersAPI, academicStructureAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, Table, Pagination } from '../../components/ui'
import { BookOpen, Plus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { Trash2 } from 'lucide-react'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']

export default function AdminClasses() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showAssign, setShowAssign] = useState(null)
  const [page, setPage] = useState(1)
  const limit = 10
  const [form, setForm] = useState({ name: '', grade: '', section: '', academicYear: '2026-2027', room: '', maxStudents: 35, academicStructure: '' })
  const [classErrors, setClassErrors] = useState({})
  const [assignTeacherId, setAssignTeacherId] = useState('')
  const [showDelete, setShowDelete] = useState(null)

  const resetClassForm = () => {
    setForm({ name: '', grade: '', section: '', academicYear: '2026-2027', room: '', maxStudents: 35, academicStructure: '' })
    setClassErrors({})
  }

  const validateClass = () => {
    const errs = {}
    if (!form.name?.trim()) errs.name = 'Class name is required.'
    if (!form.grade?.trim()) errs.grade = 'Grade is required.'
    if (!form.section?.trim()) errs.section = 'Section is required.'
    if (!form.academicYear?.trim()) errs.academicYear = 'Academic year is required.'
    if (!form.maxStudents || form.maxStudents < 1) errs.maxStudents = 'Max students is required.'
    setClassErrors(errs)
    return Object.keys(errs).length === 0
  }

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

  const { data: structures } = useQuery({
    queryKey: ['academic-structures'],
    queryFn: () => academicStructureAPI.getAll(),
  })

  const createMutation = useMutation({
    mutationFn: classesAPI.create,
    onSuccess: () => { toast.success('Class created'); qc.invalidateQueries({ queryKey: ['classes'] }); setShowCreate(false); resetClassForm() },
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, teacherId }) => classesAPI.assignTeacher(id, teacherId),
    onSuccess: () => { toast.success('Teacher assigned'); qc.invalidateQueries({ queryKey: ['classes'] }); setShowAssign(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: classesAPI.delete,
    onSuccess: () => { toast.success('Class deleted'); qc.invalidateQueries({ queryKey: ['classes'] }) },
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
              headers={['S.No', 'Class', 'Room', 'Class Teacher', 'Structure', 'Students', 'Actions']}
              empty={!displayedClasses.length ? <EmptyState icon={BookOpen} title="No classes yet" /> : null}
            >
              {displayedClasses.map((cls, idx) => (
                <tr key={cls._id} className="table-row">
                  <td className="table-td text-xs text-slate-400">{(page - 1) * limit + idx + 1}</td>
                  <td className="table-td">
                    <p className="text-white font-medium">{cls.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{cls.academicYear}</p>
                  </td>
                  <td className="table-td text-slate-400">{cls.room || '—'}</td>
                  <td className="table-td">
                    {cls.classTeacher ? (
                      <p className="text-sm text-white">{cls.classTeacher.firstName} {cls.classTeacher.lastName}</p>
                    ) : <span className="text-slate-600">Unassigned</span>}
                  </td>
                  <td className="table-td">
                    {cls.academicStructure?.name ? (
                      <span className="text-xs bg-ink-700 text-slate-300 border border-white/5 px-2 py-1 rounded">
                        {cls.academicStructure.name}
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="table-td">
                    <span className="font-mono text-slate-400">{cls.maxStudents}</span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setShowAssign(cls); setAssignTeacherId('') }}
                        className="flex items-center gap-1.5 text-xs text-azure-400 hover:text-azure-300 border border-azure-500/20 hover:border-azure-500/40 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Users className="w-3 h-3" /> Assign Class Teacher
                      </button>
                      <button
                        onClick={() => setShowDelete(cls)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetClassForm() }} title="Create New Class">
        <form onSubmit={(e) => { e.preventDefault(); if (!validateClass()) return; createMutation.mutate(form) }} className="space-y-4" noValidate>
          <Field label="Class Name" required error={classErrors.name}>
            <input className={clsx('input', classErrors.name && 'border-rose-500/50')} value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setClassErrors(p => ({...p, name: undefined})) }} placeholder="e.g. Grade 10 - Section A" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Grade" required error={classErrors.grade}>
              <input className={clsx('input', classErrors.grade && 'border-rose-500/50')} value={form.grade} onChange={e => { setForm(p => ({ ...p, grade: e.target.value })); setClassErrors(p => ({...p, grade: undefined})) }} placeholder="10" />
            </Field>
            <Field label="Section" required error={classErrors.section}>
              <input className={clsx('input', classErrors.section && 'border-rose-500/50')} value={form.section} onChange={e => { setForm(p => ({ ...p, section: e.target.value })); setClassErrors(p => ({...p, section: undefined})) }} placeholder="A" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Room">
              <input className="input" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} placeholder="Room 101" />
            </Field>
            <Field label="Max Students" required error={classErrors.maxStudents}>
              <input type="number" className={clsx('input', classErrors.maxStudents && 'border-rose-500/50')} value={form.maxStudents} onChange={e => { setForm(p => ({ ...p, maxStudents: Number(e.target.value) })); setClassErrors(p => ({...p, maxStudents: undefined})) }} />
            </Field>
          </div>
          <Field label="Academic Year" required error={classErrors.academicYear}>
            <input className={clsx('input', classErrors.academicYear && 'border-rose-500/50')} value={form.academicYear} onChange={e => { setForm(p => ({ ...p, academicYear: e.target.value })); setClassErrors(p => ({...p, academicYear: undefined})) }} />
          </Field>
          <Field label="Academic Structure (Dynamic Marks Entry)">
            <select className="input" value={form.academicStructure} onChange={e => setForm(p => ({ ...p, academicStructure: e.target.value }))}>
              <option value="">No special structure (Legacy Q1-Q4)</option>
              {structures?.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.terms.length} Terms)</option>
              ))}
            </select>
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

      {/* Delete Confirmation Modal */}
      <Modal open={!!showDelete} onClose={() => setShowDelete(null)} title="Are you sure?" size="sm">
        <div className="space-y-4">
          <p className="text-slate-300 text-base">
            Do you really want to delete class <span className="font-bold text-white">{showDelete?.name}</span>?
          </p>
          <div className="flex gap-3">
            <button
              disabled={deleteMutation.isPending}
              onClick={() => { deleteMutation.mutate(showDelete._id); setShowDelete(null); }}
              className="btn-primary flex-1 justify-center bg-rose-500 hover:bg-rose-600 border-rose-500 text-white disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={() => setShowDelete(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
