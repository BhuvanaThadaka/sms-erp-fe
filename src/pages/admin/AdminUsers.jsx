import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI } from '../../api'
import { SectionHeader, Badge, LoadingState, EmptyState, Modal, Field, Table, Pagination } from '../../components/ui'
import { Users, Plus, Search, UserCheck, UserX, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLES = ['ADMIN', 'TEACHER', 'STUDENT']

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'STUDENT', phone: '', enrollmentNumber: '', employeeId: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter, page, search],
    queryFn: () => usersAPI.getAll({ 
      role: roleFilter || undefined,
      page,
      limit,
      search: search || undefined
    }),
    keepPreviousData: true
  })

  const rawUsers = data?.users || (Array.isArray(data) ? data : [])
  const total = data?.total || rawUsers.length
  const totalPages = data?.totalPages || Math.ceil(total / limit) || 1

  // Client-side fallback: if the server returns all records, frontend will slice
  // We also keep the client-side search/filter for robustness if the API search isn't perfect
  const filtered = rawUsers.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()) &&
    (!roleFilter || u.role === roleFilter)
  )

  const displayedUsers = (data && !data.users && filtered.length > limit)
    ? filtered.slice((page - 1) * limit, page * limit)
    : filtered

  const createMutation = useMutation({
    mutationFn: usersAPI.create,
    onSuccess: () => { toast.success('User created'); qc.invalidateQueries({ queryKey: ['users'] }); setShowCreate(false); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries({ queryKey: ['users'] }); setEditUser(null) },
  })

  const activateMutation = useMutation({
    mutationFn: (id) => usersAPI.update(id, { isActive: true }),
    onSuccess: () => { toast.success('User activated'); qc.invalidateQueries({ queryKey: ['users'] }) },
  })

  const deactivateMutation = useMutation({
    mutationFn: usersAPI.deactivate,
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries({ queryKey: ['users'] }) },
  })

  const resetForm = () => setForm({ firstName: '', lastName: '', email: '', password: '', role: 'STUDENT', phone: '', enrollmentNumber: '', employeeId: '' })

  const handleCreate = (e) => {
    e.preventDefault()
    const payload = { ...form }
    // Remove fields strictly forbidden by backend DTO
    delete payload.isActive
    
    if (form.role === 'TEACHER') {
      delete payload.enrollmentNumber
      if (!payload.employeeId) return toast.error('Employee ID is required for teachers')
    } else if (form.role === 'STUDENT') {
      delete payload.employeeId
      if (!payload.enrollmentNumber) return toast.error('Enrollment Number is required for students')
    }
    createMutation.mutate(payload)
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="User Management"
        subtitle={`${total || 0} total users in the system`}
        action={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Add User
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex gap-2">
          {['', ...ROLES].map(r => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1) }}
              className={clsx(
                'px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                roleFilter === r
                  ? 'bg-azure-600/20 text-azure-400 border-azure-500/30'
                  : 'bg-ink-700 text-slate-400 border-white/10 hover:border-white/20'
              )}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <LoadingState /> : (
          <>
            <Table
              headers={['User', 'Role', 'Contact', 'ID', 'Status', 'Actions']}
              empty={displayedUsers.length === 0 ? (
                <EmptyState icon={Users} title="No users found" description="Try adjusting your filters" />
              ) : null}
            >
              {displayedUsers.map(u => (
                <tr key={u._id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-ink-700 border border-white/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-slate-300">{u.firstName[0]}{u.lastName[0]}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{u.firstName} {u.lastName}</p>
                        <p className="text-slate-500 text-xs">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td"><Badge status={u.role} /></td>
                  <td className="table-td text-slate-400">{u.phone || '—'}</td>
                  <td className="table-td">
                    <span className="font-mono text-xs text-slate-500">
                      {u.enrollmentNumber || u.employeeId || '—'}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full border', u.isActive
                      ? 'bg-jade-500/10 text-jade-400 border-jade-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    )}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditUser(u)}
                        className="p-1.5 text-slate-400 hover:text-azure-400 hover:bg-azure-500/10 rounded-lg transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {u.isActive ? (
                        <button
                          onClick={() => { if (confirm(`Deactivate ${u.firstName}?`)) deactivateMutation.mutate(u._id) }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => { if (confirm(`Activate ${u.firstName}?`)) activateMutation.mutate(u._id) }}
                          className="p-1.5 text-slate-400 hover:text-jade-400 hover:bg-jade-500/10 rounded-lg transition-all"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm() }} title="Create New User" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name">
              <input className="input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
            </Field>
            <Field label="Last Name">
              <input className="input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
            </Field>
          </div>
          <Field label="Email">
            <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </Field>
          <Field label="Password">
            <input type="password" className="input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} />
          </Field>
          <Field label="Role">
            <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label={form.role === 'STUDENT' ? 'Enrollment No.' : 'Employee ID'}>
              <input className="input"
                value={form.role === 'STUDENT' ? form.enrollmentNumber : form.employeeId}
                onChange={e => setForm(p => ({ ...p, [form.role === 'STUDENT' ? 'enrollmentNumber' : 'employeeId']: e.target.value }))}
              />
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); resetForm() }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="md">
        {editUser && (
          <form onSubmit={(e) => {
            e.preventDefault()
            const payload = {
              firstName: editUser.firstName,
              lastName: editUser.lastName,
              phone: editUser.phone,
              address: editUser.address,
            }
            if (editUser.dateOfBirth) payload.dateOfBirth = editUser.dateOfBirth
            updateMutation.mutate({ id: editUser._id, data: payload })
          }} className="space-y-5">
            {/* Identity Info (Read-only) */}
            <div className="p-3 bg-slate-800/50 rounded-lg border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Account Identity (Read-only)</span>
                <Badge status={editUser.role} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Email</p>
                  <p className="text-white truncate">{editUser.email}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">ID</p>
                  <p className="font-mono text-white">{editUser.enrollmentNumber || editUser.employeeId || '—'}</p>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name">
                  <input className="input" value={editUser.firstName} onChange={e => setEditUser(p => ({ ...p, firstName: e.target.value }))} required />
                </Field>
                <Field label="Last Name">
                  <input className="input" value={editUser.lastName} onChange={e => setEditUser(p => ({ ...p, lastName: e.target.value }))} required />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <input className="input" value={editUser.phone || ''} onChange={e => setEditUser(p => ({ ...p, phone: e.target.value }))} />
                </Field>
                <Field label="Date of Birth">
                  <input type="date" className="input" value={editUser.dateOfBirth ? new Date(editUser.dateOfBirth).toISOString().split('T')[0] : ''} onChange={e => setEditUser(p => ({ ...p, dateOfBirth: e.target.value }))} />
                </Field>
              </div>

              <Field label="Address">
                <textarea className="input min-h-[80px]" value={editUser.address || ''} onChange={e => setEditUser(p => ({ ...p, address: e.target.value }))} />
              </Field>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1 justify-center">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                disabled={deactivateMutation.isPending}
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${editUser.firstName}?`)) {
                    deactivateMutation.mutate(editUser._id, {
                      onSuccess: () => setEditUser(null)
                    })
                  }
                }} 
                className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
              >
                Delete
              </button>
              <button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
