import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Modal, Field } from '../../components/ui'
import { CheckCircle, XCircle, Brain, Download, User, Clock, MessageSquare, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function TeacherSubmissions() {
  const { id: assignmentId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [reviewForm, setReviewForm] = useState({ status: 'COMPLETED', remarks: '' })

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: () => assignmentsAPI.getSubmissions(assignmentId),
    enabled: !!assignmentId,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => assignmentsAPI.reviewSubmission(id, data),
    onSuccess: () => {
      toast.success('Review submitted!')
      qc.invalidateQueries({ queryKey: ['submissions', assignmentId] })
      setSelectedSubmission(null)
      setReviewForm({ status: 'COMPLETED', remarks: '' })
    },
  })

  const aiReviewMutation = useMutation({
    mutationFn: (id) => assignmentsAPI.runAIReview(id),
    onSuccess: (data) => {
      toast.success('AI Analysis Complete!')
      setReviewForm(p => ({ ...p, remarks: data.aiFeedback || p.remarks }))
      qc.invalidateQueries({ queryKey: ['submissions', assignmentId] })
    },
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-5">
      <SectionHeader 
        title="Submissions" 
        subtitle="Review student work and provide feedback"
        onBack={() => navigate('/teacher/assignments')}
      />

      {!submissions?.length ? (
        <EmptyState icon={User} title="No submissions yet" description="Students haven't uploaded their work for this assignment" />
      ) : (
        <div className="grid gap-4">
          {submissions.map(s => (
            <div key={s._id} className="card p-5 border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{s.studentId?.firstName} {s.studentId?.lastName}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(new Date(s.submittedAt), 'MMM d, h:mm a')}
                      </span>
                      <span className={clsx(
                        "text-[10px] px-2 py-0.5 rounded-full border",
                        s.status === 'SUBMITTED' ? "bg-azure-500/10 text-azure-400 border-azure-500/20" :
                        s.status === 'COMPLETED' ? "bg-jade-500/10 text-jade-400 border-jade-500/20" :
                        "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a href={assignmentsAPI.getDownloadUrl(s.fileName)} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> View Work
                  </a>
                  <button 
                    onClick={() => {
                      setSelectedSubmission(s)
                      setReviewForm({ 
                        status: s.status === 'SUBMITTED' ? 'COMPLETED' : s.status, 
                        remarks: s.remarks || '' 
                      })
                    }}
                    className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                  >
                    Review
                  </button>
                </div>
              </div>

              {s.remarks && (
                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-white/5">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" /> Teacher Remarks:
                  </p>
                  <p className="text-sm text-slate-300 mt-1">{s.remarks}</p>
                </div>
              )}

              {s.aiFeedback && (
                <div className="mt-2 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                  <p className="text-xs text-indigo-400 flex items-center gap-1.5 font-semibold">
                    <Brain className="w-3 h-3" /> AI Analysis:
                  </p>
                  <p className="text-sm text-indigo-300 italic mt-1">{s.aiFeedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal 
        open={!!selectedSubmission} 
        onClose={() => setSelectedSubmission(null)} 
        title={`Review: ${selectedSubmission?.studentId?.firstName}'s Work`}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Side: Submission Details */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-white/5">
              <p className="text-xs text-slate-500 mb-1">Uploaded PDF</p>
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-white truncate">{selectedSubmission?.fileName}</span>
                <a href={assignmentsAPI.getDownloadUrl(selectedSubmission?.fileName)} target="_blank" rel="noopener noreferrer" className="text-azure-400 hover:text-azure-300">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>

            <button 
              onClick={() => aiReviewMutation.mutate(selectedSubmission?._id)}
              disabled={aiReviewMutation.isPending}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50"
            >
              {aiReviewMutation.isPending ? (
                <>AI is analyzing...</>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Use AI To Analyze Work
                </>
              )}
            </button>
            
            {selectedSubmission?.aiFeedback && !aiReviewMutation.isPending && (
              <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/20">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">AI Suggestion</p>
                <p className="text-sm text-indigo-200 italic leading-relaxed">
                  "{selectedSubmission.aiFeedback}"
                </p>
                <button 
                  onClick={() => setReviewForm(p => ({ ...p, remarks: selectedSubmission.aiFeedback }))}
                  className="mt-3 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
                >
                  Apply AI feedback to remarks
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Review Form */}
          <form onSubmit={(e) => {
            e.preventDefault()
            reviewMutation.mutate({ id: selectedSubmission._id, data: reviewForm })
          }} className="space-y-4">
            <Field label="Assessment Status">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setReviewForm(p => ({ ...p, status: 'COMPLETED' }))}
                  className={clsx(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-xs font-semibold",
                    reviewForm.status === 'COMPLETED' ? "bg-jade-500/10 border-jade-500 text-jade-400" : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/10"
                  )}
                >
                  <CheckCircle className="w-5 h-5" /> Approved / Complete
                </button>
                <button 
                  type="button"
                  onClick={() => setReviewForm(p => ({ ...p, status: 'NEEDS_WORK' }))}
                  className={clsx(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-xs font-semibold",
                    reviewForm.status === 'NEEDS_WORK' ? "bg-rose-500/10 border-rose-500 text-rose-400" : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/10"
                  )}
                >
                  <XCircle className="w-5 h-5" /> Return / Needs Work
                </button>
              </div>
            </Field>

            <Field label="Final Remarks">
              <textarea 
                className="input min-h-[140px] resize-none text-sm" 
                value={reviewForm.remarks} 
                onChange={e => setReviewForm(p => ({ ...p, remarks: e.target.value }))}
                placeholder="Give feedback to the student..."
              />
            </Field>

            <button 
              type="submit" 
              disabled={reviewMutation.isPending}
              className="w-full btn-primary py-3 justify-center shadow-lg shadow-azure-500/10"
            >
              {reviewMutation.isPending ? 'Submitting Review...' : 'Submit Evaluation'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  )
}
