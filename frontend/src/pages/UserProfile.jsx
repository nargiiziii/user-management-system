import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import { formatDate, timeAgo, ACTION_LABELS, AVATAR_COLORS } from '../utils/helpers'

export default function UserProfile() {
  const { id } = useParams()
  const { user: me, updateUser } = useAuth()
  const navigate = useNavigate()
  const userId = id || me?.id

  const [profile, setProfile] = useState(null)
  const [activity, setActivity] = useState([])
  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isMe = parseInt(userId) === me?.id
  const canEdit = me?.role === 'admin' || isMe

  useEffect(() => {
    Promise.all([
      api.get(`/users/${userId}`),
      api.get(`/dashboard/activity?userId=${userId}&limit=10`),
      api.get(`/tasks?assigned_to=${userId}`),
    ]).then(([p, a, t]) => {
      setProfile(p.data)
      setActivity(a.data.logs)
      setTasks(t.data)
      setForm({
        name: p.data.name, phone: p.data.phone||'',
        bio: p.data.bio||'', position: p.data.position||'',
        avatar_color: p.data.avatar_color||'#5b8af5'
      })
    }).catch(() => navigate('/users'))
  }, [userId])

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(''); setError('')
    try {
      const endpoint = isMe ? '/users/me/profile' : `/users/${userId}`
      const payload = isMe ? form : { ...form, role: profile.role, status: profile.status }
      const { data } = await api.put(endpoint, payload)
      setProfile(p => ({ ...p, ...data }))
      if (isMe) updateUser(data)
      setMsg('✅ Profile updated!'); setEditing(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  if (!profile) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div className="animate-in">
      {/* Hero */}
      <div className="profile-hero">
        <div style={{position:'relative'}}>
          <Avatar name={profile.name} color={profile.avatar_color} size="xl" />
          {profile.status === 'active' && (
            <div style={{position:'absolute',bottom:2,right:2,width:14,height:14,background:'var(--green)',borderRadius:'50%',border:'2px solid var(--bg-card)'}} />
          )}
        </div>
        <div className="profile-meta" style={{flex:1}}>
          <h2>{profile.name}</h2>
          <p>{profile.position || 'No position set'} {profile.department_name ? `· ${profile.department_name}` : ''}</p>
          <div className="profile-badges">
            <Badge value={profile.role} />
            <Badge value={profile.status} />
          </div>
          <div style={{display:'flex',gap:16,marginTop:12,fontSize:12,color:'var(--text-muted)'}}>
            {profile.email && <span>📧 {profile.email}</span>}
            {profile.phone && <span>📞 {profile.phone}</span>}
            <span>📅 Joined {formatDate(profile.created_at)}</span>
            <span>🔑 {profile.login_count} logins</span>
          </div>
        </div>
        {canEdit && (
          <button className="btn btn-ghost" onClick={() => setEditing(!editing)}>
            {editing ? '✕ Cancel' : '✏️ Edit'}
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><h3>Edit Profile</h3></div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            {msg   && <div className="alert alert-success">{msg}</div>}
            <form onSubmit={saveProfile}>
              <div className="form-row">
                <div className="form-group">
                  <label>Display Name</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Position / Title</label>
                <input value={form.position} onChange={e=>setForm({...form,position:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} rows={3} />
              </div>
              <div className="form-group">
                <label>Avatar Color</label>
                <div className="color-picker" style={{marginTop:4}}>
                  {AVATAR_COLORS.map(c => (
                    <div key={c} className={`color-swatch ${form.avatar_color===c?'selected':''}`}
                         style={{background:c}} onClick={() => setForm({...form,avatar_color:c})} />
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳...' : '✓ Save'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {['overview','tasks','activity'].map(t => (
          <button key={t} className={`tab-btn ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {t==='overview'?'👤 Overview':t==='tasks'?`☑ Tasks (${tasks.length})`:`📋 Activity`}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div className="card">
            <div className="card-header"><h3>About</h3></div>
            <div className="card-body">
              {profile.bio ? <p style={{color:'var(--text-secondary)',fontSize:13,lineHeight:1.7}}>{profile.bio}</p>
                : <p style={{color:'var(--text-muted)',fontSize:13}}>No bio provided.</p>}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Stats</h3></div>
            <div className="card-body" style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                ['Total Tasks', tasks.length],
                ['Completed', tasks.filter(t=>t.status==='done').length],
                ['In Progress', tasks.filter(t=>t.status==='in_progress').length],
                ['Login Count', profile.login_count],
              ].map(([label, value]) => (
                <div key={label} style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                  <span style={{color:'var(--text-secondary)'}}>{label}</span>
                  <span style={{fontFamily:'var(--mono)',fontWeight:600}}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="card">
          <div className="card-body" style={{padding:0}}>
            {!tasks.length && <div className="empty-state"><div className="empty-icon">☑</div><p>No tasks assigned</p></div>}
            {tasks.map(t => (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:'1px solid var(--border)'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500}}>{t.title}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>Due: {formatDate(t.due_date)}</div>
                </div>
                <Badge value={t.priority} />
                <Badge value={t.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="card">
          <div className="card-body" style={{padding:'8px 20px'}}>
            {!activity.length && <div className="empty-state"><div className="empty-icon">📋</div><p>No activity yet</p></div>}
            {activity.map(log => (
              <div key={log.id} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-text">
                  {ACTION_LABELS[log.action] || log.action}
                  {log.ip_address && <span style={{color:'var(--text-muted)',marginLeft:6,fontFamily:'var(--mono)',fontSize:11}}>{log.ip_address}</span>}
                  <div className="activity-time">{timeAgo(log.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
