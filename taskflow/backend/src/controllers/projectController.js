const { pool } = require('../config/db');

const getProjects = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.name AS owner_name, pm.role AS my_role,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count
      FROM projects p
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
      JOIN users u ON u.id = p.owner_id
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const createProject = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [rows[0].id, req.user.id, 'admin']
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally { client.release(); }
};

const getProject = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, u.name AS owner_name, pm.role AS my_role
      FROM projects p
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
      JOIN users u ON u.id = p.owner_id
      WHERE p.id = $2
    `, [req.user.id, req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateProject = async (req, res) => {
  const { name, description } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
      [name, description, req.params.projectId]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteProject = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [req.params.projectId]);
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    if (rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can delete' });
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.projectId]);
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const getMembers = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, pm.role, pm.joined_at
      FROM project_members pm JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1 ORDER BY pm.role DESC, u.name
    `, [req.params.projectId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const addMember = async (req, res) => {
  const { email, role = 'member' } = req.body;
  try {
    const user = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3',
      [req.params.projectId, user.rows[0].id, role]
    );
    res.json({ ...user.rows[0], role });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

const removeMember = async (req, res) => {
  try {
    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.projectId, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject, getMembers, addMember, removeMember };
