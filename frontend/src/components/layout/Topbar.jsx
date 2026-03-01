import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useNotifications } from '../../context/NotifContext'
import NotifPanel from '../ui/NotifPanel'

const PAGE_TITLES = {
  '/dashboard':   { title: 'Dashboard',    icon: '⬡' },
  '/users':       { title: 'Users',        icon: '👥' },
  '/departments': { title: 'Departments',  icon: '🏢' },
  '/tasks':       { title: 'Tasks',        icon: '☑' },
  '/activity':    { title: 'Activity Log', icon: '📊' },
  '/profile':     { title: 'My Profile',   icon: '👤' },
  '/settings':    { title: 'Settings',     icon: '⚙' },
}

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const { unread, fetchNotifications } = useNotifications()
  const [showNotif, setShowNotif] = useState(false)

  const page = PAGE_TITLES[location.pathname] || { title: 'UMS Pro', icon: '⬡' }

  useEffect(() => { fetchNotifications() }, [location.pathname])

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon" style={{display:'none'}} id="menu-btn" onClick={onMenuClick}>☰</button>
      <div className="topbar-title">
        <span style={{marginRight:8}}>{page.icon}</span>
        {page.title}
      </div>
      <div className="topbar-right">
        <div className="dropdown notif-btn" style={{position:'relative'}}>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowNotif(v => !v)}>
            🔔
            {unread > 0 && <span className="notif-dot" />}
          </button>
          {showNotif && <NotifPanel onClose={() => setShowNotif(false)} />}
        </div>
      </div>
    </header>
  )
}
