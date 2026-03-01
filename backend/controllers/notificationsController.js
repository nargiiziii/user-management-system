import { query } from '../config/database.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const unread = rows.filter(n => !n.is_read).length;
    res.json({ notifications: rows, unread });
  } catch (err) { next(err); }
};

export const markRead = async (req, res, next) => {
  try {
    await query(`UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
};

export const markAllRead = async (req, res, next) => {
  try {
    await query(`UPDATE notifications SET is_read=true WHERE user_id=$1`, [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) { next(err); }
};

export const deleteNotification = async (req, res, next) => {
  try {
    await query(`DELETE FROM notifications WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

export const sendNotification = async (req, res, next) => {
  try {
    const { user_ids, title, message, type='info' } = req.body;
    if (!Array.isArray(user_ids) || !title || !message)
      return res.status(400).json({ message: 'user_ids, title and message required' });
    for (const uid of user_ids) {
      await query(`INSERT INTO notifications (user_id,title,message,type) VALUES ($1,$2,$3,$4)`, [uid, title, message, type]);
    }
    res.status(201).json({ message: `Notification sent to ${user_ids.length} users` });
  } catch (err) { next(err); }
};
