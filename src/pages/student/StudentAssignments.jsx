import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Modal, Field } from '../../components/ui'
import { FileText, Download, Upload, Calendar, Clock, CheckCircle, AlertCircle, MessageSquare, Brain } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function StudentAssignments() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [fileForm, setFileForm] = useState({ fileName: '', fileUrl: '' })
  const [isUploading, setIsUploading] = useState(false)
  const classId = user?.classId?._id || user?.classId

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['assignments', 'class', classId],
    queryFn: () => assignmentsAPI.getByClass(classId),
    enabled: !!classId,
  })

  const { data: mySubmissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ['submissions', 'student'],
    queryFn: () => assignmentsAPI.getStudentSubmissions(),
  })

  const submitMutation = useMutation({
    mutationFn: (data) => assignmentsAPI.submit(data),
    onSuccess: () => {
      toast.success('Assignment submitted successfully!')
      qc.invalidateQueries({ queryKey: ['submissions', 'student'] })
      setSelectedAssignment(null)
      setFileForm({ fileName: '', fileUrl: '' })
    },
  })

  const getSubmissionStatus = (assignmentId) => {
    return mySubmissions?.find(s => s.assignmentId?._id === assignmentId || s.assignmentId === assignmentId)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    const toastId = toast.loading('Uploading PDF...')
    try {
      const res = await assignmentsAPI.upload(file)
      const data = res.data || res
      setFileForm({
        fileName: data.fileName,
        fileUrl: data.url
      })
      toast.success('File uploaded successfully!', { id: toastId })
    } catch (err) {
      toast.error('Failed to upload file. Please try again.', { id: toastId })
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const isLoading = loadingAssignments || loadingSubmissions

  return (
    <div className="space-y-5">
      <SectionHeader title="Assignments" subtitle="Download and complete your class assignments" />

      {isLoading ? <LoadingState /> : !assignments?.length ? (
        <EmptyState icon={FileText} title="No assignments" description="No assignments have been posted for your class yet" />
      ) : (
        <div className="grid gap-4">
          {assignments.map(a => {
            const submission = getSubmissionStatus(a._id)
            const isOverdue = new Date(a.dueDate) < new Date() && !submission

            return (
              <div key={a._id} className="card p-5 group transition-all hover:bg-white/[0.02]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors",
                      submission?.status === 'COMPLETED' ? "bg-jade-500/10 border-jade-500/20 text-jade-400" :
                      isOverdue ? "bg-rose-500/10 border-rose-500/20 text-rose-400" :
                      submission ? "bg-azure-500/10 border-azure-500/20 text-azure-400" :
                      "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                    )}>
                      {submission?.status === 'COMPLETED' ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-lg">{a.title}</h4>
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{a.subjectId?.name}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <span className={clsx(
                          "text-xs flex items-center gap-1",
                          isOverdue ? "text-rose-400 font-bold" : "text-slate-500"
                        )}>
                          <Calendar className="w-3 h-3" /> Due: {format(new Date(a.dueDate), 'MMM d, yyyy')}
                        </span>
                        {submission && (
                          <span className={clsx(
                            "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-bold",
                            submission.status === 'COMPLETED' ? "bg-jade-500/10 text-jade-400 border-jade-500/20" :
                            submission.status === 'NEEDS_WORK' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                            "bg-azure-500/10 text-azure-400 border-azure-500/20"
                          )}>
                            {submission.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a href={assignmentsAPI.getDownloadUrl(a.fileName)} target="_blank" rel="noopener noreferrer" 
                       className="btn-secondary py-2 px-4 text-xs flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </a>
                    
                    {(!submission || submission.status === 'NEEDS_WORK') ? (
                      <button 
                        onClick={() => setSelectedAssignment(a)}
                        className="btn-primary py-2 px-4 text-xs flex items-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" /> {submission ? 'Re-submit' : 'Submit Work'}
                      </button>
                    ) : (
                      <div className="text-xs text-slate-500 italic px-4">
                        Submitted on {format(new Date(submission.submittedAt), 'MMM d')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Teacher Feedback section if available */}
                {(submission?.remarks || submission?.aiFeedback) && (
                  <div className="mt-5 space-y-2 border-t border-white/5 pt-4">
                    {submission.remarks && (
                      <div className="flex gap-3">
                        <MessageSquare className="w-4 h-4 text-slate-600 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase">Teacher Feedback</p>
                          <p className="text-sm text-slate-400 italic">"{submission.remarks}"</p>
                        </div>
                      </div>
                    )}
                    {submission.aiFeedback && (
                      <div className="flex gap-3">
                        <div className="w-4 h-4 text-indigo-500 mt-0.5"><Stars w={14} h={14} /></div>
                        <div>
                          <p className="text-[10px] text-indigo-500/70 font-bold uppercase flex items-center gap-1">
                            <Brain className="w-3 h-3" /> AI Insight
                          </p>
                          <p className="text-sm text-indigo-300/60 italic leading-relaxed">"{submission.aiFeedback}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Submit Assignment Modal */}
      <Modal 
        open={!!selectedAssignment} 
        onClose={() => setSelectedAssignment(null)} 
        title={`Submit: ${selectedAssignment?.title}`}
        size="md"
      >
        <div className="space-y-6">
          <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
            <h5 className="text-indigo-400 text-sm font-semibold flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" /> Submission Instructions
            </h5>
            <p className="text-xs text-indigo-300/80 leading-relaxed">
              Please upload your completed assignment as a PDF. Ensure all questions are answered clearly. 
              After submission, our AI assistant and your teacher will review your work.
            </p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            if (!fileForm.fileUrl) {
              toast.error('Please upload a file first')
              return
            }
            submitMutation.mutate({ 
              assignmentId: selectedAssignment._id,
              ...fileForm
            })
          }} className="space-y-4">
            <Field label="Upload Your PDF File">
              <div className="relative group">
                <input 
                  type="file" 
                  className="hidden" 
                  id="submission-file"
                  accept=".pdf"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                />
                <label 
                  htmlFor="submission-file" 
                  className={clsx(
                    "input flex flex-col items-center justify-center border-dashed py-10 cursor-pointer transition-all",
                    isUploading ? "opacity-50 cursor-wait" : "group-hover:bg-white/[0.02] group-hover:border-azure-500/50"
                  )}
                >
                  <Upload className={clsx("w-8 h-8 text-slate-600 mb-2 transition-colors", !isUploading && "group-hover:text-azure-400", isUploading && "animate-bounce")} />
                  <span className="text-sm text-slate-500 group-hover:text-slate-300">
                    {isUploading ? 'Uploading...' : (fileForm.fileName || 'Click to select or drag & drop...')}
                  </span>
                  <span className="text-[10px] text-slate-600 mt-1">Maximum file size: 10MB (PDF only)</span>
                </label>
              </div>
            </Field>

            <div className="flex gap-3">
              <button 
                type="submit" 
                disabled={submitMutation.isPending || isUploading}
                className="btn-primary flex-1 justify-center py-3"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Complete Submission'}
              </button>
              <button 
                type="button" 
                onClick={() => setSelectedAssignment(null)}
                className="btn-secondary px-6"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}

function Stars({ w, h }) {
  return (
    <svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" fill="currentColor" />
    </svg>
  )
}
