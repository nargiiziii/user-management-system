import { useState, useEffect } from 'react'
import { AVATAR_COLORS } from '../../utils/helpers'
import Avatar from '../ui/Avatar'

export default function UserModal({ user, departments=[], onSave, onClose }) {
  const isEdit = !!user
  const [form, setForm] = useState({
    name:'', email:'', password:'', role:'user', status:'active',
    department_id:'', position:'', phone:'', bio:'', avatar_color:'#5b8af5'
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) setForm({
      name: user.name||'', email: user.email||'', password:'',
      role: user.role||'user', status: user.status||'active',
      department_id: user.department_id||'', position: user.position||'',
      phone: user.phone||'', bio: user.bio||'', avatar_color: user.avatar_color||'#5b8af5'
    })
  }, [user])

  const handle = e => setForm({...form, [e.target.name]: e.target.value})

  const submit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.department_id) delete payload.department_id
      if (isEdit && !payload.password) delete payload.password
      await onSave(payload, user?.id)
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving user')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Edit User' : '✨ Add New User'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          {/* Avatar preview + color */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,padding:'12px',background:'var(--bg-hover)',borderRadius:8}}>
            <Avatar name={form.name||'?'} color={form.avatar_color} size="lg" />
            <div>
              <div style={{fontSize:13,fontWeight:500,marginBottom:6}}>Avatar color</div>
              <div className="color-picker">
                {AVATAR_COLORS.map(c => (
                  <div key={c} className={`color-swatch ${form.avatar_color===c?'selected':''}`}
                    style={{background:c}} onClick={() => setForm({...form, avatar_color:c})} />
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input name="name" value={form.name} onChange={handle} required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handle} required />
              </div>
            </div>
            <div className="form-group">
              <label>{isEdit ? 'New Password (blank = keep)' : 'Password *'}</label>
              <input name="password" type="password" value={form.password} onChange={handle}
                minLength={isEdit ? 0 : 6} required={!isEdit} placeholder={isEdit?'Leave blank to keep current':'Min 6 chars'} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={form.role} onChange={handle}>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select name="department_id" value={form.department_id} onChange={handle}>
                  <option value="">None</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Position</label>
                <input name="position" value={form.position} onChange={handle} placeholder="e.g. Senior Developer" />
              </div>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handle} placeholder="+1 555 0000" />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea name="bio" value={form.bio} onChange={handle} placeholder="Short bio..." rows={2} />
            </div>
            <div className="modal-footer" style={{padding:'16px 0 0',margin:0}}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Saving...' : isEdit ? '✓ Save Changes' : '+ Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
