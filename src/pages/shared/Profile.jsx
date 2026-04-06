import React, { useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usersAPI } from '../../api'
import { SectionHeader, LoadingState } from '../../components/ui'
import { User as UserIcon, Mail, Phone, MapPin, Camera, Save, ShieldCheck, Calendar, BadgeCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar: user?.avatar || '',
    dateOfBirth: user?.dateOfBirth ? format(new Date(user.dateOfBirth), 'yyyy-MM-dd') : '',
  })
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errs = {}
    if (!formData.firstName?.trim()) errs.firstName = "First name is required"
    if (!formData.lastName?.trim()) errs.lastName = "Last name is required"
    if (!formData.phone || formData.phone.trim().length !== 10) errs.phone = "Phone number must be exactly 10 digits"
    
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      const payload = { ...formData }
      if (!payload.dateOfBirth) delete payload.dateOfBirth
      
      const res = await usersAPI.updateProfile(user._id, payload)
      const updatedUser = res.data?.user || res.data || res
      updateUser(updatedUser)
      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <LoadingState />

  const ROLE_COLORS = {
    ADMIN: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
    TEACHER: 'text-azure-400 border-azure-500/20 bg-azure-500/5',
    STUDENT: 'text-jade-400 border-jade-500/20 bg-jade-500/5',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <SectionHeader title="Your Profile" subtitle="Manage your personal information and account settings" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Avatar & Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 text-center">
            <div className="relative inline-block group">
              <div className="w-32 h-32 rounded-2xl bg-ink-700 border-2 border-white/5 overflow-hidden flex items-center justify-center relative">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-slate-600" />
                )}
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                >
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-bold text-white">{user.firstName} {user.lastName}</h2>
              <div className={clsx(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border mt-2",
                ROLE_COLORS[user.role]
              )}>
                {user.role}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
               <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
               </div>
               <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <BadgeCheck className="w-4 h-4" />
                  <span>{user.employeeId || user.enrollmentNumber || 'N/A'}</span>
               </div>
               <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>DOB: {user.dateOfBirth ? format(new Date(user.dateOfBirth), 'MMMM d, yyyy') : 'N/A'}</span>
               </div>
               <div className="flex items-center gap-3 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {user.joinDate ? format(new Date(user.joinDate), 'MMMM yyyy') : 'N/A'}</span>
               </div>
            </div>
          </div>

          <div className="card p-5 bg-azure-500/5 border-azure-500/10">
             <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-azure-400 mt-0.5" />
                <div>
                   <h4 className="text-sm font-bold text-azure-400 uppercase tracking-wider">Account Security</h4>
                   <p className="text-xs text-slate-500 mt-1 leading-relaxed">Your profile information is only visible to school administrators and verified staff members.</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01]">
               <h3 className="text-sm font-bold text-white uppercase tracking-wider">General Information</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="label">First Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    className={clsx("input", errors.firstName && "border-rose-500/50")} 
                    value={formData.firstName}
                    onChange={e => { setFormData(p => ({ ...p, firstName: e.target.value })); setErrors(p => ({ ...p, firstName: undefined })) }}
                  />
                  {errors.firstName && <p className="text-rose-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="label">Last Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    className={clsx("input", errors.lastName && "border-rose-500/50")} 
                    value={formData.lastName}
                    onChange={e => { setFormData(p => ({ ...p, lastName: e.target.value })); setErrors(p => ({ ...p, lastName: undefined })) }}
                  />
                  {errors.lastName && <p className="text-rose-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="label">Phone Number <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="tel" 
                      className={clsx("input pl-10", errors.phone && "border-rose-500/50")} 
                      value={formData.phone}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData(p => ({ ...p, phone: val }));
                        if (errors.phone) setErrors(p => ({ ...p, phone: undefined }))
                      }}
                      placeholder="Enter 10-digit number"
                    />
                  </div>
                  {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="label">Email Address (Read-only)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      type="email" 
                      className="input pl-10 opacity-50 bg-ink-950 cursor-not-allowed" 
                      value={user.email}
                      readOnly 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="label">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="date" 
                      className="input pl-10" 
                      value={formData.dateOfBirth}
                      onChange={e => setFormData(p => ({ ...p, dateOfBirth: e.target.value }))}
                      max={new Date(Date.now() - 86400000).toISOString().split("T")[0]}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Home Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <textarea 
                    className="input pl-10 pt-2.5 h-24 resize-none" 
                    value={formData.address}
                    onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    placeholder="Enter your full residential address"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Updating Profile...' : 'Save Changes'}
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone || '',
                    address: user.address || '',
                    avatar: user.avatar || '',
                    dateOfBirth: user.dateOfBirth ? format(new Date(user.dateOfBirth), 'yyyy-MM-dd') : '',
                  })}
                  className="btn-secondary px-6"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
