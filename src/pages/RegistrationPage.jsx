import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, ArrowRight, User, Briefcase, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authAPI } from '../api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const Field = ({ label, name, type = 'text', placeholder, icon: Icon, required = true, form, setForm, errors, setErrors, showPass, setShowPass }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <input
        type={type === 'password' && showPass ? 'text' : type}
        className={clsx(
          "w-full bg-ink-900/50 border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 transition-all outline-none",
          errors[name] ? "border-rose-500/50 focus:border-rose-500 shadow-rose-500/5" : "border-white/10 focus:border-azure-500/50 focus:bg-ink-900 shadow-transparent"
        )}
        placeholder={placeholder}
        value={form[name]}
        onChange={e => {
          setForm(p => ({ ...p, [name]: e.target.value }))
          if (errors[name]) setErrors(p => {
            const n = { ...p }; delete n[name]; return n
          })
        }}
        required={required}
      />
      {type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPass(!showPass)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
      {errors[name] && (
        <p className="text-[10px] text-rose-400 mt-1 ml-1">{errors[name]}</p>
      )}
    </div>
  </div>
)

export default function RegistrationPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('STUDENT')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })

  // Validation state
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!form.firstName) newErrors.firstName = 'Required'
    if (!form.lastName) newErrors.lastName = 'Required'
    if (!form.email) newErrors.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email'
    
    if (!form.password) newErrors.password = 'Required'
    else if (form.password.length < 8) newErrors.password = 'Min 8 characters'
    
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setLoading(true)
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role,
        phone: form.phone,
      }
      
      await authAPI.register(payload)
      toast.success('Registration successful! Please login.')
      navigate('/login')
    } catch (err) {
      // errors toasted by interceptor
    } finally {
      setLoading(false)
    }
  }

  const fieldProps = { form, setForm, errors, setErrors, showPass, setShowPass }

  return (
    <div className="min-h-screen bg-ink-950 bg-glow-azure flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-ink bg-grid opacity-100 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-azure-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-xl"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-azure-600/20 border border-azure-500/30 mb-4 shadow-glow group hover:scale-110 transition-transform">
            <GraduationCap className="w-7 h-7 text-azure-400" />
          </Link>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight">Join School ERP</h1>
          <p className="text-slate-500 mt-2 text-sm">Create your account to get started</p>
        </div>

        <div className="card p-8 shadow-glow-lg border border-white/10 relative overflow-hidden">
          {/* Role Tabs */}
          <div className="flex p-1 bg-ink-900/80 rounded-xl border border-white/5 mb-8">
            <button
              onClick={() => setRole('STUDENT')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                role === 'STUDENT' ? "bg-azure-600 text-white shadow-lg shadow-azure-900/20" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <User className="w-4 h-4" /> Student
            </button>
            <button
              onClick={() => setRole('TEACHER')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                role === 'TEACHER' ? "bg-azure-600 text-white shadow-lg shadow-azure-900/20" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Briefcase className="w-4 h-4" /> Teacher
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" name="firstName" placeholder="John" {...fieldProps} />
              <Field label="Last Name" name="lastName" placeholder="Doe" {...fieldProps} />
            </div>

            <Field label="Email Address" name="email" type="email" placeholder="john@school.com" {...fieldProps} />
            <Field label="Phone Number" name="phone" placeholder="+1 (555) 000-0000" required={false} {...fieldProps} />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Password" name="password" type="password" placeholder="••••••••" {...fieldProps} />
              <Field label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" {...fieldProps} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base shadow-glow hover:shadow-glow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-azure-400 hover:text-azure-300 font-medium hover:underline underline-offset-4 decoration-azure-400/30">
              Sign in
            </Link>
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex items-center justify-center gap-8 mt-10">
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-azure-500/50" />
            <span className="text-xs">Secure Encryption</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-azure-500/50" />
            <span className="text-xs">Role-based Access</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-azure-500/50" />
            <span className="text-xs">Academic Integrity</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
