import React from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

// ─── Spinner ───────────────────────────────────────────
export function Spinner({ className }) {
  return <Loader2 className={clsx('animate-spin', className || 'w-5 h-5 text-azure-400')} />
}

// ─── Loading State ─────────────────────────────────────
export function LoadingState({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner className="w-8 h-8 text-azure-400" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-ink-700 border border-white/5 flex items-center justify-center mb-2">
          <Icon className="w-7 h-7 text-slate-500" />
        </div>
      )}
      <p className="font-display font-semibold text-white">{title}</p>
      {description && <p className="text-sm text-slate-500 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, sub, color = 'azure', trend }) {
  const colors = {
    azure: { icon: 'text-azure-400', bg: 'bg-azure-500/10 border-azure-500/20' },
    jade: { icon: 'text-jade-400', bg: 'bg-jade-500/10 border-jade-500/20' },
    amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    rose: { icon: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
  }
  const c = colors[color] || colors.azure

  return (
    <div className="stat-card card-hover">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0', c.bg)}>
        <Icon className={clsx('w-5 h-5', c.icon)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="font-display text-2xl font-bold text-white mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Badge ─────────────────────────────────────────────
export function Badge({ status }) {
  const map = {
    PRESENT: 'badge-present',
    ABSENT: 'badge-absent',
    LATE: 'badge-late',
    ADMIN: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-2 py-0.5 rounded-full',
    TEACHER: 'bg-azure-500/10 text-azure-400 border border-azure-500/20 text-xs px-2 py-0.5 rounded-full',
    STUDENT: 'bg-jade-500/10 text-jade-400 border border-jade-500/20 text-xs px-2 py-0.5 rounded-full',
    EXAM: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-2 py-0.5 rounded-full',
    HOLIDAY: 'bg-jade-500/10 text-jade-400 border border-jade-500/20 text-xs px-2 py-0.5 rounded-full',
    MEETING: 'bg-azure-500/10 text-azure-400 border border-azure-500/20 text-xs px-2 py-0.5 rounded-full',
    ACTIVITY: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2 py-0.5 rounded-full',
    SPECIAL: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2 py-0.5 rounded-full',
  }
  return <span className={map[status] || 'bg-ink-700 text-slate-400 text-xs px-2 py-0.5 rounded-full'}>{status}</span>
}

// ─── Modal ─────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative card w-full animate-slide-up overflow-hidden', sizes[size])}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="font-display font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Table ─────────────────────────────────────────────
export function Table({ headers, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {headers.map((h) => (
              <th key={h} className="table-th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
      {empty}
    </div>
  )
}

// ─── Section Header ────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Form Field ────────────────────────────────────────
export function Field({ label, error, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  )
}

// ─── Attendance Pie ────────────────────────────────────
export function AttendanceRing({ percentage, size = 80 }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, percentage || 0))
  const dash = (pct / 100) * circ
  const color = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#F43F5E'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-bold text-sm text-white">{pct}%</span>
      </div>
    </div>
  )
}
