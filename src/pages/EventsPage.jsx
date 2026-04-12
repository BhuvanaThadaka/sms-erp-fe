import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsAPI, classesAPI } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Modal, Field, Badge, Pagination } from '../components/ui'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, MapPin, Clock, Users, BookOpen, Info, Trash2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const EVENT_ICONS = { EXAM: '📝', HOLIDAY: '🏖️', MEETING: '🤝', ACTIVITY: '🎭', SPECIAL: '⭐' }
const TYPE_CONFIG = {
  EXAM: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', accent: 'text-rose-400', icon: BookOpen },
  HOLIDAY: { bg: 'bg-jade-500/10', border: 'border-jade-500/20', accent: 'text-jade-400', icon: CalendarIcon },
  MEETING: { bg: 'bg-azure-500/10', border: 'border-azure-500/20', accent: 'text-azure-400', icon: Users },
  ACTIVITY: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', accent: 'text-amber-400', icon: Info },
  SPECIAL: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', accent: 'text-amber-400', icon: Info }
}

export default function EventsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const isAdmin = user?.role === 'ADMIN'
  const isTeacher = user?.role === 'TEACHER'
  const canCreate = isAdmin || isTeacher

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showCreate, setShowCreate] = useState(false)
  const [showDelete, setShowDelete] = useState(null)
  const [showView, setShowView] = useState(null)
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
        <EmptyState icon={CalendarIcon} title="No events this month" description="No events scheduled for this period" />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {displayedEvents.map(event => {
              const config = TYPE_CONFIG[event.type] || { accent: 'text-slate-400' }
              return (
                <div 
                  key={event._id}
                  onClick={() => setShowView(event)}
                  className="bg-ink-800/80 border border-white/5 p-4 rounded-xl hover:border-azure-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx('w-2 h-2 rounded-full', config.accent)} />
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-azure-400 transition-colors">{event.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.startDate), 'MMM d, yyyy')}
                        </div>
                        {event.venue && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.venue}
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    {canCreate && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowDelete(event) }}
                        className="p-1 px-1.5 text-[10px] text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
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

      <Modal open={!!showView} onClose={() => setShowView(null)} title="Event Details" size="md">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-12 h-12 rounded-xl flex items-center justify-center border',
              TYPE_CONFIG[showView?.type]?.bg || 'bg-slate-500/10',
              TYPE_CONFIG[showView?.type]?.border || 'border-slate-500/20'
            )}>
              {(() => {
                const Icon = TYPE_CONFIG[showView?.type]?.icon || Info
                return <Icon className={clsx('w-6 h-6', TYPE_CONFIG[showView?.type]?.accent || 'text-slate-400')} />
              })()}
            </div>
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">{showView?.type}</p>
              <h2 className="text-xl font-bold text-white">{showView?.title}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-slate-500 uppercase">Commencement</p>
              <div className="flex items-center gap-2 text-slate-200">
                <Clock className="w-4 h-4 text-azure-400" />
                <span className="text-sm font-medium">{showView?.startDate && format(new Date(showView.startDate), 'MMM d, yyyy')}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-slate-500 uppercase">Conclusion</p>
              <div className="flex items-center gap-2 text-slate-200">
                <Clock className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-medium">{showView?.endDate && format(new Date(showView.endDate), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          {showView?.venue && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-slate-500 uppercase">Venue</p>
              <div className="flex items-center gap-2 text-slate-200">
                <MapPin className="w-4 h-4 text-jade-400" />
                <span className="text-sm font-medium">{showView.venue}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] font-medium text-slate-500 uppercase">Description</p>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{showView?.description || 'No description provided.'}</p>
            </div>
          </div>

          {!showView?.isAllClasses && (
            <div className="space-y-2">
              <p className="text-[10px] font-medium text-slate-500 uppercase">Target Classes</p>
              <div className="flex flex-wrap gap-2 text-white">
                {showView?.applicableClasses?.map(c => {
                  const classId = typeof c === 'string' ? c : c._id;
                  const classData = typeof c === 'object' && c.grade ? c : 
                                   (Array.isArray(classes) ? classes : classes?.classes || []).find(cl => cl._id === classId);
                  
                  return (
                    <span key={classId} className="text-[10px] bg-ink-700 text-slate-300 border border-white/10 px-2 py-1 rounded-full flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-azure-400" />
                      {classData ? `${classData.grade} ${classData.section} ${classData.name ? `- ${classData.name}` : ''}` : `Class ID: ${classId}`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button onClick={() => setShowView(null)} className="btn-secondary flex-1 justify-center">Close</button>
            {canCreate && (
              <button 
                onClick={() => {
                  setShowDelete(showView);
                  setShowView(null);
                }}
                className="btn-primary bg-rose-500 hover:bg-rose-600 border-rose-500 text-white"
              >
                Delete Event
              </button>
            )}
          </div>
        </div>
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
