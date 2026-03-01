import { query } from '../config/database.js';
import { logActivity } from '../utils/activityLogger.js';

const BASE = `SELECT t.*, u1.name as assigned_name, u1.avatar_color as assigned_color,
              u2.name as created_by_name FROM tasks t
              LEFT JOIN users u1 ON t.assigned_to=u1.id LEFT JOIN users u2 ON t.created_by=u2.id`;

export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assigned_to, search, page=1, limit=50 } = req.query;
    const conds = []; const params = [];
    if (status)      { params.push(status);      conds.push(`t.status=$${params.length}`); }
    if (priority)    { params.push(priority);    conds.push(`t.priority=$${params.length}`); }
    if (assigned_to) { params.push(parseInt(assigned_to)); conds.push(`t.assigned_to=$${params.length}`); }
    if (search)      { params.push(`%${search}%`); conds.push(`t.title ILIKE $${params.length}`); }
    if (req.user.role === 'user') { params.push(req.user.id); conds.push(`(t.assigned_to=$${params.length} OR t.created_by=$${params.length})`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const offset = (parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit)); params.push(offset);
    const { rows } = await query(`${BASE} ${where} ORDER BY t.created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params);
    res.json(rows);
  } catch (err) { next(err); }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, status='todo', priority='medium', assigned_to, due_date } = req.body;
    const { rows } = await query(
      `INSERT INTO tasks (title,description,status,priority,assigned_to,created_by,due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description||null, status, priority, assigned_to||null, req.user.id, due_date||null]
    );
    if (assigned_to && assigned_to !== req.user.id) {
      await query(`INSERT INTO notifications (user_id,title,message,type,link)
                   VALUES ($1,'New task assigned',$2,'info','/tasks')`,
        [assigned_to, `"${title}" has been assigned to you`]);
    }
    await logActivity(req.user.id, 'task.created', 'task', rows[0].id, { title }, req.ip);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

export const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    const { rows } = await query(
      `UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description),
       status=COALESCE($3,status), priority=COALESCE($4,priority),
       assigned_to=COALESCE($5,assigned_to), due_date=COALESCE($6,due_date), updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title, description, status, priority, assigned_to, due_date, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });
    await logActivity(req.user.id, 'task.updated', 'task', rows[0].id, { status }, req.ip);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { rows } = await query(`DELETE FROM tasks WHERE id=$1 RETURNING id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Task not found' });
    await logActivity(req.user.id, 'task.deleted', 'task', parseInt(req.params.id), {}, req.ip);
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
};
