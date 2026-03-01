import { query } from '../config/database.js';

export const logActivity = async (userId, action, entity = null, entityId = null, details = {}, ip = null) => {
  try {
    await query(
      `INSERT INTO activity_log (user_id, action, entity, entity_id, details, ip_address) VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, action, entity, entityId, JSON.stringify(details), ip]
    );
  } catch (e) {
    // Non-critical — don't crash the request
    console.error('Activity log failed:', e.message);
  }
};
