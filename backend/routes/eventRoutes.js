const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { permit } = require('../middleware/roleMiddleware');
const upload = require('../utils/upload');
const eventController = require('../controllers/eventController');

// GET /api/events/meta/categories - the allowed category values
router.get('/meta/categories', eventController.getCategories);

// GET /api/events - every participant sees all events (filterable)
router.get('/', auth, eventController.listEvents);

// POST /api/events/create - organisers only
router.post(
  '/create',
  auth,
  permit('organizer'),
  upload.eventUpload,
  eventController.createEvent
);

// GET /api/events/:id
router.get('/:id', auth, eventController.getEvent);

// PUT /api/events/:id - organiser, and only their own event
router.put(
  '/:id',
  auth,
  permit('organizer'),
  upload.eventUpload,
  eventController.updateEvent
);

// DELETE /api/events/:id/delete - organiser, and only their own event
router.delete('/:id/delete', auth, permit('organizer'), eventController.deleteEvent);

// POST /api/events/:id/register
router.post('/:id/register', auth, eventController.registerForEvent);

// GET /api/events/:id/participants - the event's organiser only
router.get('/:id/participants', auth, permit('organizer'), eventController.listParticipants);

module.exports = router;
