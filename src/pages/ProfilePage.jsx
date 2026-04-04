import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usersAPI } from '../api'
import toast from 'react-hot-toast'
import { 
  Camera, User, Mail, Phone, MapPin, 
  Calendar, Save, Loader2, Shield 
} from 'lucide-react'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    dateOfBirth: ''
  })
  const [avatarPreview, setAvatarPreview] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        address: user.address || '',
        dateOfBirth: user.dateOfBirth ? format(new Date(user.dateOfBirth), 'yyyy-MM-dd') : ''
      })
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
    }
  }, [user])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Image size must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = { ...formData }
      if (avatarPreview && avatarPreview !== user.avatar) {
        payload.avatar = avatarPreview
      }

      // Remove empty strings for optional fields to pass validation
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          delete payload[key]
        }
      })
      
      const updatedUser = await usersAPI.update(user._id, payload)
      updateUser(updatedUser)
      toast.success('Profile updated successfully')
    } catch (error) {
      // Toast error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  const roleColors = {
    ADMIN: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    TEACHER: 'text-azure-400 bg-azure-500/10 border-azure-500/20',
    STUDENT: 'text-jade-400 bg-jade-500/10 border-jade-500/20',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">My Profile</h1>
          <p className="text-slate-400">Manage your personal information and settings</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2 ${roleColors[user?.role] || 'text-slate-400 bg-white/5 border-white/10'}`}>
          <Shield className="w-4 h-4" />
          {user?.role}
        </div>
      </div>

      <div className="bg-ink-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <form onSubmit={handleSubmit}>
          
          <div className="p-6 sm:p-8 space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-white/5">
              <div 
                className="relative group cursor-pointer"
                onClick={handlePhotoClick}
              >
                <div className="w-32 h-32 rounded-full overflow-hidden bg-ink-800 border-4 border-white/5 relative flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-display font-bold text-slate-600">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Change</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-medium text-white">Profile Photo</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Upload a new profile picture. Recommended square image, max 2MB.
                </p>
                <button 
                  type="button"
                  onClick={handlePhotoClick}
                  className="mt-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors"
                >
                  Upload Photo
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full bg-ink-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-azure-500/50 focus:border-azure-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full bg-ink-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-azure-500/50 focus:border-azure-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-ink-900 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500 ml-1">Email cannot be changed.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-ink-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-azure-500/50 focus:border-azure-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 w-5 h-5 text-slate-500" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your full address"
                    rows="3"
                    className="w-full bg-ink-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-azure-500/50 focus:border-azure-500 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="text-sm font-medium text-slate-300 ml-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full bg-ink-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-azure-500/50 focus:border-azure-500 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 sm:p-8 bg-black/20 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-azure-500 hover:bg-azure-400 text-white font-medium transition-all shadow-lg shadow-azure-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
          
        </form>
      </div>
    </div>
  )
}
