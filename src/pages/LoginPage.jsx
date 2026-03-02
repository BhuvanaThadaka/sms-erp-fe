import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await login(form)
      toast.success(`Welcome back, ${user.firstName}!`)
      if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'TEACHER') navigate('/teacher')
      else navigate('/student')
    } catch {
      // errors toasted by interceptor
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = (role) => {
    const creds = {
      ADMIN: { email: 'admin@school.com', password: 'Admin@123' },
      TEACHER: { email: 'teacher@school.com', password: 'Teacher@123' },
      STUDENT: { email: 'student@school.com', password: 'Student@123' },
    }
    setForm(creds[role])
  }

  return (
    <div className="min-h-screen bg-ink-950 bg-glow-azure flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 bg-grid-ink bg-grid opacity-100 pointer-events-none" />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-azure-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-azure-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-azure-600/20 border border-azure-500/30 mb-4 shadow-glow">
            <GraduationCap className="w-7 h-7 text-azure-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">School ERP</h1>
          <p className="text-slate-500 text-sm mt-1">Academic Management System</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-glow-lg border border-white/8">
          <h2 className="font-display font-semibold text-white mb-5">Sign in to continue</h2>

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@school.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : (
                <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Demo logins */}
          <div className="mt-5 pt-5 border-t border-white/5">
            <p className="text-xs text-slate-500 mb-3 text-center">Quick demo access</p>
            <div className="grid grid-cols-3 gap-2">
              {['ADMIN', 'TEACHER', 'STUDENT'].map(role => {
                const colors = {
                  ADMIN: 'border-rose-500/20 text-rose-400 hover:bg-rose-500/5',
                  TEACHER: 'border-azure-500/20 text-azure-400 hover:bg-azure-500/5',
                  STUDENT: 'border-jade-500/20 text-jade-400 hover:bg-jade-500/5',
                }
                return (
                  <button
                    key={role}
                    onClick={() => demoLogin(role)}
                    className={`text-xs py-2 rounded-lg border bg-transparent transition-colors ${colors[role]}`}
                  >
                    {role}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          School ERP v1.0 — Academic Year 2024–25
        </p>
      </div>
    </div>
  )
}
