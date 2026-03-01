import { useEffect, useRef } from 'react'
import { useNotifications } from '../../context/NotifContext'
import { timeAgo } from '../../utils/helpers'

const typeEmoji = { info:'ℹ️', success:'✅', warning:'⚠️', error:'🔴' }

export default function NotifPanel({ onClose }) {
  const { notifications, unread, markRead, markAllRead, remove } = useNotifications()
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="notif-panel" ref={ref}>
      <div className="notif-header">
        <h4>Notifications {unread > 0 && <span style={{color:'var(--red)',fontSize:12}}>({unread})</span>}</h4>
        {unread > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>}
      </div>
      <div className="notif-list">
        {!notifications.length && (
          <div style={{padding:'30px', textAlign:'center', color:'var(--text-muted)', fontSize:13}}>
            No notifications
          </div>
        )}
        {notifications.map(n => (
          <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}
               onClick={() => !n.is_read && markRead(n.id)}>
            <div className={`notif-item-dot ${n.is_read ? 'read' : ''}`} />
            <div className="notif-item-content" style={{flex:1}}>
              <h5>{typeEmoji[n.type]} {n.title}</h5>
              <p>{n.message}</p>
              <div className="notif-item-time">{timeAgo(n.created_at)}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm"
              style={{opacity:.5}}
              onClick={e => { e.stopPropagation(); remove(n.id) }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
