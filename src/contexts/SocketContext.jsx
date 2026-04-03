import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { notificationsAPI } from '../api'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [lastAttendanceUpdate, setLastAttendanceUpdate] = useState(null)
  const [lastSessionUpdate, setLastSessionUpdate] = useState(null)
  const [lastScheduleUpdate, setLastScheduleUpdate] = useState(null)
  const [lastReportGenerated, setLastReportGenerated] = useState(null)

  // Fetch notifications on mount
  useEffect(() => {
    if (isAuthenticated) {
      notificationsAPI.getAll().then(setNotifications).catch(console.error)
    } else {
      setNotifications([])
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    const token = localStorage.getItem('erp_token')
    const socket = io('/school-erp', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      // Join personal room for notifications
      if (user?._id) socket.emit('joinUserRoom', user._id)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('systemNotification', (notification) => {
      console.log('Received systemNotification:', notification);
      // Add to state if it's a new notification object from backend or map it
      const newNotif = notification.data ? {
        _id: notification.data.eventId || Date.now().toString(),
        title: notification.data.title,
        message: notification.message,
        type: notification.type,
        createdAt: new Date().toISOString(),
        isRead: false
      } : notification;

      setNotifications(prev => [newNotif, ...prev].slice(0, 50))
    })

    socket.on('attendanceUpdate', (data) => {
      setLastAttendanceUpdate({ ...data, _ts: Date.now() })
    })

    socket.on('sessionUpdate', (data) => {
      setLastSessionUpdate({ ...data, _ts: Date.now() })
    })

    socket.on('scheduleUpdate', (data) => {
      setLastScheduleUpdate({ ...data, _ts: Date.now() })
    })

    socket.on('reportGenerated', (data) => {
      setLastReportGenerated({ ...data, _ts: Date.now() })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [isAuthenticated, user?._id])

  const joinClass = (classId) => {
    socketRef.current?.emit('joinClass', classId)
  }

  const leaveClass = (classId) => {
    socketRef.current?.emit('leaveClass', classId)
  }

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      console.error('Failed to mark all as read', err)
    }
  }

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      notifications,
      markAsRead,
      markAllAsRead,
      joinClass,
      leaveClass,
      lastAttendanceUpdate,
      lastSessionUpdate,
      lastScheduleUpdate,
      lastReportGenerated,
    }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
