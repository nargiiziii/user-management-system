import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'

const NAV = [
  { section: 'Main' },
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/tasks',     icon: '☑', label: 'Tasks' },
  { section: 'Management', adminOnly: true },
  { to: '/users',        icon: '👥', label: 'Users',       adminOnly: true },
  { to: '/departments',  icon: '🏢', label: 'Departments', adminOnly: true },
  { to: '/activity',     icon: '📊', label: 'Activity Log', adminOnly: true },
  { section: 'Account' },
  { to: '/profile',  icon: '👤', label: 'My Profile' },
  { to: '/settings', icon: '⚙', label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isAdmin   = user?.role === 'admin'
  const isManager = user?.role === 'admin' || user?.role === 'manager'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {open && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:49}} onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">U</div>
          <div className="logo-text">UMS<span>Pro</span></div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) => {
            if (item.section) {
              if (item.adminOnly && !isAdmin) return null
              return <div key={i} className="nav-section-label">{item.section}</div>
            }
            if (item.adminOnly && !isAdmin) return null
            if (item.managerOnly && !isManager) return null
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onClose?.()}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user" onClick={() => navigate('/profile')}>
            <Avatar name={user?.name} color={user?.avatar_color} size="sm" />
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role} • {user?.status}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-full" style={{marginTop:6, justifyContent:'flex-start', gap:8}} onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
    </>
  )
}
