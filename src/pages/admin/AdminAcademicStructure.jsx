import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { academicStructureAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, Table } from '../../components/ui'
import { Layout, Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminAcademicStructure() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', terms: [] })

  const { data: structures, isLoading } = useQuery({
    queryKey: ['academic-structures'],
    queryFn: () => academicStructureAPI.getAll(),
  })

  const mutation = useMutation({
    mutationFn: (data) => data._id ? academicStructureAPI.update(data._id, data) : academicStructureAPI.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Structure updated' : 'Structure created')
      qc.invalidateQueries({ queryKey: ['academic-structures'] })
      handleClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => academicStructureAPI.delete(id),
    onSuccess: () => {
      toast.success('Structure deleted')
      qc.invalidateQueries({ queryKey: ['academic-structures'] })
    },
  })

  const handleClose = () => {
    setShowCreate(false)
    setEditing(null)
    setForm({ name: '', description: '', terms: [] })
  }

  const handleEdit = (s) => {
    setEditing(s)
    setForm({ ...s })
    setShowCreate(true)
  }

  const addTerm = () => {
    setForm(prev => ({
      ...prev,
      terms: [...prev.terms, { name: `Term ${prev.terms.length + 1}`, exams: [] }]
    }))
  }

  const removeTerm = (idx) => {
    setForm(prev => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== idx)
    }))
  }

  const addExam = (termIdx) => {
    const newTerms = [...form.terms]
    newTerms[termIdx].exams.push({ name: '', code: '', maxMarks: 100, weightage: 0 })
    setForm({ ...form, terms: newTerms })
  }

  const removeExam = (termIdx, examIdx) => {
    const newTerms = [...form.terms]
    newTerms[termIdx].exams = newTerms[termIdx].exams.filter((_, i) => i !== examIdx)
    setForm({ ...form, terms: newTerms })
  }

  const updateTermName = (idx, name) => {
    const newTerms = [...form.terms]
    newTerms[idx].name = name
    setForm({ ...form, terms: newTerms })
  }

  const updateExam = (termIdx, examIdx, field, value) => {
    const newTerms = [...form.terms]
    newTerms[termIdx].exams[examIdx][field] = field === 'maxMarks' || field === 'weightage' ? Number(value) : value
    setForm({ ...form, terms: newTerms })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Name is required')
    if (!form.terms.length) return toast.error('Add at least one term')
    mutation.mutate(form)
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Academic Structures"
        subtitle="Define terms and examination patterns for your school"
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Structure
          </button>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? <LoadingState /> : (
          <Table
            headers={['Structure Name', 'Details', 'Terms', 'Status', 'Actions']}
            empty={!structures?.length ? <EmptyState icon={Layout} title="No structures yet" /> : null}
          >
            {structures?.map((s) => (
              <tr key={s._id} className="table-row">
                <td className="table-td text-white font-medium">{s.name}</td>
                <td className="table-td text-slate-400 text-sm whitespace-pre-wrap">{s.description || '—'}</td>
                <td className="table-td">
                  <div className="flex flex-wrap gap-1">
                    {s.terms.map(t => (
                      <span key={t.name} className="bg-azure-500/10 text-azure-400 border border-azure-500/20 text-xs px-2 py-0.5 rounded">
                        {t.name} ({t.exams.length})
                      </span>
                    ))}
                  </div>
                </td>
                <td className="table-td">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full border', s.isActive ? 'bg-jade-500/10 text-jade-400 border-jade-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20')}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(s)} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(s._id)} className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <Modal open={showCreate} onClose={handleClose} title={editing ? 'Edit Structure' : 'Create Academic Structure'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Structure Name" required>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Primary School Standard" />
            </Field>
            <Field label="Description">
              <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </Field>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Terms & Exams</h3>
              <button type="button" onClick={addTerm} className="text-xs text-azure-400 hover:text-azure-300 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Term
              </button>
            </div>

            <div className="space-y-6">
              {form.terms.map((term, tIdx) => (
                <div key={tIdx} className="bg-white/2 rounded-xl border border-white/5 p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <input
                      className="bg-transparent border-b border-white/10 focus:border-azure-500 text-white font-medium outline-none py-1 flex-1"
                      value={term.name}
                      onChange={e => updateTermName(tIdx, e.target.value)}
                      placeholder="Term Name"
                    />
                    <button type="button" onClick={() => removeTerm(tIdx)} className="text-slate-500 hover:text-rose-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {term.exams.map((exam, eIdx) => (
                      <div key={eIdx} className="grid grid-cols-12 gap-2 items-center bg-ink-900/50 p-2 rounded-lg border border-white/5">
                        <div className="col-span-4">
                          <input className="text-xs bg-transparent border-none outline-none text-white w-full" value={exam.name} onChange={e => updateExam(tIdx, eIdx, 'name', e.target.value)} placeholder="Exam Name (e.g. Test 1)" />
                        </div>
                        <div className="col-span-2">
                          <input className="text-xs bg-transparent border-none outline-none text-azure-400 font-mono w-full" value={exam.code} onChange={e => updateExam(tIdx, eIdx, 'code', e.target.value)} placeholder="Code (T1)" />
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">Max:</span>
                          <input type="number" className="text-xs bg-transparent border-none outline-none text-white w-full" value={exam.maxMarks} onChange={e => updateExam(tIdx, eIdx, 'maxMarks', e.target.value)} />
                        </div>
                        <div className="col-span-2 flex items-center gap-1">
                          <span className="text-[10px] text-slate-500">Wt:</span>
                          <input type="number" className="text-xs bg-transparent border-none outline-none text-white w-full" value={exam.weightage} onChange={e => updateExam(tIdx, eIdx, 'weightage', e.target.value)} />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button type="button" onClick={() => removeExam(tIdx, eIdx)} className="text-slate-600 hover:text-rose-400 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => addExam(tIdx)} className="py-2 border border-dashed border-white/10 rounded-lg text-xs text-slate-500 hover:text-white hover:border-white/20 transition-all">
                      + Add Exam to {term.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Saving...' : 'Save Structure'}
            </button>
            <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
