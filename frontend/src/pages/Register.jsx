import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name:'', email:'', password:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm({...form, [e.target.name]: e.target.value})

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:40,height:40,background:'linear-gradient(135deg,#5b8af5,#a78bfa)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:20,color:'white'}}>U</div>
            <span style={{fontWeight:700,fontSize:17}}>UMS<span style={{color:'var(--accent)'}}>Pro</span></span>
          </div>
          <h1>Join your <span>workspace</span> today</h1>
          <p>Create your account and start collaborating with your team in minutes.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-wrap animate-in">
          <h2>Create account</h2>
          <p className="auth-sub">Fill in your details below</p>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handle} placeholder="Alex Johnson" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handle} placeholder="alex@company.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="Min. 6 characters" minLength={6} required />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ Creating...' : '✨ Create Account'}
            </button>
          </form>
          <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
