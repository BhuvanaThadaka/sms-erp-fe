import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleAPI, classesAPI, usersAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SectionHeader, LoadingState, EmptyState, Modal, Field } from '../../components/ui'
import { Clock, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
const DAY_SHORT = { MONDAY:'Mon',TUESDAY:'Tue',WEDNESDAY:'Wed',THURSDAY:'Thu',FRIDAY:'Fri',SATURDAY:'Sat' }
const DAY_COLORS = ['azure','jade','amber','rose','azure','jade']

export default function TeacherSchedule() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const currentYear = '2024-2025'
  const [form, setForm] = useState({ classId: '', teacher: user?._id || '', subject: '', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', room: '', academicYear: currentYear })
  const [errors, setErrors] = useState({})

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['schedule-my'],
    queryFn: () => scheduleAPI.getMy({ academicYear: currentYear }),
  })

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => classesAPI.getAll({ academicYear: currentYear }),
  })

  const createMutation = useMutation({
    mutationFn: scheduleAPI.create,
    onSuccess: () => { 
      toast.success('Schedule created!')
      qc.invalidateQueries({ queryKey: ['schedule-my'] })
      setShowCreate(false)
      setErrors({})
      setForm({ classId: '', teacher: user?._id || '', subject: '', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', room: '', academicYear: currentYear })
    },
  })

  const validateSchedule = (data) => {
    const errs = {}
    if (!data.classId) errs.classId = 'Class is required.'
    if (!data.subject?.trim()) errs.subject = 'Subject is required.'
    if (!data.dayOfWeek) errs.dayOfWeek = 'Day is required.'
    if (!data.startTime) errs.startTime = 'Start time is required.'
    if (!data.endTime) errs.endTime = 'End time is required.'
    return errs
  }

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = schedule?.filter(s => s.dayOfWeek === d) || []
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <SectionHeader
        title="My Schedule"
        subtitle="Weekly class timetable"
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        }
      />

      {isLoading ? <LoadingState /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day, i) => (
            <div key={day} className="card p-4">
              <h3 className={`font-display font-semibold text-sm mb-3 text-${DAY_COLORS[i]}-400`}>{day}</h3>
              {byDay[day].length === 0 ? (
                <p className="text-xs text-slate-600">No classes</p>
              ) : (
                <div className="space-y-2">
                  {byDay[day].map(s => (
                    <div key={s._id} className={`px-3 py-2.5 rounded-lg bg-${DAY_COLORS[i]}-500/5 border border-${DAY_COLORS[i]}-500/10`}>
                      <p className={`text-sm font-medium text-${DAY_COLORS[i]}-300`}>{s.subject}</p>
                      <p className="text-xs text-slate-500">{s.classId?.name}</p>
                      <p className="text-xs text-slate-600 mt-1 font-mono">{s.startTime} – {s.endTime}</p>
                      {s.room && <p className="text-xs text-slate-600">{s.room}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setErrors({}) }} title="Add Schedule Slot" size="md">
        <form onSubmit={(e) => { 
          e.preventDefault()
          const errs = validateSchedule(form)
          if (Object.keys(errs).length > 0) {
            setErrors(errs)
            return
          }
          createMutation.mutate(form) 
        }} className="space-y-4" noValidate>
          <Field label="Class" required error={errors.classId}>
            <select className={clsx('input', errors.classId && 'border-rose-500/50')} value={form.classId} onChange={e => { setForm(p => ({ ...p, classId: e.target.value })); setErrors(p => ({ ...p, classId: undefined })) }} required>
              <option value="">Select class...</option>
              {(Array.isArray(classes) ? classes : classes?.classes || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Subject" required error={errors.subject}>
            <input className={clsx('input', errors.subject && 'border-rose-500/50')} value={form.subject} onChange={e => { setForm(p => ({ ...p, subject: e.target.value })); setErrors(p => ({ ...p, subject: undefined })) }} required />
          </Field>
          <Field label="Day" required error={errors.dayOfWeek}>
            <select className={clsx('input', errors.dayOfWeek && 'border-rose-500/50')} value={form.dayOfWeek} onChange={e => { setForm(p => ({ ...p, dayOfWeek: e.target.value })); setErrors(p => ({ ...p, dayOfWeek: undefined })) }}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time" required error={errors.startTime}>
              <input type="time" className={clsx('input', errors.startTime && 'border-rose-500/50')} value={form.startTime} onChange={e => { setForm(p => ({ ...p, startTime: e.target.value })); setErrors(p => ({ ...p, startTime: undefined })) }} />
            </Field>
            <Field label="End Time" required error={errors.endTime}>
              <input type="time" className={clsx('input', errors.endTime && 'border-rose-500/50')} value={form.endTime} onChange={e => { setForm(p => ({ ...p, endTime: e.target.value })); setErrors(p => ({ ...p, endTime: undefined })) }} />
            </Field>
          </div>
          <Field label="Room">
            <input className="input" value={form.room} onChange={e => setForm(p => ({ ...p, room: e.target.value }))} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center">
              {createMutation.isPending ? 'Saving...' : 'Save Slot'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
