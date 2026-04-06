import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { subjectsAPI, classesAPI, usersAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, Table, InfiniteSelect } from '../../components/ui'
import { BookOpen, Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminSubjects() {
  const qc = useQueryClient()
  const [classFilter, setClassFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editSubject, setEditSubject] = useState(null)
  const [showDelete, setShowDelete] = useState(null)
  const currentYear = '2024-2025'

  const [form, setForm] = useState({
    name: '', code: '', description: '', classId: '', subjectTeacher: '',
    academicYear: currentYear, maxMarks: 100, passingMarks: 40,
  })
  const [subjectErrors, setSubjectErrors] = useState({})

  const validateSubject = (data) => {
    const errs = {}
    if (!data.name?.trim()) errs.name = 'Subject name is required.'
    if (!data.code?.trim()) errs.code = 'Subject code is required.'
    if (!data.classId) errs.classId = 'Class is required.'
    if (!data.subjectTeacher) errs.subjectTeacher = 'Teacher is required.'
    return errs
  }

  const { data: subjects, isLoading } = useQuery({
    queryKey: ['subjects', classFilter, currentYear],
    queryFn: () => subjectsAPI.getAll({ classId: classFilter || undefined, academicYear: currentYear }),
  })

  const { 
    data: classesPages, 
    fetchNextPage: fetchNextClasses, 
    hasNextPage: hasNextClasses, 
    isFetchingNextPage: isFetchingMoreClasses,
    isLoading: isClassesLoading
  } = useInfiniteQuery({
    queryKey: ['classes-infinite'],
    queryFn: ({ pageParam = 1 }) => classesAPI.getAll({ page: pageParam, limit: 10 }),
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  })

  const classOptions = classesPages?.pages.flatMap(page => 
    page.classes?.map(c => ({ value: c._id, label: c.name })) || []
  ) || []

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => usersAPI.getAll({ role: 'TEACHER' }),
  })

  const createMutation = useMutation({
    mutationFn: subjectsAPI.create,
    onSuccess: () => { toast.success('Subject created!'); qc.invalidateQueries({ queryKey: ['subjects'] }); setShowCreate(false); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => subjectsAPI.update(id, data),
    onSuccess: () => { toast.success('Subject updated!'); qc.invalidateQueries({ queryKey: ['subjects'] }); setEditSubject(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: subjectsAPI.delete,
    onSuccess: () => { toast.success('Subject deactivated'); qc.invalidateQueries({ queryKey: ['subjects'] }) },
  })

  const resetForm = () => {
    setForm({ name: '', code: '', description: '', classId: '', subjectTeacher: '', academicYear: currentYear, maxMarks: 100, passingMarks: 40 })
    setSubjectErrors({})
  }

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
        <InfiniteSelect 
          placeholder="All Classes"
          className="w-[200px]"
          value={classFilter}
          onChange={setClassFilter}
          options={classOptions}
          isLoading={isClassesLoading}
          onFetchNextPage={fetchNextClasses}
          hasNextPage={hasNextClasses}
          isFetchingNextPage={isFetchingMoreClasses}
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <LoadingState /> : (
          <Table
            headers={['S.No', 'Subject', 'Code', 'Class', 'Subject Teacher', 'Max Marks', 'Passing', 'Actions']}
            empty={!filtered.length ? <EmptyState icon={BookOpen} title="No subjects yet" description="Create subjects and assign them to classes" /> : null}
          >
            {filtered.map((s, idx) => (
              <tr key={s._id} className="table-row">
                <td className="table-td text-xs text-slate-400">{idx + 1}</td>
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
                    <button onClick={() => setShowDelete(s)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg">
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
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          const errs = validateSubject(form);
          if (Object.keys(errs).length > 0) {
            setSubjectErrors(errs);
            return;
          }
          createMutation.mutate(form);
        }} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject Name" required error={subjectErrors.name}>
              <input className={clsx('input', subjectErrors.name && 'border-rose-500/50')} value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setSubjectErrors(p => ({...p, name: undefined})) }} placeholder="e.g. Mathematics" />
            </Field>
            <Field label="Subject Code" required error={subjectErrors.code}>
              <input className={clsx('input', subjectErrors.code && 'border-rose-500/50')} value={form.code} onChange={e => { setForm(p => ({ ...p, code: e.target.value })); setSubjectErrors(p => ({...p, code: undefined})) }} placeholder="e.g. MATH10" />
            </Field>
          </div>
          <Field label="Description">
            <input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class" required error={subjectErrors.classId}>
              <InfiniteSelect 
                placeholder="Select class..."
                value={form.classId}
                onChange={val => { setForm(p => ({ ...p, classId: val })); setSubjectErrors(p => ({...p, classId: undefined})) }}
                options={classOptions}
                isLoading={isClassesLoading}
                onFetchNextPage={fetchNextClasses}
                hasNextPage={hasNextClasses}
                isFetchingNextPage={isFetchingMoreClasses}
              />
            </Field>
            <Field label="Subject Teacher" required error={subjectErrors.subjectTeacher}>
              <select className={clsx('input', subjectErrors.subjectTeacher && 'border-rose-500/50')} value={form.subjectTeacher} onChange={e => { setForm(p => ({ ...p, subjectTeacher: e.target.value })); setSubjectErrors(p => ({...p, subjectTeacher: undefined})) }} required>
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
      <Modal open={!!editSubject} onClose={() => { setEditSubject(null); setSubjectErrors({}) }} title="Edit Subject" size="md">
        {editSubject && (
          <form onSubmit={(e) => {
            e.preventDefault()
            const errs = validateSubject(editSubject);
            if (Object.keys(errs).length > 0) {
              setSubjectErrors(errs);
              return;
            }
            updateMutation.mutate({ id: editSubject._id, data: {
              name: editSubject.name,
              code: editSubject.code,
              description: editSubject.description,
              classId: editSubject.classId?._id || editSubject.classId,
              subjectTeacher: editSubject.subjectTeacher?._id || editSubject.subjectTeacher,
              maxMarks: editSubject.maxMarks,
              passingMarks: editSubject.passingMarks,
            }})
          }} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Subject Name" required error={subjectErrors.name}>
                <input className={clsx('input', subjectErrors.name && 'border-rose-500/50')} value={editSubject.name} onChange={e => { setEditSubject(p => ({ ...p, name: e.target.value })); setSubjectErrors(p => ({ ...p, name: undefined })) }} required />
              </Field>
              <Field label="Subject Code" required error={subjectErrors.code}>
                <input className={clsx('input', subjectErrors.code && 'border-rose-500/50')} value={editSubject.code} onChange={e => { setEditSubject(p => ({ ...p, code: e.target.value })); setSubjectErrors(p => ({ ...p, code: undefined })) }} required />
              </Field>
            </div>
            <Field label="Description">
              <input className="input" value={editSubject.description} onChange={e => setEditSubject(p => ({ ...p, description: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Class" required error={subjectErrors.classId}>
                <InfiniteSelect 
                  placeholder="Select class..."
                  value={editSubject.classId?._id || editSubject.classId}
                  onChange={val => { setEditSubject(p => ({ ...p, classId: val })); setSubjectErrors(p => ({...p, classId: undefined})) }}
                  options={classOptions}
                  isLoading={isClassesLoading}
                  onFetchNextPage={fetchNextClasses}
                  hasNextPage={hasNextClasses}
                  isFetchingNextPage={isFetchingMoreClasses}
                />
              </Field>
              <Field label="Subject Teacher" required error={subjectErrors.subjectTeacher}>
                <select className={clsx('input', subjectErrors.subjectTeacher && 'border-rose-500/50')} value={editSubject.subjectTeacher?._id || editSubject.subjectTeacher || ''}
                  onChange={e => { setEditSubject(p => ({ ...p, subjectTeacher: e.target.value })); setSubjectErrors(p => ({ ...p, subjectTeacher: undefined })) }}>
                  <option value="">Select teacher...</option>
                  {teachers?.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}
                </select>
              </Field>
            </div>
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

      {/* Delete Confirmation Modal */}
      <Modal open={!!showDelete} onClose={() => setShowDelete(null)} title="Are you sure?" size="sm">
        <div className="space-y-4">
          <p className="text-slate-300 text-base">
            Do you really want to delete <span className="font-bold text-white">{showDelete?.name}</span>?
          </p>
          <div className="flex gap-3">
            <button
              disabled={deleteMutation.isPending}
              onClick={() => { deleteMutation.mutate(showDelete._id); setShowDelete(null); }}
              className="btn-primary flex-1 justify-center bg-rose-500 hover:bg-rose-600 border-rose-500 text-white disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </button>
            <button onClick={() => setShowDelete(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
