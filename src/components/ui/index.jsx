import React from 'react'
import clsx from 'clsx'
import { Loader2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'

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
export function Field({ label, error, required, children }) {
  return (
    <div>
      {label && <label className="label">{label}{required && <span className="text-rose-500 ml-1">*</span>}</label>}
      {children}
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}
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
// ─── Pagination ────────────────────────────────────────
export function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (totalPages <= 1) return null
  
  return (
    <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
      <p className="text-xs text-slate-400">
        Showing <span className="text-slate-200">{(page - 1) * limit + 1}</span> to <span className="text-slate-200">{Math.min(page * limit, total)}</span> of <span className="text-slate-200">{total}</span> records
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1 mx-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = page
            if (totalPages > 5) {
              if (page <= 3) pageNum = i + 1
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
              else pageNum = page - 2 + i
            } else {
              pageNum = i + 1
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={clsx(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                  page === pageNum 
                    ? "bg-azure-600 text-white" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                {pageNum}
              </button>
            )
          })}
        </div>
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
// ─── Infinite Select ───────────────────────────────────
export function InfiniteSelect({ 
  value, 
  onChange, 
  options = [], 
  isLoading, 
  onFetchNextPage, 
  hasNextPage, 
  isFetchingNextPage,
  placeholder = "Select...",
  className
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef(null)
  const observerRef = React.useRef(null)
  const triggerRef = React.useRef(null)
  const scrollContainerRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  const handleObserver = React.useCallback((entries) => {
    const [target] = entries
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage && !isLoading) {
      onFetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, onFetchNextPage])

  React.useEffect(() => {
    if (!isOpen) return
    const option = { root: scrollContainerRef.current, rootMargin: '20px', threshold: 0 }
    observerRef.current = new IntersectionObserver(handleObserver, option)
    if (triggerRef.current) observerRef.current.observe(triggerRef.current)
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [handleObserver, isOpen])

  return (
    <div className={clsx("relative", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "input flex items-center justify-between cursor-pointer py-2",
          isOpen && "ring-2 ring-azure-500/20 border-azure-500/50"
        )}
      >
        <span className={clsx("truncate text-sm", !selectedOption && "text-slate-500")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronRight className={clsx("w-4 h-4 transition-transform", isOpen ? "rotate-90" : "rotate-0")} />
      </div>

      {isOpen && (
        <div ref={scrollContainerRef} className="absolute z-[100] mt-2 w-full max-h-60 overflow-y-auto bg-ink-800 border border-white/10 rounded-xl shadow-2xl p-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <div 
            className="p-2 text-xs font-medium text-azure-400 hover:bg-white/5 cursor-pointer rounded-lg border-b border-white/5 mb-1"
            onClick={() => { onChange(''); setIsOpen(false) }}
          >
            Clear Selection
          </div>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false) }}
              className={clsx(
                "p-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer rounded-lg transition-colors",
                value === opt.value && "bg-azure-500/10 text-azure-400"
              )}
            >
              {opt.label}
            </div>
          ))}
          
          {isLoading ? (
            <div className="p-4 flex justify-center"><Spinner /></div>
          ) : hasNextPage ? (
            <div ref={triggerRef} className="h-4 w-full flex justify-center py-4">
              <Spinner className="w-4 h-4 text-slate-600" />
            </div>
          ) : options.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">No items found</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
