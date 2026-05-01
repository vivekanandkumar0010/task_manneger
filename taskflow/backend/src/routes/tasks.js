const router = require('express').Router({ mergeParams: true });
const { authenticate, requireProjectRole } = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(authenticate);
router.use(requireProjectRole());

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', requireProjectRole(['admin']), deleteTask);

module.exports = router;
