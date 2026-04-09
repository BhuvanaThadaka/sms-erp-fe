import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsAPI, subjectsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Modal, Field } from '../../components/ui'
import { FileText, Plus, Upload, Calendar, Users, Eye, Brain, Download } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

export default function TeacherAssignments() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const currentYear = '2024-2025'

  const [form, setForm] = useState({
    classId: '', title: '', description: '', subjectId: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'), fileUrl: '', fileName: '', academicYear: currentYear
  })
  const [errors, setErrors] = useState({})

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments', 'teacher'],
    queryFn: () => assignmentsAPI.getTeacherAssignments(),
  })

  const { data: mySubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: () => subjectsAPI.getMy({ academicYear: currentYear }),
  })

  const myClasses = React.useMemo(() => {
    if (!mySubjects) return []
    const classesMap = {}
    mySubjects.forEach(s => {
      const cls = s.classId
      if (cls && !classesMap[cls._id]) {
        classesMap[cls._id] = cls
      }
    })
    return Object.values(classesMap)
  }, [mySubjects])

  const availableSubjects = React.useMemo(() => {
    if (!form.classId || !mySubjects) return []
    return mySubjects.filter(s => (s.classId?._id || s.classId) === form.classId)
  }, [form.classId, mySubjects])

  const createAssignment = useMutation({
    mutationFn: assignmentsAPI.create,
    onSuccess: () => { 
      toast.success('Assignment created!'); 
      qc.invalidateQueries({ queryKey: ['assignments'] }); 
      setShowCreate(false); 
      resetForm() 
    },
  })

  const resetForm = () => {
    setForm({ classId: '', title: '', description: '', subjectId: '', dueDate: format(new Date(), 'yyyy-MM-dd'), fileUrl: '', fileName: '', academicYear: currentYear })
    setErrors({})
  }

  const validate = (data) => {
    const errs = {}
    if (!data.classId) errs.classId = 'Class is required.'
    if (!data.subjectId) errs.subjectId = 'Subject is required.'
    if (!data.title?.trim()) errs.title = 'Title is required.'
    if (!data.dueDate) errs.dueDate = 'Due date is required.'
    if (!data.fileName) errs.file = 'File is required.'
    return errs
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    const toastId = toast.loading('Uploading PDF...')
    try {
      const res = await assignmentsAPI.upload(file)
      // Check both nested data or direct response depending on axios interceptor
      const data = res.data || res
      setForm(p => ({ 
        ...p, 
        fileName: data.fileName, 
        fileUrl: data.url
      }))
      setErrors(p => ({ ...p, file: undefined }))
      toast.success('File uploaded successfully!', { id: toastId })
    } catch (err) {
      toast.error('Failed to upload file. Please try again.', { id: toastId })
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const isLoading = assignmentsLoading || subjectsLoading

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Assignments"
        subtitle={`${assignments?.length || 0} assignments managed`}
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Assignment
          </button>
        }
      />

      {isLoading ? <LoadingState /> : !assignments?.length ? (
        <EmptyState icon={FileText} title="No assignments yet" description="Start by creating your first class assignment" action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">Create Assignment</button>
        } />
      ) : (
        <div className="grid gap-4">
          {assignments.map(a => (
            <div key={a._id} className="card card-hover p-5 group transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-azure-500/10 border border-azure-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-azure-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{a.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {a.classId?.name}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" /> Due: {format(new Date(a.dueDate), 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-ink-700 text-azure-400 border border-azure-500/20">
                        {a.subjectId?.name || 'Loading Subject...'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={assignmentsAPI.getDownloadUrl(a.fileName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                  <button 
                    onClick={() => navigate(`/teacher/assignments/${a._id}/submissions`)}
                    className="btn-primary py-1.5 px-3 flex items-center gap-1.5 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Submissions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Assignment Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm() }} title="Create New Assignment" size="lg">
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          const errs = validate(form);
          if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
          }
          createAssignment.mutate(form) 
        }} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target Class" required error={errors.classId}>
              <select 
                className={clsx('input', errors.classId && 'border-rose-500/50')} 
                value={form.classId} 
                onChange={e => { 
                  setForm(p => ({ ...p, classId: e.target.value, subjectId: '' })); 
                  setErrors(p => ({ ...p, classId: undefined })) 
                }} 
                required
              >
                <option value="">Select class...</option>
                {myClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Subject" required error={errors.subjectId}>
              <select 
                className={clsx('input', errors.subjectId && 'border-rose-500/50')} 
                value={form.subjectId} 
                disabled={!form.classId}
                onChange={e => { 
                  setForm(p => ({ ...p, subjectId: e.target.value })); 
                  setErrors(p => ({ ...p, subjectId: undefined })) 
                }} 
                required
              >
                <option value="">{!form.classId ? 'Select class first' : 'Select subject...'}</option>
                {availableSubjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </Field>
          </div>
          
          <Field label="Assignment Title" required error={errors.title}>
            <input className={clsx('input', errors.title && 'border-rose-500/50')} value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: undefined })) }} required placeholder="e.g. Weekly Quiz 1: Algebra Fundamentals" />
          </Field>
          
          <Field label="Instructions & Description">
            <textarea className="input min-h-[100px] resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide details about the assignment..." />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Due Date" required error={errors.dueDate}>
              <input type="date" className={clsx('input', errors.dueDate && 'border-rose-500/50')} value={form.dueDate} onChange={e => { setForm(p => ({ ...p, dueDate: e.target.value })); setErrors(p => ({ ...p, dueDate: undefined })) }} required />
            </Field>
            <Field label="Assignment File (PDF)" required error={errors.file}>
              <div className="relative group">
                <input 
                  type="file" 
                  className="hidden" 
                  id="assignment-file"
                  accept=".pdf"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                />
                <label 
                  htmlFor="assignment-file" 
                  className={clsx(
                    'input flex items-center justify-between cursor-pointer group-hover:border-azure-500/50 transition-colors', 
                    errors.file && 'border-rose-500/50',
                    isUploading && 'opacity-50 cursor-wait'
                  )}
                >
                  <span className={clsx("truncate text-sm", !form.fileName && "text-slate-500")}>
                    {isUploading ? 'Uploading...' : (form.fileName || 'Upload assignment PDF...')}
                  </span>
                  <Upload className={clsx("w-4 h-4 text-slate-500 group-hover:text-azure-400", isUploading && "animate-bounce")} />
                </label>
              </div>
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={createAssignment.isPending || isUploading} 
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {createAssignment.isPending ? 'Creating...' : 'Create Assignment'}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); resetForm() }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
