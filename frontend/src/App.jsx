import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotifProvider } from './context/NotifContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login       from './pages/Login'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import Users       from './pages/Users'
import UserProfile from './pages/UserProfile'
import Tasks       from './pages/Tasks'
import Departments from './pages/Departments'
import ActivityLog from './pages/ActivityLog'
import Settings    from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <NotifProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks"     element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Admin/Manager only */}
            <Route path="/users"       element={<ProtectedRoute roles={['admin','manager']}><Users /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute roles={['admin']}><Departments /></ProtectedRoute>} />
            <Route path="/activity"    element={<ProtectedRoute roles={['admin','manager']}><ActivityLog /></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotifProvider>
    </AuthProvider>
  )
}
