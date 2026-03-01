import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import { formatDate, timeAgo, ACTION_LABELS } from '../utils/helpers'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isPriv = user?.role === 'admin' || user?.role === 'manager'
    if (!isPriv) { setLoading(false); return }
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/activity?limit=8'),
    ]).then(([s, a]) => {
      setStats(s.data)
      setActivity(a.data.logs)
    }).finally(() => setLoading(false))
  }, [user])

  if (user?.role === 'user') return <UserDashboard user={user} />
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>
  if (!stats)  return null

  const COLORS = ['#5b8af5','#f5c542','#22d3ee','#3dd68c']

  const pieData = stats.roleBreakdown.map(r => ({
    name: r.role, value: parseInt(r.count)
  }))

  const tasksPie = [
    { name: 'Todo',        value: parseInt(stats.tasks.todo || 0),        fill:'#4a5568' },
    { name: 'In Progress', value: parseInt(stats.tasks.in_progress || 0), fill:'#f5c542' },
    { name: 'Review',      value: parseInt(stats.tasks.review || 0),      fill:'#22d3ee' },
    { name: 'Done',        value: parseInt(stats.tasks.done || 0),        fill:'#3dd68c' },
  ]

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name} 👋  —  {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card blue" onClick={() => navigate('/users')} style={{cursor:'pointer'}}>
          <div className="stat-icon blue">👥</div>
          <div className="stat-value">{stats.users.total}</div>
          <div className="stat-label">Total Users</div>
          <div className="stat-sub">+{stats.users.new_this_month} this month</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">✅</div>
          <div className="stat-value">{stats.users.active}</div>
          <div className="stat-label">Active Users</div>
          <div className="stat-sub">{stats.users.banned} banned</div>
        </div>
        <div className="stat-card yellow" onClick={() => navigate('/tasks')} style={{cursor:'pointer'}}>
          <div className="stat-icon yellow">☑</div>
          <div className="stat-value">{stats.tasks.total}</div>
          <div className="stat-label">Total Tasks</div>
          <div className="stat-sub">{stats.tasks.done} completed</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red">🚨</div>
          <div className="stat-value">{stats.tasks.overdue_critical}</div>
          <div className="stat-label">Critical Open</div>
          <div className="stat-sub">Need attention</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple">⚡</div>
          <div className="stat-value">{stats.activityToday}</div>
          <div className="stat-label">Actions Today</div>
          <div className="stat-sub">Audit events</div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20}}>
        {/* Login trend */}
        <div className="card" style={{gridColumn:'span 2'}}>
          <div className="card-header"><h3>📈 Login Activity (14 days)</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={stats.loginTrend}>
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#5b8af5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5b8af5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{fill:'#4a5568',fontSize:10}} tickLine={false} axisLine={false}
                  tickFormatter={d => new Date(d).toLocaleDateString('en',{month:'short',day:'numeric'})} />
                <YAxis tick={{fill:'#4a5568',fontSize:10}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{background:'#161b25',border:'1px solid #1e2535',borderRadius:8,fontSize:12}} />
                <Area type="monotone" dataKey="logins" stroke="#5b8af5" fill="url(#lg)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Roles pie */}
        <div className="card">
          <div className="card-header"><h3>👥 User Roles</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{background:'#161b25',border:'1px solid #1e2535',borderRadius:8,fontSize:12}} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center',marginTop:4}}>
              {pieData.map((d, i) => (
                <span key={d.name} style={{fontSize:11,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}>
                  <span style={{width:8,height:8,borderRadius:2,background:COLORS[i],display:'inline-block'}} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20}}>
        {/* Tasks bar */}
        <div className="card">
          <div className="card-header"><h3>☑ Tasks by Status</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={tasksPie} barSize={28}>
                <XAxis dataKey="name" tick={{fill:'#4a5568',fontSize:10}} tickLine={false} axisLine={false} />
                <YAxis tick={{fill:'#4a5568',fontSize:10}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{background:'#161b25',border:'1px solid #1e2535',borderRadius:8,fontSize:12}} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {tasksPie.map((d,i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Departments */}
        <div className="card">
          <div className="card-header"><h3>🏢 Departments</h3></div>
          <div className="card-body" style={{display:'flex',flexDirection:'column',gap:8}}>
            {stats.departments.map(d => (
              <div key={d.id} style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}} />
                <span style={{flex:1,fontSize:13}}>{d.name}</span>
                <span style={{fontSize:12,color:'var(--text-muted)',fontFamily:'var(--mono)'}}>{d.user_count}</span>
                <div style={{width:80,height:4,background:'var(--bg-hover)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{width:`${Math.min(100,(d.user_count/Math.max(...stats.departments.map(x=>x.user_count)))*100)}%`,height:'100%',background:d.color,borderRadius:2}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        {/* Recent users */}
        <div className="card">
          <div className="card-header">
            <h3>✨ Recent Users</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/users')}>View all →</button>
          </div>
          <div className="card-body" style={{padding:0}}>
            {stats.recentUsers.map(u => (
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:'1px solid var(--border)'}}
                   className="cursor-pointer" onClick={() => navigate(`/users/${u.id}`)}>
                <Avatar name={u.name} color={u.avatar_color} size="sm" />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{u.name}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{u.email}</div>
                </div>
                <Badge value={u.role} />
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="card">
          <div className="card-header">
            <h3>📋 Recent Activity</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/activity')}>View all →</button>
          </div>
          <div className="card-body" style={{padding:'8px 20px'}}>
            {activity.map(log => (
              <div key={log.id} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-text">
                  <strong>{log.user_name || 'System'}</strong>{' '}
                  <span style={{color:'var(--text-secondary)'}}>{ACTION_LABELS[log.action] || log.action}</span>
                  <div className="activity-time">{timeAgo(log.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserDashboard({ user }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    api.get('/tasks').then(r => setTasks(r.data.slice(0, 5))).catch(() => {})
  }, [])

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Hello, {user.name} 👋</h1>
          <p>Here's your workspace overview</p>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue">☑</div>
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">My Tasks</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">✅</div>
          <div className="stat-value">{tasks.filter(t=>t.status==='done').length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon yellow">🔄</div>
          <div className="stat-value">{tasks.filter(t=>t.status==='in_progress').length}</div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>My Recent Tasks</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>View all</button>
        </div>
        <div className="card-body" style={{padding:0}}>
          {!tasks.length && <div className="empty-state"><div className="empty-icon">☑</div><p>No tasks yet</p></div>}
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
    </div>
  )
}
