import { query } from '../config/database.js';

export const getDepartments = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT d.*, COUNT(u.id)::int as user_count
      FROM departments d LEFT JOIN users u ON u.department_id=d.id
      GROUP BY d.id ORDER BY d.name ASC
    `);
    res.json(rows);
  } catch (err) { next(err); }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, description, color='#6366f1' } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const { rows } = await query(
      `INSERT INTO departments (name,description,color) VALUES ($1,$2,$3) RETURNING *`,
      [name, description||null, color]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const { rows } = await query(
      `UPDATE departments SET name=COALESCE($1,name), description=COALESCE($2,description), color=COALESCE($3,color)
       WHERE id=$4 RETURNING *`,
      [name, description, color, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Department not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { rows } = await query(`DELETE FROM departments WHERE id=$1 RETURNING id`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) { next(err); }
};
