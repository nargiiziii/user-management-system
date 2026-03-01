import { useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [tab, setTab] = useState('password')
  const [pwd, setPwd] = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [notif, setNotif] = useState({ email:true, tasks:true, system:true })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const changePwd = async (e) => {
    e.preventDefault(); setMsg(''); setError(''); setLoading(true)
    if (pwd.newPassword !== pwd.confirm) { setError('Passwords do not match'); setLoading(false); return }
    try {
      await api.put('/auth/change-password', { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword })
      setMsg('✅ Password changed successfully!'); setPwd({ currentPassword:'', newPassword:'', confirm:'' })
    } catch (err) { setError(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1>Settings</h1><p>Manage your account and preferences</p></div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'200px 1fr', gap:20, alignItems:'start'}}>
        <div className="card" style={{padding:'8px'}}>
          {[
            ['password','🔒 Security'],
            ['notifications','🔔 Notifications'],
            ['appearance','🎨 Appearance'],
            ['danger','⚠️ Danger Zone'],
          ].map(([k, label]) => (
            <div key={k} className={`nav-item ${tab===k?'active':''}`} onClick={() => setTab(k)}>
              {label}
            </div>
          ))}
        </div>

        <div>
          {tab === 'password' && (
            <div className="card">
              <div className="card-header"><h3>🔒 Change Password</h3></div>
              <div className="card-body">
                {msg   && <div className="alert alert-success">{msg}</div>}
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={changePwd} style={{maxWidth:360}}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" value={pwd.currentPassword}
                      onChange={e=>setPwd({...pwd,currentPassword:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" value={pwd.newPassword}
                      onChange={e=>setPwd({...pwd,newPassword:e.target.value})} minLength={6} required />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" value={pwd.confirm}
                      onChange={e=>setPwd({...pwd,confirm:e.target.value})} required />
                  </div>
                  <button className="btn btn-primary" disabled={loading}>
                    {loading ? '⏳...' : '🔒 Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card">
              <div className="card-header"><h3>🔔 Notification Preferences</h3></div>
              <div className="card-body">
                <div className="alert alert-info">These preferences are stored locally in your browser.</div>
                {[
                  ['email', 'Email Notifications', 'Receive notifications via email'],
                  ['tasks', 'Task Assignments', 'Get notified when a task is assigned to you'],
                  ['system', 'System Updates', 'Platform updates and announcements'],
                ].map(([key, title, desc]) => (
                  <div key={key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{title}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)'}}>{desc}</div>
                    </div>
                    <button onClick={() => setNotif({...notif,[key]:!notif[key]})}
                      style={{width:44,height:24,borderRadius:12,background:notif[key]?'var(--accent)':'var(--bg-hover)',border:'none',cursor:'pointer',position:'relative',transition:'background .2s'}}>
                      <div style={{position:'absolute',top:2,left:notif[key]?22:2,width:20,height:20,borderRadius:'50%',background:'white',transition:'left .2s'}} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="card">
              <div className="card-header"><h3>🎨 Appearance</h3></div>
              <div className="card-body">
                <div className="alert alert-info">UMS Pro uses a dark theme optimized for extended use. Light theme coming soon.</div>
                <div style={{display:'flex',gap:12,marginTop:8}}>
                  <div style={{padding:'20px 30px',borderRadius:8,background:'var(--bg-base)',border:'2px solid var(--accent)',cursor:'pointer',textAlign:'center',fontSize:12}}>
                    <div style={{fontSize:20,marginBottom:4}}>🌙</div>
                    Dark (Active)
                  </div>
                  <div style={{padding:'20px 30px',borderRadius:8,background:'var(--bg-hover)',border:'1px solid var(--border)',cursor:'not-allowed',textAlign:'center',fontSize:12,opacity:.5}}>
                    <div style={{fontSize:20,marginBottom:4}}>☀️</div>
                    Light (Soon)
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'danger' && (
            <div className="card" style={{borderColor:'rgba(245,101,101,.25)'}}>
              <div className="card-header"><h3>⚠️ Danger Zone</h3></div>
              <div className="card-body">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px',background:'var(--red-dim)',borderRadius:8,border:'1px solid rgba(245,101,101,.2)'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:500}}>Delete Account</div>
                    <div style={{fontSize:12,color:'var(--text-muted)'}}>Permanently delete your account and all data.</div>
                  </div>
                  <button className="btn btn-danger" onClick={() => alert('Contact an admin to delete your account.')}>Delete Account</button>
                </div>
                <div style={{marginTop:12,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px',background:'var(--yellow-dim)',borderRadius:8,border:'1px solid rgba(245,197,66,.2)'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:500}}>Export My Data</div>
                    <div style={{fontSize:12,color:'var(--text-muted)'}}>Download all your account data as JSON.</div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => alert('Feature coming soon.')}>📦 Export</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
