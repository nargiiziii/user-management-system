import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import UserModal from '../components/modals/UserModal'
import { formatDate, AVATAR_COLORS } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Users() {
  const { user: me } = useAuth()
  const navigate = useNavigate()

  const [data, setData]       = useState({ users:[], total:0, totalPages:1 })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [modal, setModal]     = useState(null) // {type:'add'|'edit'|'delete'|'bulk', payload?}
  const [depts, setDepts]     = useState([])

  const [filters, setFilters] = useState({ search:'', role:'', status:'', department:'', sort:'created_at', order:'desc', page:1, limit:15 })

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v])=>v!=='')))
      const res = await api.get(`/users?${params}`)
      setData(res.data)
    } catch {} finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { api.get('/departments').then(r => setDepts(r.data)).catch(()=>{}) }, [])

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: key === 'page' ? val : 1 }))

  const toggleSelect = (id) => {
    const s = new Set(selected)
    s.has(id) ? s.delete(id) : s.add(id)
    setSelected(s)
  }
  const toggleAll = () => setSelected(selected.size === data.users.length ? new Set() : new Set(data.users.map(u=>u.id)))

  const sortBy = (col) => {
    if (filters.sort === col) setFilter('order', filters.order==='asc'?'desc':'asc')
    else setFilters(f=>({...f, sort:col, order:'desc'}))
  }
  const sortIcon = (col) => filters.sort===col ? (filters.order==='asc'?'↑':'↓') : ''

  const handleSaveUser = async (payload, userId) => {
    if (userId) await api.put(`/users/${userId}`, payload)
    else        await api.post('/users', payload)
    setModal(null); fetch()
  }

  const handleDelete = async (id) => {
    await api.delete(`/users/${id}`)
    setModal(null); fetch()
  }

  const handleBulk = async (action) => {
    await api.post('/users/bulk', { ids: [...selected], action })
    setSelected(new Set()); setModal(null); fetch()
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage accounts, roles and access control</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({type:'add'})}>+ Add User</button>
      </div>

      {/* Filters toolbar */}
      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input placeholder="Search by name, email, position..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)} />
        </div>
        <select className="filter-select" value={filters.role} onChange={e => setFilter('role', e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>
        <select className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
        <select className="filter-select" value={filters.department} onChange={e => setFilter('department', e.target.value)}>
          <option value="">All Depts</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {filters.search || filters.role || filters.status || filters.department ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters(f=>({...f,search:'',role:'',status:'',department:'',page:1}))}>
            ✕ Clear
          </button>
        ) : null}
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="alert alert-info" style={{marginBottom:12,display:'flex',alignItems:'center',gap:10}}>
          <span style={{flex:1}}>{selected.size} user{selected.size>1?'s':''} selected</span>
          <button className="btn btn-success btn-sm" onClick={() => handleBulk('activate')}>✅ Activate</button>
          <button className="btn btn-ghost btn-sm" onClick={() => handleBulk('deactivate')}>⏸ Deactivate</button>
          <button className="btn btn-danger btn-sm" onClick={() => setModal({type:'bulk', action:'ban'})}>🚫 Ban</button>
          <button className="btn btn-danger btn-sm" onClick={() => setModal({type:'bulk', action:'delete'})}>🗑 Delete</button>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{width:40}}>
                  <input type="checkbox" checked={selected.size === data.users.length && data.users.length > 0} onChange={toggleAll} />
                </th>
                <th onClick={() => sortBy('name')}>User {sortIcon('name')}</th>
                <th onClick={() => sortBy('role')}>Role {sortIcon('role')}</th>
                <th onClick={() => sortBy('status')}>Status {sortIcon('status')}</th>
                <th>Department</th>
                <th>Position</th>
                <th onClick={() => sortBy('login_count')}>Logins {sortIcon('login_count')}</th>
                <th onClick={() => sortBy('last_login')}>Last Active {sortIcon('last_login')}</th>
                <th onClick={() => sortBy('created_at')}>Joined {sortIcon('created_at')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={10} style={{textAlign:'center',padding:'40px',color:'var(--text-muted)'}}>
                  <div style={{display:'flex',justifyContent:'center'}}><div className="spinner"/></div>
                </td></tr>
              )}
              {!loading && !data.users.length && (
                <tr><td colSpan={10}><div className="empty-state"><div className="empty-icon">👥</div><p>No users found</p></div></td></tr>
              )}
              {!loading && data.users.map(u => (
                <tr key={u.id} style={selected.has(u.id) ? {background:'var(--accent-dim)'} : {}}>
                  <td>
                    <input type="checkbox" checked={selected.has(u.id)}
                      onChange={() => toggleSelect(u.id)} onClick={e=>e.stopPropagation()} />
                  </td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}
                         onClick={() => navigate(`/users/${u.id}`)}>
                      <Avatar name={u.name} color={u.avatar_color} size="sm" />
                      <div>
                        <div style={{fontSize:13,fontWeight:500}}>{u.name}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)'}}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge value={u.role} /></td>
                  <td><Badge value={u.status} /></td>
                  <td>
                    {u.department_name ? (
                      <span style={{fontSize:12,display:'flex',alignItems:'center',gap:4}}>
                        <span style={{width:6,height:6,borderRadius:'50%',background:u.department_color,display:'inline-block'}} />
                        {u.department_name}
                      </span>
                    ) : <span style={{color:'var(--text-muted)'}}>—</span>}
                  </td>
                  <td style={{fontSize:12,color:'var(--text-secondary)'}}>{u.position || '—'}</td>
                  <td style={{fontFamily:'var(--mono)',fontSize:12}}>{u.login_count}</td>
                  <td style={{fontSize:12,color:'var(--text-muted)'}}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}</td>
                  <td style={{fontSize:12,color:'var(--text-muted)'}}>{formatDate(u.created_at)}</td>
                  <td>
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-ghost btn-icon btn-sm" data-tip="Edit" onClick={() => setModal({type:'edit',payload:u})}>✏️</button>
                      {u.id !== me.id && (
                        <button className="btn btn-danger btn-icon btn-sm" data-tip="Delete" onClick={() => setModal({type:'delete',payload:u})}>🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span>Showing {((filters.page-1)*filters.limit)+1}–{Math.min(filters.page*filters.limit, data.total)} of {data.total} users</span>
          <div className="pagination-btns">
            <button className="page-btn" disabled={filters.page<=1} onClick={() => setFilter('page', filters.page-1)}>‹</button>
            {Array.from({length: Math.min(5, data.totalPages)}, (_,i) => {
              const p = Math.max(1, Math.min(data.totalPages-4, filters.page-2)) + i
              return p <= data.totalPages ? (
                <button key={p} className={`page-btn ${p===filters.page?'active':''}`} onClick={() => setFilter('page', p)}>{p}</button>
              ) : null
            })}
            <button className="page-btn" disabled={filters.page>=data.totalPages} onClick={() => setFilter('page', filters.page+1)}>›</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <UserModal
          user={modal.payload}
          departments={depts}
          onSave={handleSaveUser}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'delete' && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${modal.payload.name}"? This cannot be undone.`}
          onConfirm={() => handleDelete(modal.payload.id)}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === 'bulk' && (
        <ConfirmModal
          title={`Bulk ${modal.action}`}
          message={`Apply "${modal.action}" to ${selected.size} selected users?`}
          onConfirm={() => handleBulk(modal.action)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
