const { pool } = require('../config/db');

const getTasks = async (req, res) => {
  const { status, assigned_to, priority } = req.query;
  try {
    let query = `
      SELECT t.*, u.name AS assigned_name, c.name AS created_by_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN users c ON c.id = t.created_by
      WHERE t.project_id = $1
    `;
    const params = [req.params.projectId];
    if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }
    if (assigned_to) { params.push(assigned_to); query += ` AND t.assigned_to = $${params.length}`; }
    if (priority) { params.push(priority); query += ` AND t.priority = $${params.length}`; }
    query += ' ORDER BY t.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const createTask = async (req, res) => {
  const { title, description, assigned_to, status, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, req.params.projectId, assigned_to || null, req.user.id, status || 'todo', priority || 'medium', due_date || null]
    );
    const task = await pool.query(`
      SELECT t.*, u.name AS assigned_name, c.name AS created_by_name
      FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1`, [rows[0].id]);
    res.status(201).json(task.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateTask = async (req, res) => {
  const { title, description, assigned_to, status, priority, due_date } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title), description = COALESCE($2, description),
        assigned_to = COALESCE($3, assigned_to), status = COALESCE($4, status),
        priority = COALESCE($5, priority), due_date = COALESCE($6, due_date)
       WHERE id = $7 AND project_id = $8 RETURNING *`,
      [title, description, assigned_to, status, priority, due_date, req.params.taskId, req.params.projectId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    const task = await pool.query(`
      SELECT t.*, u.name AS assigned_name, c.name AS created_by_name
      FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to LEFT JOIN users c ON c.id = t.created_by
      WHERE t.id = $1`, [rows[0].id]);
    res.json(task.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteTask = async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM tasks WHERE id = $1 AND project_id = $2 RETURNING id', [req.params.taskId, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const [myTasks, overdue, projectStats] = await Promise.all([
      pool.query(`
        SELECT t.*, p.name AS project_name
        FROM tasks t JOIN projects p ON p.id = t.project_id
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
        WHERE t.status != 'done' ORDER BY t.due_date ASC NULLS LAST LIMIT 10
      `, [userId]),
      pool.query(`
        SELECT COUNT(*) FROM tasks t
        JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = $1
        WHERE t.status != 'done' AND t.due_date < NOW()
      `, [userId]),
      pool.query(`
        SELECT p.id, p.name,
          COUNT(t.id) AS total,
          COUNT(CASE WHEN t.status = 'done' THEN 1 END) AS done,
          COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS in_progress,
          COUNT(CASE WHEN t.status = 'todo' THEN 1 END) AS todo
        FROM projects p
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id ORDER BY p.created_at DESC
      `, [userId])
    ]);
    res.json({
      myTasks: myTasks.rows,
      overdueCount: parseInt(overdue.rows[0].count),
      projectStats: projectStats.rows
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getDashboard };
