import { useState, useEffect } from 'react'
import api from '../api/axios'
import ConfirmModal from '../components/ui/ConfirmModal'

const COLORS = ['#5b8af5','#a78bfa','#f5c542','#3dd68c','#f56565','#22d3ee','#fb923c','#ec4899']

export default function Departments() {
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name:'', description:'', color:'#5b8af5' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetch = async () => {
    setLoading(true)
    const { data } = await api.get('/departments')
    setDepts(data); setLoading(false)
  }
  useEffect(() => { fetch() }, [])

  const openAdd = () => { setForm({ name:'', description:'', color:'#5b8af5' }); setModal({type:'form'}) }
  const openEdit = (d) => { setForm({ name:d.name, description:d.description||'', color:d.color }); setModal({type:'form',id:d.id}) }

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (modal.id) await api.put(`/departments/${modal.id}`, form)
      else          await api.post('/departments', form)
      setModal(null); fetch()
    } catch (err) { setError(err.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  const del = async (id) => {
    await api.delete(`/departments/${id}`)
    setModal(null); fetch()
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1>Departments</h1><p>Organize your team by departments</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Department</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16}}>
        {depts.map(d => (
          <div key={d.id} className="card" style={{borderLeft:`3px solid ${d.color}`}}>
            <div className="card-body">
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                <div>
                  <h3 style={{fontSize:16,fontWeight:600}}>{d.name}</h3>
                  {d.description && <p style={{color:'var(--text-secondary)',fontSize:12,marginTop:3}}>{d.description}</p>}
                </div>
                <div style={{display:'flex',gap:4}}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(d)}>✏️</button>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => setModal({type:'delete',payload:d})}>🗑</button>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:12,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                <div style={{width:32,height:32,borderRadius:8,background:d.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏢</div>
                <div>
                  <div style={{fontSize:20,fontWeight:700,color:d.color}}>{d.user_count}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>members</div>
                </div>
                <div style={{flex:1,marginLeft:8}}>
                  <div style={{height:4,background:'var(--bg-hover)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{width:`${Math.min(100,(d.user_count/Math.max(...depts.map(x=>x.user_count||1)))*100)}%`,height:'100%',background:d.color,borderRadius:2}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!depts.length && (
          <div className="empty-state" style={{gridColumn:'1/-1'}}><div className="empty-icon">🏢</div><p>No departments yet</p></div>
        )}
      </div>

      {modal?.type === 'form' && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal" style={{maxWidth:420}}>
            <div className="modal-header">
              <h3>{modal.id ? 'Edit Department' : 'New Department'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={save}>
                <div className="form-group">
                  <label>Department Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Engineering" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <div className="color-picker" style={{marginTop:4}}>
                    {COLORS.map(c => (
                      <div key={c} className={`color-swatch ${form.color===c?'selected':''}`}
                           style={{background:c,width:28,height:28}} onClick={() => setForm({...form,color:c})} />
                    ))}
                  </div>
                </div>
                <div className="modal-footer" style={{padding:'16px 0 0',margin:0}}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'⏳...':'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'delete' && (
        <ConfirmModal title="Delete Department"
          message={`Delete "${modal.payload.name}"? ${modal.payload.user_count > 0 ? `${modal.payload.user_count} users will be unassigned.` : ''}`}
          onConfirm={() => del(modal.payload.id)}
          onCancel={() => setModal(null)} />
      )}
    </div>
  )
}
