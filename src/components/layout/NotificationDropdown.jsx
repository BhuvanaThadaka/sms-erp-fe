import React, { useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Calendar, Info, BookMarked, Clock } from 'lucide-react'
import clsx from 'clsx'

export default function NotificationDropdown({ 
  notifications, 
  onClose, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onNotificationClick
}) {
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-ink-900 border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[32rem] animate-in fade-in zoom-in duration-150"
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div>
          <h3 className="text-sm font-bold text-white">Notifications</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {unreadCount > 0 ? `You have ${unreadCount} unread messages` : 'No new notifications'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); onMarkAllAsRead(); }}
            className="text-xs text-azure-400 hover:text-azure-300 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">All caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map((notif) => {
              const typeConfig = {
                EVENT_CREATED: { icon: Calendar, color: 'bg-azure-500/20 text-azure-400', label: 'Event' },
                SESSION_CREATED: { icon: BookMarked, color: 'bg-jade-500/20 text-jade-400', label: 'Session' },
                SCHEDULE_CREATED: { icon: Clock, color: 'bg-amber-500/20 text-amber-400', label: 'Schedule' },
                SCHEDULE_RESCHEDULED: { icon: Clock, color: 'bg-rose-500/20 text-rose-400', label: 'Rescheduled' },
                DEFAULT: { icon: Info, color: 'bg-slate-500/20 text-slate-400', label: 'Notification' }
              }
              const config = typeConfig[notif.type] || typeConfig.DEFAULT
              const Icon = config.icon

              return (
                <div 
                  key={notif._id}
                  onClick={() => {
                    if (!notif.isRead) onMarkAsRead(notif._id)
                    onNotificationClick(notif)
                    onClose()
                  }}
                  className={clsx(
                    'p-4 hover:bg-white/5 transition-colors cursor-pointer relative group',
                    !notif.isRead && 'bg-azure-500/5'
                  )}
                >
                  <div className="flex gap-3">
                    <div className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      config.color
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={clsx('text-sm font-medium truncate', notif.isRead ? 'text-slate-300' : 'text-white')}>
                          {notif.title || config.label}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-azure-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-2 font-mono">
                        {formatDistanceToNow(new Date(notif.createdAt || Date.now()), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 bg-white/5 border-t border-white/5 text-center">
          <button className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            View all history
          </button>
        </div>
      )}
    </div>
  )
}
