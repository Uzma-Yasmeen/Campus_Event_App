const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const institutionController = require('../controllers/institutionController');

// GET /api/institutions - public, needed on the sign-up screen
router.get('/', institutionController.getInstitutions);

// POST /api/institutions - any signed-in user may add a missing institution
router.post('/', auth, institutionController.createInstitution);

module.exports = router;
