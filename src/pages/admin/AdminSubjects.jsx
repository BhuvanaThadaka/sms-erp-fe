import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subjectsAPI, classesAPI, usersAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, Table } from '../../components/ui'
import { BookOpen, Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminSubjects() {
  const qc = useQueryClient()
  const [classFilter, setClassFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const currentYear = '2024-2025'

  const [form, setForm] = useState({
    name: '', code: '', description: '', classId: '', subjectTeacher: '',
    academicYear: currentYear, maxMarks: 100, passingMarks: 40,
  })

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects', classFilter, currentYear],
    queryFn: () => subjectsAPI.getAll({ classId: classFilter || undefined, academicYear: currentYear }),
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: currentYear }),
  })

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => usersAPI.getAll({ role: 'TEACHER' }),
  })

  const createMutation = useMutation({
    mutationFn: subjectsAPI.create,
    onSuccess: () => { toast.success('Subject created!'); qc.invalidateQueries(['subjects']); setShowCreate(false); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => subjectsAPI.update(id, data),
    onSuccess: () => { toast.success('Subject updated!'); qc.invalidateQueries(['subjects']); setEditSubject(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: subjectsAPI.delete,
    onSuccess: () => { toast.success('Subject deactivated'); qc.invalidateQueries(['subjects']) },
  })

  const resetForm = () => setForm({ name: '', code: '', description: '', classId: '', subjectTeacher: '', academicYear: currentYear, maxMarks: 100, passingMarks: 40 })

  const filtered = subjects?.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.code?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Subjects"
        subtitle={`${subjects?.length || 0} subjects configured`}
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Subject
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input max-w-[200px]" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <LoadingState /> : (
          <Table
            headers={['Subject', 'Code', 'Class', 'Subject Teacher', 'Max Marks', 'Passing', 'Actions']}
            empty={!filtered.length ? <EmptyState icon={BookOpen} title="No subjects yet" description="Create subjects and assign them to classes" /> : null}
          >
            {filtered.map(s => (
              <tr key={s._id} className="table-row">
                <td className="table-td">
                  <p className="text-white font-medium">{s.name}</p>
                  {s.description && <p className="text-xs text-slate-500 truncate max-w-[180px]">{s.description}</p>}
                </td>
                <td className="table-td">
                  <span className="font-mono text-xs bg-ink-700 border border-white/10 px-2 py-0.5 rounded text-azure-400">{s.code}</span>
                </td>
                <td className="table-td">
                  <p className="text-slate-300 text-sm">{s.classId?.name}</p>
                  <p className="text-xs text-slate-500">Grade {s.classId?.grade} – {s.classId?.section}</p>
                </td>
                <td className="table-td">
                  <p className="text-slate-300 text-sm">{s.subjectTeacher?.firstName} {s.subjectTeacher?.lastName}</p>
                  <p className="text-xs text-slate-500">{s.subjectTeacher?.email}</p>
                </td>
                <td className="table-td font-mono text-jade-400">{s.maxMarks}</td>
                <td className="table-td font-mono text-amber-400">{s.passingMarks}</td>
                <td className="table-td">
                  <div className="flex gap-2">
                    <button onClick={() => setEditSubject(s)} className="p-1.5 text-slate-400 hover:text-azure-400 hover:bg-azure-500/10 rounded-lg">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(`Deactivate ${s.name}?`)) deleteMutation.mutate(s._id) }} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm() }} title="Create Subject" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject Name">
              <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Mathematics" />
            </Field>
            <Field label="Subject Code">
              <input className="input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} required placeholder="e.g. MATH10" />
            </Field>
          </div>
          <Field label="Description">
            <input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <select className="input" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))} required>
                <option value="">Select class...</option>
                {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Subject Teacher">
              <select className="input" value={form.subjectTeacher} onChange={e => setForm(p => ({ ...p, subjectTeacher: e.target.value }))} required>
                <option value="">Select teacher...</option>
                {teachers?.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max Marks">
              <input type="number" className="input" value={form.maxMarks} onChange={e => setForm(p => ({ ...p, maxMarks: Number(e.target.value) }))} />
            </Field>
            <Field label="Passing Marks">
              <input type="number" className="input" value={form.passingMarks} onChange={e => setForm(p => ({ ...p, passingMarks: Number(e.target.value) }))} />
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
              {createMutation.isPending ? 'Creating...' : 'Create Subject'}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); resetForm() }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editSubject} onClose={() => setEditSubject(null)} title="Edit Subject" size="md">
        {editSubject && (
          <form onSubmit={(e) => {
            e.preventDefault()
            updateMutation.mutate({ id: editSubject._id, data: {
              name: editSubject.name,
              description: editSubject.description,
              subjectTeacher: editSubject.subjectTeacher?._id || editSubject.subjectTeacher,
              maxMarks: editSubject.maxMarks,
              passingMarks: editSubject.passingMarks,
            }})
          }} className="space-y-4">
            <Field label="Subject Name">
              <input className="input" value={editSubject.name} onChange={e => setEditSubject(p => ({ ...p, name: e.target.value }))} required />
            </Field>
            <Field label="Subject Teacher">
              <select className="input" value={editSubject.subjectTeacher?._id || editSubject.subjectTeacher || ''}
                onChange={e => setEditSubject(p => ({ ...p, subjectTeacher: e.target.value }))}>
                {teachers?.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Max Marks">
                <input type="number" className="input" value={editSubject.maxMarks} onChange={e => setEditSubject(p => ({ ...p, maxMarks: Number(e.target.value) }))} />
              </Field>
              <Field label="Passing Marks">
                <input type="number" className="input" value={editSubject.passingMarks} onChange={e => setEditSubject(p => ({ ...p, passingMarks: Number(e.target.value) }))} />
              </Field>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1 justify-center">Save</button>
              <button type="button" onClick={() => setEditSubject(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
