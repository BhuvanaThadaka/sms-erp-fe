import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { authAPI } from '../api'
import { Field } from '../components/ui'
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: (data) => authAPI.resetPassword(data),
    onSuccess: () => {
      setIsSuccess(true)
      toast.success('Password updated successfully!')
      setTimeout(() => navigate('/login'), 3000)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match')
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }
    mutation.mutate({ token, password })
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ink-950">
        <div className="card p-8 text-center max-w-md border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4 text-red-400">Invalid Link</h2>
          <p className="text-slate-400 mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" title="Go to Forgot Password" size="sm" className="btn-primary">
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ink-950 selection:bg-azure-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-azure-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-jade-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="card p-8 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-azure-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-jade-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-jade-500/20 shadow-inner">
                <Lock className="w-8 h-8 text-jade-400" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight underline decoration-jade-500/30 underline-offset-8">Reset Password</h1>
              <p className="mt-5 text-slate-400 text-sm leading-relaxed">
                Enter your new password below to regain access to your account.
              </p>
            </div>

            {!isSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Field label="New Password">
                  <div className="relative group/input">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-all group-focus-within/input:text-jade-400 group-hover/input:text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pl-11 pr-11 py-3 text-base"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm Password">
                  <div className="relative group/input">
                    <CheckCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-all group-focus-within/input:text-jade-400 group-hover/input:text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pl-11 py-3 text-base"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="btn-primary w-full justify-center py-4 bg-jade-600 hover:bg-jade-500 shadow-jade-500/20 text-base font-bold group/btn"
                >
                  {mutation.isPending ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-8 bg-jade-500/5 rounded-2xl border border-jade-500/10"
              >
                <div className="w-14 h-14 bg-jade-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-jade-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Your password has been reset. Redirecting you to the login page in a few seconds...
                </p>
                <Link to="/login" className="text-jade-400 hover:text-jade-300 text-sm font-semibold flex items-center justify-center gap-2">
                  Click here if you aren't redirected
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
