import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionsAPI, classesAPI, notesAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, Table } from '../../components/ui'
import { BookMarked, Plus, Upload, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function TeacherSessions() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showNote, setShowNote] = useState(null)
  const currentYear = '2024-2025'

  const [form, setForm] = useState({
    classId: '', topic: '', description: '', sessionDate: format(new Date(), 'yyyy-MM-dd'),
    duration: 60, academicYear: currentYear, materials: [], learningObjectives: []
  })
  const [noteForm, setNoteForm] = useState({ title: '', fileUrl: '', fileName: '', subject: '' })
  const [objInput, setObjInput] = useState('')

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => sessionsAPI.getAll({ academicYear: currentYear }),
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: currentYear }),
  })

  const createSession = useMutation({
    mutationFn: sessionsAPI.create,
    onSuccess: () => { toast.success('Session created!'); qc.invalidateQueries({ queryKey: ['sessions'] }); setShowCreate(false); resetForm() },
  })

  const uploadNote = useMutation({
    mutationFn: notesAPI.create,
    onSuccess: () => { toast.success('Note uploaded!'); setShowNote(null) },
  })

  const resetForm = () => setForm({ classId: '', topic: '', description: '', sessionDate: format(new Date(), 'yyyy-MM-dd'), duration: 60, academicYear: currentYear, materials: [], learningObjectives: [] })

  const addObjective = () => {
    if (!objInput.trim()) return
    setForm(p => ({ ...p, learningObjectives: [...p.learningObjectives, objInput.trim()] }))
    setObjInput('')
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Sessions"
        subtitle={`${sessions?.length || 0} sessions recorded`}
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Session
          </button>
        }
      />

      {isLoading ? <LoadingState /> : !sessions?.length ? (
        <EmptyState icon={BookMarked} title="No sessions yet" description="Record your first teaching session" action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Session</button>
        } />
      ) : (
        <div className="grid gap-4">
          {sessions.map(s => (
            <div key={s._id} className="card card-hover p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-azure-500/10 border border-azure-500/20 flex items-center justify-center flex-shrink-0">
                  <BookMarked className="w-5 h-5 text-azure-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-white font-semibold font-display">{s.topic}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{s.classId?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />{s.duration} min
                      </span>
                      <button
                        onClick={() => { setShowNote(s._id); setNoteForm({ title: '', fileUrl: '', fileName: '', subject: '', classId: s.classId?._id || s.classId }) }}
                        className="flex items-center gap-1.5 text-xs btn-secondary py-1.5"
                      >
                        <Upload className="w-3 h-3" /> Upload Note
                      </button>
                    </div>
                  </div>
                  {s.description && <p className="text-sm text-slate-400 mt-2 line-clamp-2">{s.description}</p>}
                  {s.learningObjectives?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {s.learningObjectives.map((o, i) => (
                        <span key={i} className="text-xs bg-ink-700 border border-white/5 text-slate-400 px-2 py-0.5 rounded-full">{o}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-600 mt-3">{format(new Date(s.sessionDate), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm() }} title="Create Session" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); createSession.mutate(form) }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class">
              <select className="input" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))} required>
                <option value="">Select class...</option>
                {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Session Date">
              <input type="date" className="input" value={form.sessionDate} onChange={e => setForm(p => ({ ...p, sessionDate: e.target.value }))} required />
            </Field>
          </div>
          <Field label="Topic">
            <input className="input" value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} required placeholder="e.g. Introduction to Algebra" />
          </Field>
          <Field label="Description">
            <textarea className="input min-h-[80px] resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What was covered..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (minutes)">
              <input type="number" className="input" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))} required />
            </Field>
          </div>
          <Field label="Learning Objectives">
            <div className="flex gap-2 mb-2">
              <input className="input" value={objInput} onChange={e => setObjInput(e.target.value)} placeholder="Add objective..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addObjective())} />
              <button type="button" onClick={addObjective} className="btn-secondary flex-shrink-0">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.learningObjectives.map((o, i) => (
                <span key={i} className="text-xs bg-ink-700 border border-white/5 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  {o}
                  <button type="button" onClick={() => setForm(p => ({ ...p, learningObjectives: p.learningObjectives.filter((_, j) => j !== i) }))} className="text-slate-500 hover:text-rose-400">×</button>
                </span>
              ))}
            </div>
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createSession.isPending} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {createSession.isPending ? 'Creating...' : 'Create Session'}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); resetForm() }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Upload Note Modal */}
      <Modal open={!!showNote} onClose={() => setShowNote(null)} title="Upload Note" size="sm">
        <form onSubmit={(e) => {
          e.preventDefault()
          uploadNote.mutate({ ...noteForm, classId: noteForm.classId, sessionId: showNote, academicYear: currentYear })
        }} className="space-y-4">
          <Field label="Title">
            <input className="input" value={noteForm.title} onChange={e => setNoteForm(p => ({ ...p, title: e.target.value }))} required />
          </Field>
          <Field label="Subject">
            <input className="input" value={noteForm.subject} onChange={e => setNoteForm(p => ({ ...p, subject: e.target.value }))} required />
          </Field>
          <Field label="File URL">
            <input className="input" value={noteForm.fileUrl} onChange={e => setNoteForm(p => ({ ...p, fileUrl: e.target.value }))} placeholder="https://drive.google.com/..." required />
          </Field>
          <Field label="File Name">
            <input className="input" value={noteForm.fileName} onChange={e => setNoteForm(p => ({ ...p, fileName: e.target.value }))} placeholder="notes.pdf" required />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={uploadNote.isPending} className="btn-primary flex-1 justify-center">
              {uploadNote.isPending ? 'Uploading...' : 'Upload'}
            </button>
            <button type="button" onClick={() => setShowNote(null)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
