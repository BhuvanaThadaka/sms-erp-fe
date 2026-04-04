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
    onSuccess: () => { toast.success('Schedule created!'); qc.invalidateQueries({ queryKey: ['schedule-my'] }); setShowCreate(false) },
  })

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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Schedule Slot" size="md">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          <Field label="Class">
            <select className="input" value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))} required>
              <option value="">Select class...</option>
              {(classes?.classes || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Subject">
            <input className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required />
          </Field>
          <Field label="Day">
            <select className="input" value={form.dayOfWeek} onChange={e => setForm(p => ({ ...p, dayOfWeek: e.target.value }))}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time"><input type="time" className="input" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} /></Field>
            <Field label="End Time"><input type="time" className="input" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} /></Field>
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
