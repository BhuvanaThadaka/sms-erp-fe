import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('erp_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (credentials) => {
    setLoading(true)
    try {
      const res = await authAPI.login(credentials)
      const token = res.token || res.data?.token
      const userData = res.user || res.data?.user || res.data || res
      if (!token || !userData) throw new Error('Invalid response from server')
      
      localStorage.setItem('erp_token', token)
      localStorage.setItem('erp_user', JSON.stringify(userData))
      setUser(userData)
      return { success: true, user: userData }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('erp_token')
    localStorage.removeItem('erp_user')
    setUser(null)
  }, [])

  const updateUser = useCallback((data) => {
    const updated = { ...user, ...data }
    localStorage.setItem('erp_user', JSON.stringify(updated))
    setUser(updated)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
