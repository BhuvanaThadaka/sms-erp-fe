import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI, classesAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, Badge } from '../components/ui'
import { Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const EVENT_ICONS = { EXAM: '📝', HOLIDAY: '🏖️', MEETING: '🤝', ACTIVITY: '🎭', SPECIAL: '⭐' }

export default function EventsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const isAdmin = user?.role === 'ADMIN'
  const isTeacher = user?.role === 'TEACHER'
  const canCreate = isAdmin || isTeacher

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showCreate, setShowCreate] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', type: 'EXAM',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    isAllClasses: true, venue: '', academicYear: '2024-2025', applicableClasses: []
  })

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', startDate, endDate, typeFilter],
    queryFn: () => eventsAPI.getAll({ startDate, endDate, academicYear: '2024-2025' }),
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: '2024-2025' }),
    enabled: canCreate,
  })

  const createMutation = useMutation({
    mutationFn: eventsAPI.create,
    onSuccess: () => { toast.success('Event created!'); qc.invalidateQueries(['events']); setShowCreate(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: eventsAPI.delete,
    onSuccess: () => { toast.success('Event removed'); qc.invalidateQueries(['events']) },
  })

  const filtered = typeFilter ? events?.filter(e => e.type === typeFilter) : events

  const EVENT_TYPES = ['EXAM','HOLIDAY','MEETING','ACTIVITY','SPECIAL']
  const TYPE_COLORS = {
    EXAM: 'rose', HOLIDAY: 'jade', MEETING: 'azure', ACTIVITY: 'amber', SPECIAL: 'amber'
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <SectionHeader
          title="Academic Calendar"
          subtitle="Events, exams, holidays and activities"
        />
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        )}
      </div>

      {/* Month navigation */}
      <div className="card p-4 flex items-center justify-between">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="btn-secondary p-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="font-display font-bold text-white text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="btn-secondary p-2">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {['', ...EVENT_TYPES].map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              typeFilter === t
                ? 'bg-azure-600/20 text-azure-400 border-azure-500/30'
                : 'bg-ink-800 text-slate-400 border-white/10 hover:border-white/20'
            )}
          >
            {t ? `${EVENT_ICONS[t]} ${t}` : 'All Events'}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState /> : !filtered?.length ? (
        <EmptyState icon={Calendar} title="No events this month" description="No events scheduled for this period" />
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const color = TYPE_COLORS[event.type] || 'azure'
            return (
              <div key={event._id} className={`card card-hover p-5 border-l-2 border-l-${color}-500/50`}>
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0">{EVENT_ICONS[event.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-white font-semibold font-display">{event.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge status={event.type} />
                          {event.isAllClasses && (
                            <span className="text-xs text-slate-500 bg-ink-700 px-1.5 py-0.5 rounded">All Classes</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-white font-mono">
                          {format(new Date(event.startDate), 'MMM d')}
                          {event.startDate !== event.endDate && ` – ${format(new Date(event.endDate), 'MMM d')}`}
                        </p>
                        {event.venue && <p className="text-xs text-slate-500 mt-0.5">{event.venue}</p>}
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-sm text-slate-400 mt-2 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => { if (confirm('Remove this event?')) deleteMutation.mutate(event._id) }}
                      className="text-slate-600 hover:text-rose-400 transition-colors text-lg leading-none flex-shrink-0"
                    >×</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Event" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <Field label="Title">
            <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_ICONS[t]} {t}</option>)}
              </select>
            </Field>
            <Field label="Venue">
              <input className="input" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <input type="date" className="input" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required />
            </Field>
            <Field label="End Date">
              <input type="date" className="input" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required />
            </Field>
          </div>
          <Field label="Description">
            <textarea className="input min-h-[70px] resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </Field>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="allClasses" checked={form.isAllClasses} onChange={e => setForm(p => ({ ...p, isAllClasses: e.target.checked }))} className="w-4 h-4 rounded" />
            <label htmlFor="allClasses" className="text-sm text-slate-300">Apply to all classes</label>
          </div>
          {!form.isAllClasses && (
            <Field label="Applicable Classes">
              <select multiple className="input min-h-[80px]"
                onChange={e => setForm(p => ({ ...p, applicableClasses: Array.from(e.target.selectedOptions, o => o.value) }))}
              >
                {classes?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
              {createMutation.isPending ? 'Creating...' : 'Create Event'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
