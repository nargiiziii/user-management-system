import { query } from '../config/database.js';

export const getStats = async (req, res, next) => {
  try {
    const [users, tasks, activity, depts, roleBreakdown, statusBreakdown, recentUsers, tasksByStatus, loginTrend] = await Promise.all([
      query(`SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE status='active')   AS active,
               COUNT(*) FILTER (WHERE status='inactive') AS inactive,
               COUNT(*) FILTER (WHERE status='banned')   AS banned,
               COUNT(*) FILTER (WHERE created_at > NOW()-INTERVAL '30 days') AS new_this_month
             FROM users`),
      query(`SELECT COUNT(*) as total,
               COUNT(*) FILTER (WHERE status='todo')        AS todo,
               COUNT(*) FILTER (WHERE status='in_progress') AS in_progress,
               COUNT(*) FILTER (WHERE status='review')      AS review,
               COUNT(*) FILTER (WHERE status='done')        AS done,
               COUNT(*) FILTER (WHERE priority='critical' AND status!='done') AS overdue_critical
             FROM tasks`),
      query(`SELECT COUNT(*) as total FROM activity_log WHERE created_at > NOW()-INTERVAL '24 hours'`),
      query(`SELECT d.id, d.name, d.color, COUNT(u.id) as user_count
             FROM departments d LEFT JOIN users u ON u.department_id=d.id
             GROUP BY d.id ORDER BY user_count DESC`),
      query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`),
      query(`SELECT status, COUNT(*) as count FROM users GROUP BY status`),
      query(`SELECT id,name,email,role,status,avatar_color,created_at FROM users ORDER BY created_at DESC LIMIT 5`),
      query(`SELECT status, COUNT(*) as count FROM tasks GROUP BY status`),
      query(`SELECT DATE(created_at) as date, COUNT(*) as logins
             FROM activity_log WHERE action='user.login' AND created_at > NOW()-INTERVAL '14 days'
             GROUP BY DATE(created_at) ORDER BY date ASC`),
    ]);

    res.json({
      users:         users.rows[0],
      tasks:         tasks.rows[0],
      activityToday: activity.rows[0].total,
      departments:   depts.rows,
      roleBreakdown: roleBreakdown.rows,
      statusBreakdown: statusBreakdown.rows,
      recentUsers:   recentUsers.rows,
      tasksByStatus: tasksByStatus.rows,
      loginTrend:    loginTrend.rows,
    });
  } catch (err) { next(err); }
};

export const getActivityLog = async (req, res, next) => {
  try {
    const { page=1, limit=20, userId } = req.query;
    const offset = (parseInt(page)-1)*parseInt(limit);
    const where = userId ? `WHERE al.user_id=$3` : '';
    const params = userId ? [parseInt(limit), offset, parseInt(userId)] : [parseInt(limit), offset];

    const { rows } = await query(
      `SELECT al.id,al.action,al.entity,al.entity_id,al.details,al.ip_address,al.created_at,
              u.name as user_name, u.avatar_color, u.role as user_role
       FROM activity_log al LEFT JOIN users u ON al.user_id=u.id
       ${where} ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
      params
    );
    const countResult = await query(`SELECT COUNT(*) FROM activity_log ${userId ? 'WHERE user_id=$1' : ''}`, userId ? [parseInt(userId)] : []);
    res.json({ logs: rows, total: parseInt(countResult.rows[0].count), page: parseInt(page) });
  } catch (err) { next(err); }
};
