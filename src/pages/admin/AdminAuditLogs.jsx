import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Table } from '../../components/ui'
import { Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

const ACTION_COLORS = {
  ATTENDANCE_MARKED: 'text-jade-400 bg-jade-500/10 border-jade-500/20',
  ATTENDANCE_UPDATED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  SESSION_CREATED: 'text-azure-400 bg-azure-500/10 border-azure-500/20',
  REPORT_GENERATED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  USER_CREATED: 'text-jade-400 bg-jade-500/10 border-jade-500/20',
  CLASS_CREATED: 'text-azure-400 bg-azure-500/10 border-azure-500/20',
  PROFILE_UPDATED: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  NOTE_UPLOADED: 'text-azure-400 bg-azure-500/10 border-azure-500/20',
  SCHEDULE_CREATED: 'text-jade-400 bg-jade-500/10 border-jade-500/20',
  EVENT_CREATED: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
}

export default function AdminAuditLogs() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, page],
    queryFn: () => auditAPI.getAll({ 
      action: actionFilter,
      page,
      limit,
      search: search || undefined
    }),
    refetchInterval: 30000,
    keepPreviousData: true
  })

  const logs = data?.logs || data || []
  const total = data?.total || logs.length
  const totalPages = data?.totalPages || Math.ceil(total / limit) || 1

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Audit Logs"
        subtitle="Track all critical system actions in real time"
      />

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            className="input pl-9" 
            placeholder="Search actions..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setPage(1) }} 
          />
        </div>
        <select 
          className="input max-w-xs" 
          value={actionFilter} 
          onChange={e => { setActionFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Actions</option>
          {Object.keys(ACTION_COLORS).map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <LoadingState /> : (
          <>
            <Table
              headers={['Action', 'Entity', 'Performed By', 'Details', 'Timestamp']}
              empty={!logs.length ? <EmptyState icon={Shield} title="No logs found" /> : null}
            >
              {logs.map(log => (
                <tr key={log._id} className="table-row">
                  <td className="table-td">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full border', ACTION_COLORS[log.action] || 'text-slate-400 bg-ink-700 border-white/10')}>
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="table-td">
                    <p className="text-white text-sm">{log.entityType}</p>
                    <p className="text-slate-500 text-xs font-mono">{log.entityId?.slice(-8)}</p>
                  </td>
                  <td className="table-td">
                    <p className="text-slate-300 text-xs font-mono">{log.performedBy?.slice(-8)}</p>
                  </td>
                  <td className="table-td">
                    <p className="text-slate-500 text-xs max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details).slice(0, 60) + '...' : '—'}
                    </p>
                  </td>
                  <td className="table-td">
                    <p className="text-slate-300 text-xs">{format(new Date(log.timestamp), 'MMM d, HH:mm')}</p>
                  </td>
                </tr>
              ))}
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                <p className="text-xs text-slate-500">
                  Showing <span className="text-slate-300">{(page - 1) * limit + 1}</span> to <span className="text-slate-300">{Math.min(page * limit, total)}</span> of <span className="text-slate-300">{total}</span> logs
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
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
                          onClick={() => setPage(pageNum)}
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
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
