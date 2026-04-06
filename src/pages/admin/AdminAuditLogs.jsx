import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState, Table, Pagination } from '../../components/ui'
import { Shield, Search } from 'lucide-react'
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
    queryKey: ['audit-logs', actionFilter, page, search],
    queryFn: () => auditAPI.getAll({ 
      action: actionFilter,
      page,
      limit,
      search: search || undefined
    }),
    refetchInterval: 30000,
    keepPreviousData: true
  })

  let rawLogs = data?.logs || (Array.isArray(data) ? data : [])
  
  if (search) {
    const s = search.toLowerCase()
    rawLogs = rawLogs.filter(log => {
      const actionMatch = log.action?.replace(/_/g, ' ').toLowerCase().includes(s)
      const entityMatch = log.entityType?.toLowerCase().includes(s) || log.entityId?.toLowerCase().includes(s)
      const userMatch = log.performedBy && (
        log.performedBy.role?.toLowerCase().includes(s) ||
        log.performedBy.firstName?.toLowerCase().includes(s) ||
        log.performedBy.lastName?.toLowerCase().includes(s)
      )
      const timestampMatch = log.timestamp && format(new Date(log.timestamp), 'MMM d, HH:mm').toLowerCase().includes(s)
      
      return actionMatch || entityMatch || userMatch || timestampMatch
    })
  }

  const total = rawLogs.length
  const totalPages = Math.ceil(total / limit) || 1
  
  // Client-side fallback: if the server returns all records (data.logs is missing and length > limit),
  // we slice it locally to ensure the user only sees what belongs on the current page.
  // Actually, since we might have applied local search, we should always slice locally if we are using rawLogs
  const logs = rawLogs.slice((page - 1) * limit, page * limit)

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
              headers={['S.No', 'Action', 'Entity', 'Performed By', 'Timestamp']}
              empty={!logs.length ? <EmptyState icon={Shield} title="No logs found" /> : null}
            >
              {logs.map((log, idx) => (
                <tr key={log._id} className="table-row">
                  <td className="table-td text-xs text-slate-400">{(page - 1) * limit + idx + 1}</td>
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
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                      log.performedBy?.role === 'ADMIN' ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
                      log.performedBy?.role === 'TEACHER' ? "text-azure-400 bg-azure-500/10 border-azure-500/20" :
                      "text-jade-400 bg-jade-500/10 border-jade-500/20"
                    )}>
                      {log.performedBy?.role || 'SYSTEM'}
                    </span>
                    <p className="text-slate-500 text-[10px] mt-1">{log.performedBy?.firstName} {log.performedBy?.lastName}</p>
                  </td>
                  <td className="table-td">
                    <p className="text-slate-300 text-xs">{format(new Date(log.timestamp), 'MMM d, HH:mm')}</p>
                  </td>
                </tr>
              ))}
            </Table>

            <Pagination 
              page={page} 
              totalPages={totalPages} 
              total={total} 
              limit={limit} 
              onPageChange={setPage} 
            />
          </>
        )}
      </div>
    </div>
  )
}
