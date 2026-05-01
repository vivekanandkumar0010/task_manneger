const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.userId]);
    if (!rows[0]) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireProjectRole = (roles) => async (req, res, next) => {
  const projectId = req.params.projectId || req.body.project_id;
  const { rows } = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, req.user.id]
  );
  if (!rows[0]) return res.status(403).json({ error: 'Not a project member' });
  if (roles && !roles.includes(rows[0].role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  req.projectRole = rows[0].role;
  next();
};

module.exports = { authenticate, requireProjectRole };
