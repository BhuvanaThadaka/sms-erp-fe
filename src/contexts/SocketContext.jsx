import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [lastAttendanceUpdate, setLastAttendanceUpdate] = useState(null)
  const [lastSessionUpdate, setLastSessionUpdate] = useState(null)
  const [lastScheduleUpdate, setLastScheduleUpdate] = useState(null)
  const [lastReportGenerated, setLastReportGenerated] = useState(null)

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

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
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
