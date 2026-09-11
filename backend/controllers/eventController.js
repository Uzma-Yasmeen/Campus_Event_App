const Event = require('../models/Event');
const { generateQr, removeQr, isValidUrl, eventSummary } = require('../utils/qr');

const CATEGORIES = Event.CATEGORIES;

/** Pull the first uploaded file for a given field name. */
function fileFor(req, field) {
  if (!req.files || !req.files[field] || !req.files[field][0]) return null;
  return req.files[field][0];
}

/**
 * Give the event a QR code.
 *
 * An organiser who already has a QR code can upload it, and that always wins.
 * Otherwise, if a registration link was supplied, render a QR for it.
 */
async function applyQr(event, req) {
  const uploaded = fileFor(req, 'qrImage');

  if (uploaded) {
    removeQr(event._id); // drop any previously generated file
    event.qrImage = `/uploads/qr-uploads/${uploaded.filename}`;
    event.qrSource = 'uploaded';
    return;
  }

  // Keep an existing uploaded code unless the organiser changes the link.
  if (event.qrSource === 'uploaded' && !req.body.registrationUrl) return;

  // Every event carries a QR code: the registration link when there is one,
  // otherwise the event's own details so a scan still shows something useful.
  const payload = (event.registrationUrl && isValidUrl(event.registrationUrl))
    ? event.registrationUrl
    : eventSummary(event);

  event.qrImage = await generateQr(event._id, payload);
  event.qrSource = 'generated';
}

// GET /api/events
// Optional filters: ?institution=<id>&category=<name>&q=<text>
exports.listEvents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.institution) filter.institution = req.query.institution;
    if (req.query.category) filter.category = req.query.category;

    if (req.query.q) {
      const term = String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(term, 'i');
      filter.$or = [{ title: rx }, { description: rx }, { category: rx }, { location: rx }];
    }

    const events = await Event.find(filter)
      .populate('organizer', 'name email')
      .populate('institution', 'name code')
      .sort({ date: 1 })
      .lean();

    res.json(events);
  } catch (err) {
    console.error('List events error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/events/:id
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('institution', 'name code')
      .lean();

    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error('Get event error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/events/create
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, institution, category, registrationUrl } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }
    if (isNaN(new Date(date))) {
      return res.status(400).json({ message: 'Date is not a valid date' });
    }
    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(', ')}` });
    }
    if (registrationUrl && !isValidUrl(registrationUrl)) {
      return res.status(400).json({ message: 'Registration link must be a valid http(s) URL' });
    }

    const cover = fileFor(req, 'image');

    const event = new Event({
      title,
      description: description || '',
      category: category || 'Other',
      date: new Date(date),
      location: location || '',
      institution: institution || null,
      registrationUrl: registrationUrl ? String(registrationUrl).trim() : '',
      organizer: req.user._id,
      image: cover ? `/uploads/event-images/${cover.filename}` : ''
    });

    await applyQr(event, req);
    await event.save();

    res.status(201).json(await event.populate('organizer', 'name email'));
  } catch (err) {
    console.error('Create event error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // An organiser may only edit the events they created.
    if (String(event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: you did not create this event' });
    }

    const { title, description, date, location, institution, category, registrationUrl } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) return res.status(400).json({ message: 'Title cannot be empty' });
      event.title = String(title).trim();
    }
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;
    if (institution !== undefined) event.institution = institution || null;

    if (date !== undefined) {
      if (isNaN(new Date(date))) return res.status(400).json({ message: 'Date is not a valid date' });
      event.date = new Date(date);
    }
    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({ message: `Category must be one of: ${CATEGORIES.join(', ')}` });
      }
      event.category = category;
    }
    if (registrationUrl !== undefined) {
      if (registrationUrl && !isValidUrl(registrationUrl)) {
        return res.status(400).json({ message: 'Registration link must be a valid http(s) URL' });
      }
      event.registrationUrl = registrationUrl ? String(registrationUrl).trim() : '';
    }

    const cover = fileFor(req, 'image');
    if (cover) event.image = `/uploads/event-images/${cover.filename}`;

    await applyQr(event, req);
    await event.save();

    res.json(await event.populate('organizer', 'name email'));
  } catch (err) {
    console.error('Update event error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/events/:id/delete
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (String(event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: you did not create this event' });
    }

    removeQr(event._id);
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Delete event error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/events/:id/register
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(400).json({ message: 'Already registered' });
    }

    event.participants.push(req.user._id);
    await event.save();
    res.json({ message: 'Registered successfully', participants: event.participants.length });
  } catch (err) {
    console.error('Register event error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/events/:id/participants
exports.listParticipants = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('participants', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (String(event.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden: not event organizer' });
    }

    res.json(event.participants);
  } catch (err) {
    console.error('List participants error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/events/meta/categories
exports.getCategories = (req, res) => res.json(CATEGORIES);
