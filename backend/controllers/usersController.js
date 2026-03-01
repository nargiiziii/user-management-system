import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { logActivity } from '../utils/activityLogger.js';

const BASE_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.status, u.position, u.phone, u.bio,
         u.avatar_color, u.last_login, u.login_count, u.created_at, u.updated_at,
         u.department_id, d.name AS department_name, d.color AS department_color
  FROM users u
  LEFT JOIN departments d ON u.department_id = d.id
`;

export const getUsers = async (req, res, next) => {
  try {
    const { search='', role='', status='', department='', sort='created_at', order='desc', page=1, limit=20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (search) { params.push(`%${search}%`); conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.position ILIKE $${params.length})`); }
    if (role)       { params.push(role);       conditions.push(`u.role=$${params.length}`); }
    if (status)     { params.push(status);     conditions.push(`u.status=$${params.length}`); }
    if (department) { params.push(parseInt(department)); conditions.push(`u.department_id=$${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowedSorts = ['name','email','role','status','created_at','last_login','login_count'];
    const sortCol = allowedSorts.includes(sort) ? `u.${sort}` : 'u.created_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const countResult = await query(`SELECT COUNT(*) FROM users u ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(offset);
    const { rows } = await query(
      `${BASE_SELECT} ${where} ORDER BY ${sortCol} ${sortDir} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ users: rows, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

export const getUserById = async (req, res, next) => {
  try {
    const { rows } = await query(`${BASE_SELECT} WHERE u.id=$1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role='user', status='active', department_id, position, phone, bio, avatar_color } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (name,email,password,role,status,department_id,position,phone,bio,avatar_color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,name,email,role,status,position,avatar_color`,
      [name, email, hashed, role, status, department_id||null, position||null, phone||null, bio||null, avatar_color||'#6366f1']
    );
    await logActivity(req.user.id, 'user.created', 'user', rows[0].id, { name, email, role }, req.ip);
    await query(`INSERT INTO notifications (user_id,title,message,type) VALUES ($1,'Account created','Your account was created by an administrator.','info')`, [rows[0].id]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, status, department_id, position, phone, bio, avatar_color, password } = req.body;
    const fields = [];
    const params = [];

    if (name)          { params.push(name);          fields.push(`name=$${params.length}`); }
    if (email)         { params.push(email);         fields.push(`email=$${params.length}`); }
    if (role)          { params.push(role);          fields.push(`role=$${params.length}`); }
    if (status)        { params.push(status);        fields.push(`status=$${params.length}`); }
    if (department_id !== undefined) { params.push(department_id||null); fields.push(`department_id=$${params.length}`); }
    if (position !== undefined) { params.push(position); fields.push(`position=$${params.length}`); }
    if (phone !== undefined)    { params.push(phone);    fields.push(`phone=$${params.length}`); }
    if (bio !== undefined)      { params.push(bio);      fields.push(`bio=$${params.length}`); }
    if (avatar_color)  { params.push(avatar_color);  fields.push(`avatar_color=$${params.length}`); }
    if (password)      { params.push(await bcrypt.hash(password, 10)); fields.push(`password=$${params.length}`); }

    if (!fields.length) return res.status(400).json({ message: 'No fields to update' });
    fields.push(`updated_at=NOW()`);
    params.push(req.params.id);

    const { rows } = await query(
      `UPDATE users SET ${fields.join(',')} WHERE id=$${params.length} RETURNING id,name,email,role,status,position,avatar_color,department_id`,
      params
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    await logActivity(req.user.id, 'user.updated', 'user', rows[0].id, { fields: Object.keys(req.body) }, req.ip);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ message: 'Cannot delete your own account' });
    const { rows } = await query(`DELETE FROM users WHERE id=$1 RETURNING id,name`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    await logActivity(req.user.id, 'user.deleted', 'user', parseInt(req.params.id), { name: rows[0].name }, req.ip);
    res.json({ message: 'User deleted successfully' });
  } catch (err) { next(err); }
};

export const bulkAction = async (req, res, next) => {
  try {
    const { ids, action } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'No user IDs provided' });
    const safeIds = ids.filter(id => id !== req.user.id);
    if (!safeIds.length) return res.status(400).json({ message: 'Cannot perform bulk action on your own account' });

    if (action === 'delete') {
      await query(`DELETE FROM users WHERE id=ANY($1)`, [safeIds]);
    } else if (['activate','deactivate','ban'].includes(action)) {
      const statusMap = { activate: 'active', deactivate: 'inactive', ban: 'banned' };
      await query(`UPDATE users SET status=$1, updated_at=NOW() WHERE id=ANY($2)`, [statusMap[action], safeIds]);
    } else {
      return res.status(400).json({ message: 'Invalid bulk action' });
    }
    await logActivity(req.user.id, `bulk.${action}`, 'user', null, { ids: safeIds, count: safeIds.length }, req.ip);
    res.json({ message: `Bulk ${action} applied to ${safeIds.length} users` });
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, position, avatar_color } = req.body;
    const { rows } = await query(
      `UPDATE users SET name=$1,phone=$2,bio=$3,position=$4,avatar_color=$5,updated_at=NOW() WHERE id=$6
       RETURNING id,name,email,role,status,position,phone,bio,avatar_color,department_id`,
      [name, phone||null, bio||null, position||null, avatar_color||'#6366f1', req.user.id]
    );
    await logActivity(req.user.id, 'user.profile_updated', 'user', req.user.id, {}, req.ip);
    res.json(rows[0]);
  } catch (err) { next(err); }
};
