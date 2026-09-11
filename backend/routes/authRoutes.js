const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');
const { authLimiter, registerLimiter } = require('../middleware/rateLimit');

// POST /api/auth/register
router.post('/register', registerLimiter, authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, authController.login);

// GET /api/auth/me
router.get('/me', auth, authController.me);

module.exports = router;
