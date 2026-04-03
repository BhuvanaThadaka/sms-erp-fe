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
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'STUDENT', phone: '' })
  const [errors, setErrors] = useState({})

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
    onSuccess: () => { toast.success('User created'); qc.invalidateQueries(['users']); setShowCreate(false); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries(['users']); setEditUser(null) },
  })

  const activateMutation = useMutation({
    mutationFn: (id) => usersAPI.update(id, { isActive: true }),
    onSuccess: () => { toast.success('User activated'); qc.invalidateQueries(['users']) },
  })

  const deactivateMutation = useMutation({
    mutationFn: usersAPI.deactivate,
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries(['users']) },
  })

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'STUDENT', phone: '' })
    setErrors({})
  }

  const validateCreate = () => {
    const errs = {}
    if (!form.firstName?.trim()) errs.firstName = 'First name is required.'
    else if (/\d/.test(form.firstName)) errs.firstName = 'First name should not contain numbers.'
    
    if (!form.lastName?.trim()) errs.lastName = 'Last name is required.'
    else if (/\d/.test(form.lastName)) errs.lastName = 'Last name should not contain numbers.'
    
    if (!form.email?.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email must be in a valid format.'
    
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < 8) errs.password = 'Password must be minimum 8 characters.'
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) 
      errs.password = 'Password requires uppercase, lowercase, number, and symbol.'
      
    if (!form.phone?.trim()) errs.phone = 'Phone number is required.'
    else if (!/^\d{10}$/.test(form.phone)) errs.phone = 'Phone number must be exactly 10 digits.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateEdit = () => {
    const errs = {}
    if (!editUser.firstName?.trim()) errs.firstName = 'First name is required.'
    else if (/\d/.test(editUser.firstName)) errs.firstName = 'First name should not contain numbers.'
    
    if (!editUser.lastName?.trim()) errs.lastName = 'Last name is required.'
    else if (/\d/.test(editUser.lastName)) errs.lastName = 'Last name should not contain numbers.'
    
    if (!editUser.phone?.trim()) errs.phone = 'Phone number is required.'
    else if (!/^\d{10}$/.test(editUser.phone)) errs.phone = 'Phone number must be exactly 10 digits.'
    
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!validateCreate()) return
    const payload = { ...form }
    // Remove fields strictly forbidden by backend DTO
    delete payload.isActive
    
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
              headers={['S.No', 'User', 'Role', 'Contact', 'ID', 'Status', 'Actions']}
              empty={displayedUsers.length === 0 ? (
                <EmptyState icon={Users} title="No users found" description="Try adjusting your filters" />
              ) : null}
            >
              {displayedUsers.map((u, idx) => (
                <tr key={u._id} className="table-row">
                  <td className="table-td text-xs text-slate-400">
                    {(page - 1) * limit + idx + 1}
                  </td>
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
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" required error={errors.firstName}>
              <input className={clsx("input", errors.firstName && "border-rose-500/50 focus:border-rose-500/50")} value={form.firstName} onChange={e => { setForm(p => ({ ...p, firstName: e.target.value.replace(/[0-9]/g, '') })); setErrors(p => ({...p, firstName: undefined})) }} maxLength={50} />
            </Field>
            <Field label="Last Name" required error={errors.lastName}>
              <input className={clsx("input", errors.lastName && "border-rose-500/50 focus:border-rose-500/50")} value={form.lastName} onChange={e => { setForm(p => ({ ...p, lastName: e.target.value.replace(/[0-9]/g, '') })); setErrors(p => ({...p, lastName: undefined})) }} maxLength={50} />
            </Field>
          </div>
          <Field label="Email" required error={errors.email}>
            <input type="email" className={clsx("input", errors.email && "border-rose-500/50 focus:border-rose-500/50")} value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({...p, email: undefined})) }} />
          </Field>
          <Field label="Password" required error={errors.password}>
            <input type="password" className={clsx("input", errors.password && "border-rose-500/50 focus:border-rose-500/50")} value={form.password} onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({...p, password: undefined})) }} maxLength={50} />
          </Field>
          <Field label="Role" required>
            <select className="input" value={form.role} onChange={e => { setForm(p => ({ ...p, role: e.target.value })) }}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input className={clsx("input", errors.phone && "border-rose-500/50 focus:border-rose-500/50")} value={form.phone} onChange={e => { setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') })); setErrors(p => ({...p, phone: undefined})) }} maxLength={10} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); resetForm() }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => { setEditUser(null); setErrors({}) }} title="Edit User" size="md">
        {editUser && (
          <form onSubmit={(e) => {
            e.preventDefault()
            if (!validateEdit()) return
            updateMutation.mutate({ id: editUser._id, data: { firstName: editUser.firstName, lastName: editUser.lastName, phone: editUser.phone } })
          }} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" required error={errors.firstName}>
                <input className={clsx("input", errors.firstName && "border-rose-500/50 focus:border-rose-500/50")} value={editUser.firstName} onChange={e => { setEditUser(p => ({ ...p, firstName: e.target.value.replace(/[0-9]/g, '') })); setErrors(p => ({...p, firstName: undefined})) }} maxLength={50} />
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <input className={clsx("input", errors.lastName && "border-rose-500/50 focus:border-rose-500/50")} value={editUser.lastName} onChange={e => { setEditUser(p => ({ ...p, lastName: e.target.value.replace(/[0-9]/g, '') })); setErrors(p => ({...p, lastName: undefined})) }} maxLength={50} />
              </Field>
            </div>
            <Field label="Phone" required error={errors.phone}>
              <input className={clsx("input", errors.phone && "border-rose-500/50 focus:border-rose-500/50")} value={editUser.phone || ''} onChange={e => { setEditUser(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') })); setErrors(p => ({...p, phone: undefined})) }} maxLength={10} />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1 justify-center">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditUser(null)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
