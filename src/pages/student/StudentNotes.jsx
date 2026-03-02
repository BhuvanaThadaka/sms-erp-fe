import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { notesAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState } from '../../components/ui'
import { FileText, Download, Search } from 'lucide-react'
import { format } from 'date-fns'

export default function StudentNotes() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const classId = user?.classId?._id || user?.classId

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', classId],
    queryFn: () => notesAPI.getByClass(classId),
    enabled: !!classId,
  })

  const filtered = notes?.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.subject?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-5">
      <SectionHeader title="Class Notes" subtitle="Download study materials uploaded by your teachers" />

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {!classId ? (
        <EmptyState icon={FileText} title="No class assigned" description="You haven't been assigned to a class yet" />
      ) : isLoading ? <LoadingState /> : !filtered.length ? (
        <EmptyState icon={FileText} title="No notes found" description="No study materials have been uploaded yet" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(note => (
            <div key={note._id} className="card card-hover p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-azure-500/10 border border-azure-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-azure-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm line-clamp-2">{note.title}</p>
                  <span className="text-xs bg-jade-500/10 text-jade-400 border border-jade-500/20 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                    {note.subject}
                  </span>
                </div>
              </div>
              {note.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{note.description}</p>}
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">{note.uploadedBy?.firstName} {note.uploadedBy?.lastName}</p>
                <p className="text-xs text-slate-600">{format(new Date(note.createdAt), 'MMM d')}</p>
              </div>
              <a href={note.fileUrl} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 btn-secondary text-xs py-1.5 w-full justify-center"
              >
                <Download className="w-3 h-3" /> {note.fileName}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
