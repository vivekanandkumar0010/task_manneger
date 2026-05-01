const router = require('express').Router();
const { body } = require('express-validator');
const { signup, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
], signup);

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], login);

router.get('/me', authenticate, me);

module.exports = router;
