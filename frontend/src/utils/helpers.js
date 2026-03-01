export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—'

export const ACTION_LABELS = {
  'user.login':            '🔑 Logged in',
  'user.logout':           '🚪 Logged out',
  'user.registered':       '✨ Registered',
  'user.created':          '👤 User created',
  'user.updated':          '✏️  User updated',
  'user.deleted':          '🗑️  User deleted',
  'user.password_changed': '🔒 Password changed',
  'user.profile_updated':  '📝 Profile updated',
  'task.created':          '📋 Task created',
  'task.updated':          '🔄 Task updated',
  'task.deleted':          '🗑️  Task deleted',
  'bulk.delete':           '⚡ Bulk deleted',
  'bulk.activate':         '✅ Bulk activated',
  'bulk.ban':              '🚫 Bulk banned',
}

export const AVATAR_COLORS = [
  '#5b8af5','#a78bfa','#3dd68c','#f5c542',
  '#f56565','#22d3ee','#fb923c','#ec4899',
]

export const priorityOrder = { critical:0, high:1, medium:2, low:3 }
