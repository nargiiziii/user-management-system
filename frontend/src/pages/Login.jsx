import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@demo.com', password: 'admin123' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.token, data.refreshToken)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  const quickLogin = (email, pwd) => setForm({ email, password: pwd })

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,background:'linear-gradient(135deg,#5b8af5,#a78bfa)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20,color:'white'}}>U</div>
            <span style={{fontWeight:700,fontSize:17}}>UMS<span style={{color:'var(--accent)'}}>Pro</span></span>
          </div>
          <h1>Manage your <span>team</span> with confidence</h1>
          <p>A powerful user management platform with role-based access, task tracking, analytics, and real-time activity logging.</p>
          <div className="auth-features">
            {[
              ['🛡️','Role-based access control (Admin / Manager / User)'],
              ['📊','Live analytics dashboard with charts'],
              ['☑️','Kanban task management system'],
              ['🔔','Real-time notifications'],
              ['🏢','Department organization'],
              ['📋','Full activity audit log'],
            ].map(([icon, text]) => (
              <div key={text} className="auth-feature">
                <div className="feat-icon">{icon}</div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap animate-in">
          <h2>Welcome back</h2>
          <p className="auth-sub">Sign in to your workspace</p>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Email address</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@company.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary btn-full" style={{marginTop:6}} disabled={loading}>
              {loading ? '⏳ Signing in...' : '→ Sign In'}
            </button>
          </form>

          <div style={{marginTop:20}}>
            <p style={{fontSize:11,color:'var(--text-muted)',marginBottom:8,fontWeight:600,letterSpacing:'.5px',textTransform:'uppercase'}}>Quick access</p>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {[
                ['admin@demo.com',   'admin123',   'Admin',   '#a78bfa'],
                ['manager@demo.com', 'manager123', 'Manager', '#22d3ee'],
                ['james@demo.com',   'user123',    'User',    '#5b8af5'],
              ].map(([email, pwd, role, color]) => (
                <button key={email} className="btn btn-ghost btn-sm"
                  style={{justifyContent:'flex-start',gap:8}}
                  type="button"
                  onClick={() => quickLogin(email, pwd)}>
                  <span style={{background:color+'22',color,padding:'2px 6px',borderRadius:4,fontSize:10,fontWeight:700}}>{role}</span>
                  <span style={{color:'var(--text-muted)',fontSize:12}}>{email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="auth-footer">No account? <Link to="/register">Create one</Link></p>
        </div>
      </div>
    </div>
  )
}
