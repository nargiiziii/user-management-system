import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { logActivity } from '../utils/activityLogger.js';

const signAccess = (user) =>
  jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    process.env.JWT_SECRET, { expiresIn: '8h' });

const signRefresh = (user) =>
  jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });

const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status,
  avatar_color: u.avatar_color, position: u.position, department_id: u.department_id });

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING id,name,email,role,status,avatar_color,position`,
      [name, email, hashed]
    );
    const user = rows[0];
    const token = signAccess(user);
    await query(`INSERT INTO notifications (user_id,title,message,type) VALUES ($1,'Welcome to UMS Pro!','Your account is ready. Explore the platform!','success')`, [user.id]);
    await logActivity(user.id, 'user.registered', 'user', user.id, { email }, req.ip);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query(
      `SELECT u.*, d.name as dept_name FROM users u LEFT JOIN departments d ON u.department_id=d.id WHERE u.email=$1`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    if (user.status === 'banned') return res.status(403).json({ message: 'Account suspended. Contact administrator.' });
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ message: 'Invalid credentials' });

    await query(`UPDATE users SET last_login=NOW(), login_count=login_count+1 WHERE id=$1`, [user.id]);
    const token = signAccess(user);
    const refreshToken = signRefresh(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(`INSERT INTO refresh_tokens (user_id,token,expires_at) VALUES ($1,$2,$3)`, [user.id, refreshToken, expiresAt]);
    await logActivity(user.id, 'user.login', 'user', user.id, { email }, req.ip);
    res.json({ token, refreshToken, user: safeUser(user) });
  } catch (err) { next(err); }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const { rows } = await query(`SELECT * FROM refresh_tokens WHERE token=$1 AND expires_at>NOW()`, [refreshToken]);
    if (!rows.length) return res.status(401).json({ message: 'Refresh token invalid or expired' });
    const { rows: userRows } = await query(`SELECT * FROM users WHERE id=$1`, [payload.id]);
    if (!userRows.length) return res.status(401).json({ message: 'User not found' });
    const token = signAccess(userRows[0]);
    res.json({ token });
  } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await query(`DELETE FROM refresh_tokens WHERE token=$1`, [refreshToken]);
    await logActivity(req.user.id, 'user.logout', 'user', req.user.id, {}, req.ip);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id,u.name,u.email,u.role,u.status,u.bio,u.phone,u.position,u.avatar_color,
              u.last_login,u.login_count,u.created_at,u.department_id,d.name as department_name
       FROM users u LEFT JOIN departments d ON u.department_id=d.id WHERE u.id=$1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await query(`SELECT password FROM users WHERE id=$1`, [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    if (!await bcrypt.compare(currentPassword, rows[0].password))
      return res.status(400).json({ message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2`, [hashed, req.user.id]);
    await logActivity(req.user.id, 'user.password_changed', 'user', req.user.id, {}, req.ip);
    res.json({ message: 'Password changed successfully' });
  } catch (err) { next(err); }
};
