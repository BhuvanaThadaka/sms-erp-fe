import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import {
  LayoutDashboard, Users, BookOpen, Calendar, FileText,
  ClipboardList, Bell, LogOut, Menu, GraduationCap,
  Activity, Shield, ChevronRight, Wifi, WifiOff, BookMarked,
  Clock, BarChart3, BarChart2, BookCopy, UserCheck, PenLine, User, Camera, User
} from 'lucide-react'
import clsx from 'clsx'
import NotificationDropdown from './NotificationDropdown'

const NAV = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/classes', label: 'Classes', icon: BookOpen },
    { to: '/admin/subjects', label: 'Subjects', icon: BookCopy },
    { to: '/admin/student-assignment', label: 'Assign Students', icon: UserCheck },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: Shield },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  TEACHER: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/teacher/attendance', label: 'Attendance', icon: ClipboardList },
    { to: '/teacher/attendance-analysis', label: 'Attendance Analysis', icon: BarChart2 },
    { to: '/teacher/marks', label: 'Enter Marks', icon: PenLine },
    { to: '/teacher/class-performance', label: 'Class Performance', icon: BarChart3 },
    { to: '/teacher/sessions', label: 'Sessions', icon: BookMarked },
    { to: '/teacher/schedule', label: 'Schedule', icon: Clock },
    { to: '/teacher/academic-reports', label: 'Academic Reports', icon: FileText },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/profile', label: 'Profile', icon: User },
  ],
  STUDENT: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/student/report-card', label: 'Report Card', icon: BarChart3 },
    { to: '/student/attendance', label: 'Attendance', icon: Activity },
    { to: '/student/notes', label: 'Notes', icon: FileText },
    { to: '/student/schedule', label: 'Schedule', icon: Clock },
    { to: '/student/reports', label: 'Term Reports', icon: BookCopy },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/profile', label: 'Profile', icon: User },
  ],
}

const ROLE_COLORS = {
  ADMIN: 'text-rose-400',
  TEACHER: 'text-azure-400',
  STUDENT: 'text-jade-400',
}

const ROLE_BG = {
  ADMIN: 'bg-rose-500/10 border-rose-500/20',
  TEACHER: 'bg-azure-500/10 border-azure-500/20',
  STUDENT: 'bg-jade-500/10 border-jade-500/20',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { connected, notifications, markAsRead, markAllAsRead } = useSocket()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const unreadCount = notifications.filter(n => !n.isRead).length

  const nav = NAV[user?.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-azure-600/20 border border-azure-500/30 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-azure-400" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-display font-bold text-white text-sm leading-none">School ERP</p>
              <p className="text-xs text-slate-500 mt-0.5">Academic System</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'bg-azure-600/15 text-azure-400 border border-azure-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            )}
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
            {sidebarOpen && (
              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        {/* WS status */}
        {sidebarOpen && (
          <div className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg mb-2 text-xs',
            connected ? 'text-jade-400' : 'text-slate-500'
          )}>
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? 'Live updates active' : 'Connecting...'}
            {connected && <span className="live-dot ml-auto" />}
          </div>
        )}

        <div className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg', ROLE_BG[user?.role], 'border mb-2')}>
          <div className="w-8 h-8 rounded-lg bg-ink-700 flex items-center justify-center flex-shrink-0">
            <span className={clsx('text-xs font-bold font-display', ROLE_COLORS[user?.role])}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
              <p className={clsx('text-xs font-mono', ROLE_COLORS[user?.role])}>{user?.role}</p>
            </div>
          )}
        </div>

        <NavLink
          to="/profile"
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all w-full mb-1 group',
            isActive 
              ? 'bg-azure-600/15 text-azure-400 border border-azure-500/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          )}
          onClick={() => setMobileOpen(false)}
        >
          <User className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span>My Profile</span>}
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all w-full"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-ink-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={clsx(
        'hidden lg:flex flex-col bg-ink-900 border-r border-white/5 transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-ink-900 border-r border-white/5 z-50 animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 lg:px-6 h-14 border-b border-white/5 bg-ink-900/50 backdrop-blur flex-shrink-0 z-40 relative">
          <button
            onClick={() => { setSidebarOpen(v => !v); setMobileOpen(v => !v) }}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className={clsx('hidden sm:flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border', ROLE_BG[user?.role])}>
            <span className={ROLE_COLORS[user?.role]}>{user?.role}</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-slate-400 hover:text-white transition-colors p-1.5"
            >
              <Bell className={clsx('w-4 h-4', unreadCount > 0 && 'animate-pulse text-azure-400')} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-ink-900 shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <NotificationDropdown 
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
              />
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 min-h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
