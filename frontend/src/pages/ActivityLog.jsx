import { useState, useEffect } from 'react'
import api from '../api/axios'
import Avatar from '../components/ui/Avatar'
import { timeAgo, ACTION_LABELS } from '../utils/helpers'

export default function ActivityLog() {
  const [logs, setLogs]   = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)

  const fetch = async (p=1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/dashboard/activity?page=${p}&limit=25`)
      setLogs(data.logs); setTotal(data.total); setPage(p)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const totalPages = Math.ceil(total / 25)

  const actionColor = (action) => {
    if (action.includes('delete')) return 'var(--red)'
    if (action.includes('login'))  return 'var(--green)'
    if (action.includes('create')) return 'var(--accent)'
    if (action.includes('update') || action.includes('profile')) return 'var(--yellow)'
    return 'var(--text-muted)'
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div><h1>Activity Log</h1><p>Full audit trail of all platform actions</p></div>
        <div style={{fontSize:13,color:'var(--text-muted)'}}>{total} total events</div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>IP Address</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5}><div className="loading-spinner"><div className="spinner" /></div></td></tr>}
              {!loading && logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <Avatar name={log.user_name||'?'} color={log.avatar_color||'#5b8af5'} size="sm" />
                      <div>
                        <div style={{fontSize:12,fontWeight:500}}>{log.user_name||'System'}</div>
                        <div style={{fontSize:10,color:'var(--text-muted)'}}>{log.user_role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{fontSize:12,fontWeight:500,color:actionColor(log.action)}}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td style={{fontSize:12,color:'var(--text-secondary)',fontFamily:'var(--mono)'}}>
                    {log.entity}{log.entity_id ? `#${log.entity_id}` : ''}
                  </td>
                  <td style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--text-muted)'}}>{log.ip_address||'—'}</td>
                  <td style={{fontSize:12,color:'var(--text-muted)',whiteSpace:'nowrap'}} title={new Date(log.created_at).toLocaleString()}>
                    {timeAgo(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Page {page} of {totalPages} ({total} events)</span>
          <div className="pagination-btns">
            <button className="page-btn" disabled={page<=1} onClick={() => fetch(page-1)}>‹</button>
            {Array.from({length: Math.min(5, totalPages)}, (_,i)=>i+1).map(p => (
              <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => fetch(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page>=totalPages} onClick={() => fetch(page+1)}>›</button>
          </div>
        </div>
      </div>
    </div>
  )
}
