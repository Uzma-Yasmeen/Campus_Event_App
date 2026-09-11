const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { permit } = require('../middleware/roleMiddleware');
const upload = require('../utils/upload');
const userController = require('../controllers/userController');

// GET /users/profile
router.get('/profile', auth, userController.getProfile);

// PUT /users/profile/update
router.put('/profile/update', auth, userController.updateProfile);

// PUT /users/change-password
router.put('/change-password', auth, userController.changePassword);

// PUT /users/settings
router.put('/settings', auth, userController.updateSettings);

// POST /users/avatar (upload avatar) - optional
router.post('/avatar', auth, upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
