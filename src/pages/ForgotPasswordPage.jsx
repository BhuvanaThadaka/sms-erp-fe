import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { authAPI } from '../api'
import { Field } from '../components/ui'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const mutation = useMutation({
    mutationFn: (data) => authAPI.forgotPassword(data),
    onSuccess: () => {
      setIsSubmitted(true)
      toast.success('Reset link sent to your email!')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({ email })
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
            <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm group/back">
              <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
              Back to Login
            </Link>

            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-azure-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-azure-500/20 shadow-inner">
                <Mail className="w-8 h-8 text-azure-400" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Forgot Password?</h1>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                No worries! Enter your email and we'll send you instructions to reset your password.
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Field label="Email Address">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 transition-colors group-focus-within:text-azure-400" />
                    <input
                      type="email"
                      className="input pl-11 py-3 text-base"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teacher@school.com"
                      required
                      autoFocus
                    />
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="btn-primary w-full justify-center py-4 text-base font-bold shadow-lg shadow-azure-500/25 group/btn"
                >
                  {mutation.isPending ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Reset Link
                      <Send className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-6 bg-azure-500/5 rounded-2xl border border-azure-500/10"
              >
                <div className="w-12 h-12 bg-azure-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-6 h-6 text-azure-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Check your email</h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  We have sent a password recover link to <strong className="text-azure-400">{email}</strong>.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-azure-400 hover:text-azure-300 text-sm font-medium transition-colors"
                >
                  Didn't receive it? Try another email
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
