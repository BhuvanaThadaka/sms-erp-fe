import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI, classesAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, Badge, Pagination } from '../components/ui'
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
  const [showDelete, setShowDelete] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10
  const [form, setForm] = useState({
    title: '', description: '', type: 'EXAM',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    isAllClasses: true, venue: '', academicYear: '2026-2027', applicableClasses: []
  })
  const [eventErrors, setEventErrors] = useState({})

  const resetEventForm = () => {
    setForm({
      title: '', description: '', type: 'EXAM',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      isAllClasses: true, venue: '', academicYear: '2026-2027', applicableClasses: []
    })
    setEventErrors({})
  }

  const validateEvent = () => {
    const errs = {}
    if (!form.title?.trim()) errs.title = 'Event title is required.'
    if (!form.type) errs.type = 'Event type is required.'
    if (!form.startDate) errs.startDate = 'Start date is required.'
    if (!form.endDate) errs.endDate = 'End date is required.'
    setEventErrors(errs)
    return Object.keys(errs).length === 0
  }

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  const { data, isLoading } = useQuery({
    queryKey: ['events', startDate, endDate, typeFilter, page],
    queryFn: () => eventsAPI.getAll({ 
      startDate, 
      endDate, 
      type: typeFilter || undefined,
      classId: user?.role === 'STUDENT' ? (user?.classId?._id || user?.classId) : undefined,
      academicYear: '2026-2027',
      page,
      limit
    }),
    keepPreviousData: true
  })

  const rawEvents = data?.events || (Array.isArray(data) ? data : [])
  const total = data?.total || rawEvents.length
  const totalPages = data?.totalPages || Math.ceil(total / limit) || 1

  const filtered = (typeFilter ? rawEvents?.filter(e => e.type === typeFilter) : rawEvents) || []
  
  const displayedEvents = (data && !data.events && filtered.length > limit)
    ? filtered.slice((page - 1) * limit, page * limit)
    : filtered

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: '2026-2027' }),
    enabled: canCreate,
  })

  const createMutation = useMutation({
    mutationFn: eventsAPI.create,
    onSuccess: () => { toast.success('Event created!'); qc.invalidateQueries({ queryKey: ['events'] }); setShowCreate(false); resetEventForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: eventsAPI.delete,
    onSuccess: () => { toast.success('Event removed'); qc.invalidateQueries({ queryKey: ['events'] }) },
  })

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
        <button onClick={() => { setCurrentMonth(m => subMonths(m, 1)); setPage(1) }} className="btn-secondary p-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="font-display font-bold text-white text-lg">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={() => { setCurrentMonth(m => addMonths(m, 1)); setPage(1) }} className="btn-secondary p-2">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {['', ...EVENT_TYPES].map(t => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1) }}
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

      {isLoading ? <LoadingState /> : !displayedEvents?.length ? (
        <EmptyState icon={Calendar} title="No events this month" description="No events scheduled for this period" />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {displayedEvents.map(event => {
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
                        onClick={() => setShowDelete(event)}
                        className="text-slate-600 hover:text-rose-400 transition-colors text-lg leading-none flex-shrink-0"
                      >×</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination 
            page={page} 
            totalPages={totalPages} 
            total={total} 
            limit={limit} 
            onPageChange={setPage} 
          />
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetEventForm() }} title="Create Event" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); if (!validateEvent()) return; createMutation.mutate(form) }} className="space-y-4" noValidate>
          <Field label="Title" required error={eventErrors.title}>
            <input className={clsx('input', eventErrors.title && 'border-rose-500/50')} value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setEventErrors(p => ({...p, title: undefined})) }} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" required error={eventErrors.type}>
              <select className={clsx('input', eventErrors.type && 'border-rose-500/50')} value={form.type} onChange={e => { setForm(p => ({ ...p, type: e.target.value })); setEventErrors(p => ({...p, type: undefined})) }}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_ICONS[t]} {t}</option>)}
              </select>
            </Field>
            <Field label="Venue">
              <input className="input" value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date" required error={eventErrors.startDate}>
              <input type="date" className={clsx('input', eventErrors.startDate && 'border-rose-500/50')} value={form.startDate} onChange={e => { setForm(p => ({ ...p, startDate: e.target.value })); setEventErrors(p => ({...p, startDate: undefined})) }} />
            </Field>
            <Field label="End Date" required error={eventErrors.endDate}>
              <input type="date" className={clsx('input', eventErrors.endDate && 'border-rose-500/50')} value={form.endDate} onChange={e => { setForm(p => ({ ...p, endDate: e.target.value })); setEventErrors(p => ({...p, endDate: undefined})) }} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className="input min-h-[70px] resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </Field>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="allClasses" checked={form.isAllClasses} onChange={e => setForm(p => ({ ...p, isAllClasses: e.target.checked }))} className="w-4 h-4 rounded" />
            <label htmlFor="allClasses" className="text-sm text-slate-300">Apply to all classes</label>
          </div>
          
          <Field label="Applicable Classes">
            <select 
              multiple 
              className={clsx('input min-h-[80px]', form.isAllClasses && 'opacity-50 cursor-not-allowed')}
              disabled={form.isAllClasses}
              value={form.applicableClasses}
              onChange={e => setForm(p => ({ ...p, applicableClasses: Array.from(e.target.selectedOptions, o => o.value) }))}
            >
              {(Array.isArray(classes) ? classes : classes?.classes || []).map(c => (
                <option key={c._id} value={c._id}>
                  {c.grade} {c.section} {c.name ? `- ${c.name}` : ''}
                </option>
              ))}
            </select>
            {form.isAllClasses && <p className="text-[10px] text-slate-500 mt-1">This event will be visible to all students in all classes.</p>}
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
              {createMutation.isPending ? 'Creating...' : 'Create Event'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!showDelete} onClose={() => setShowDelete(null)} title="Are you sure?" size="sm">
        <div className="space-y-4">
          <p className="text-slate-300 text-base">
            Do you really want to remove the event <span className="font-bold text-white">{showDelete?.title}</span>?
          </p>
          <div className="flex gap-3">
            <button
              disabled={deleteMutation.isPending}
              onClick={() => { deleteMutation.mutate(showDelete._id); setShowDelete(null); }}
              className="btn-primary flex-1 justify-center bg-rose-500 hover:bg-rose-600 border-rose-500 text-white disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Removing...' : 'Remove'}
            </button>
            <button onClick={() => setShowDelete(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
