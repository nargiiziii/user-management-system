import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/axios'

const Ctx = createContext(null)

export function NotifProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications)
      setUnread(data.unread)
    } catch {}
  }, [])

  const markRead = useCallback(async (id) => {
    await api.put(`/notifications/${id}/read`)
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
    setUnread(u => Math.max(0, u - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    await api.put('/notifications/read-all')
    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
    setUnread(0)
  }, [])

  const remove = useCallback(async (id) => {
    await api.delete(`/notifications/${id}`)
    const notif = notifications.find(n => n.id === id)
    setNotifications(n => n.filter(x => x.id !== id))
    if (notif && !notif.is_read) setUnread(u => Math.max(0, u - 1))
  }, [notifications])

  return (
    <Ctx.Provider value={{ notifications, unread, fetchNotifications, markRead, markAllRead, remove }}>
      {children}
    </Ctx.Provider>
  )
}

export const useNotifications = () => useContext(Ctx)
