import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import ConfirmModal from '../components/ui/ConfirmModal'
import { formatDate } from '../utils/helpers'

const STATUSES = ['todo','in_progress','review','done']
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', review:'In Review', done:'Done' }
const STATUS_COLORS = { todo:'#4a5568', in_progress:'#f5c542', review:'#22d3ee', done:'#3dd68c' }

export default function Tasks() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'manager'
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [modal, setModal] = useState(null)
  const [filters, setFilters] = useState({ search:'', priority:'', status:'' })

  const fetch = async () => {
    setLoading(true)
    try {
      const [t, u] = await Promise.all([
        api.get('/tasks'),
        isAdmin ? api.get('/users') : Promise.resolve({ data: { users: [] } }),
      ])
      setTasks(t.data)
      setUsers(u.data.users || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const filtered = tasks.filter(t => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.priority && t.priority !== filters.priority) return false
    if (filters.status   && t.status   !== filters.status)   return false
    return true
  })

  const byStatus = (s) => filtered.filter(t => t.status === s)

  const saveTask = async (payload, id) => {
    if (id) await api.put(`/tasks/${id}`, payload)
    else    await api.post('/tasks', payload)
    setModal(null); fetch()
  }

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`)
    setModal(null); fetch()
  }

  const quickStatus = async (task, newStatus) => {
    await api.put(`/tasks/${task.id}`, { status: newStatus })
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Track and manage work across your team</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <div style={{display:'flex',gap:2,background:'var(--bg-hover)',borderRadius:8,padding:3}}>
            {['kanban','list'].map(v => (
              <button key={v} className="btn btn-ghost btn-sm"
                style={view===v?{background:'var(--bg-card)',color:'var(--text-primary)'}:{border:'none'}}
                onClick={() => setView(v)}>
                {v === 'kanban' ? '⬡ Kanban' : '☰ List'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setModal({type:'form'})}>+ New Task</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input placeholder="Search tasks..." value={filters.search} onChange={e => setFilters({...filters,search:e.target.value})} />
        </div>
        <select className="filter-select" value={filters.priority} onChange={e => setFilters({...filters,priority:e.target.value})}>
          <option value="">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {view === 'list' && (
          <select className="filter-select" value={filters.status} onChange={e => setFilters({...filters,status:e.target.value})}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        )}
      </div>

      {loading && <div className="loading-spinner"><div className="spinner" /></div>}

      {!loading && view === 'kanban' && (
        <div className="kanban">
          {STATUSES.map(status => {
            const col = byStatus(status)
            return (
              <div key={status} className="kanban-col">
                <div className="kanban-col-header">
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:8,height:8,borderRadius:2,background:STATUS_COLORS[status]}} />
                    {STATUS_LABELS[status]}
                  </div>
                  <span style={{background:'var(--bg-hover)',color:'var(--text-muted)',padding:'1px 6px',borderRadius:4,fontSize:11}}>{col.length}</span>
                </div>
                <div className="kanban-col-body">
                  {col.map(task => (
                    <div key={task.id} className="kanban-card" onClick={() => setModal({type:'form', payload:task})}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6,marginBottom:6}}>
                        <Badge value={task.priority} />
                        {isAdmin && (
                          <button className="btn btn-danger btn-icon btn-sm" style={{padding:'2px 5px',fontSize:10}}
                            onClick={e => { e.stopPropagation(); setModal({type:'delete',payload:task}) }}>✕</button>
                        )}
                      </div>
                      <h4>{task.title}</h4>
                      {task.description && <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4,lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{task.description}</p>}
                      <div className="kanban-card-meta">
                        <div style={{fontSize:11,color:'var(--text-muted)'}}>
                          {task.due_date && `📅 ${formatDate(task.due_date)}`}
                        </div>
                        {task.assigned_name && (
                          <Avatar name={task.assigned_name} color={task.assigned_color||'#5b8af5'} size="sm" />
                        )}
                      </div>
                      {/* Quick status change */}
                      {status !== 'done' && (
                        <div style={{marginTop:8,display:'flex',gap:4}}>
                          {STATUSES.filter(s=>s!==status).map(s => (
                            <button key={s} className="btn btn-ghost btn-sm"
                              style={{padding:'2px 6px',fontSize:10,flex:1}}
                              onClick={e => { e.stopPropagation(); quickStatus(task, s) }}>
                              → {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {!col.length && (
                    <div style={{padding:'20px',textAlign:'center',color:'var(--text-muted)',fontSize:12,border:'1px dashed var(--border)',borderRadius:8}}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && view === 'list' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!filtered.length && <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">☑</div><p>No tasks found</p></div></td></tr>}
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{fontWeight:500,fontSize:13}}>{t.title}</div>
                      {t.description && <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{t.description.slice(0,60)}…</div>}
                    </td>
                    <td><Badge value={t.status} /></td>
                    <td><Badge value={t.priority} /></td>
                    <td>
                      {t.assigned_name
                        ? <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <Avatar name={t.assigned_name} color={t.assigned_color||'#5b8af5'} size="sm" />
                            <span style={{fontSize:12}}>{t.assigned_name}</span>
                          </div>
                        : <span style={{color:'var(--text-muted)',fontSize:12}}>Unassigned</span>}
                    </td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>{formatDate(t.due_date)}</td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>{formatDate(t.created_at)}</td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal({type:'form',payload:t})}>✏️</button>
                        {isAdmin && <button className="btn btn-danger btn-icon btn-sm" onClick={() => setModal({type:'delete',payload:t})}>🗑</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal?.type === 'form' && (
        <TaskModal task={modal.payload} users={users} onSave={saveTask} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'delete' && (
        <ConfirmModal title="Delete Task" message={`Delete "${modal.payload.title}"?`}
          onConfirm={() => deleteTask(modal.payload.id)} onCancel={() => setModal(null)} />
      )}
    </div>
  )
}

function TaskModal({ task, users=[], onSave, onClose }) {
  const { user: me } = useAuth()
  const isEdit = !!task
  const [form, setForm] = useState({
    title: task?.title||'', description: task?.description||'', status: task?.status||'todo',
    priority: task?.priority||'medium', assigned_to: task?.assigned_to||'', due_date: task?.due_date?.split('T')[0]||''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const p = { ...form }
      if (!p.assigned_to) delete p.assigned_to
      if (!p.due_date) delete p.due_date
      await onSave(p, task?.id)
    } catch (err) { setError(err.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Edit Task' : '+ New Task'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assign To</label>
                <select value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} />
              </div>
            </div>
            <div className="modal-footer" style={{padding:'16px 0 0',margin:0}}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳...' : isEdit ? '✓ Save' : '+ Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
