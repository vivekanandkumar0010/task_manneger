const router = require('express').Router();
const { authenticate, requireProjectRole } = require('../middleware/auth');
const {
  getProjects, createProject, getProject, updateProject, deleteProject,
  getMembers, addMember, removeMember
} = require('../controllers/projectController');

router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:projectId', requireProjectRole(), getProject);
router.put('/:projectId', requireProjectRole(['admin']), updateProject);
router.delete('/:projectId', requireProjectRole(['admin']), deleteProject);

router.get('/:projectId/members', requireProjectRole(), getMembers);
router.post('/:projectId/members', requireProjectRole(['admin']), addMember);
router.delete('/:projectId/members/:userId', requireProjectRole(['admin']), removeMember);

module.exports = router;
