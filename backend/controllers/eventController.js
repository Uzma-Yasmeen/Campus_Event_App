const Event = require('../models/Event');
const { generateQr, removeQr, isValidUrl } = require('../utils/qr');

const CATEGORIES = Event.CATEGORIES;

/**
 * Events are scoped to a single campus: you only ever see events belonging to
 * your own institution. Returns null when the user has not set one, in which
 * case there is nothing they are entitled to see.
 */
function scopeOf(req) {
  return req.user.institution ? String(req.user.institution) : null;
}

/**
 * The id of an event's institution, whether or not the query populated it.
 * A populated reference is an object, and String() on one yields
 * "[object Object]", which would never match a scope id.
 */
function institutionIdOf(event) {
  const inst = event && event.institution;
  if (!inst) return null;
  return String(inst._id || inst);
}

/** True when the event belongs to the caller's institution. */
function inScope(event, req) {
  const scope = scopeOf(req);
  return !!scope && institutionIdOf(event) === scope;
}

/** Pull the first uploaded file for a given field name. */
function fileFor(req, field) {
  if (!req.files || !req.files[field] || !req.files[field][0]) return null;
  return req.files[field][0];
}

/**
 * Give the event a QR code, when there is something worth encoding.
 *
 * An organiser who already has a code can upload it, and that always wins.
 * Otherwise a code is rendered for the registration link.
 *
 * With neither, the event gets no QR at all. Encoding the event's details as
 * plain text was tried and removed: a phone camera shows the raw text with
 * nothing to tap, so the code looked functional and did nothing.
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
  if (event.qrSource === 'uploaded' && req.body.registrationUrl === undefined) return;

  if (event.registrationUrl && isValidUrl(event.registrationUrl)) {
    event.qrImage = await generateQr(event._id, event.registrationUrl);
    event.qrSource = 'generated';
    return;
  }

  removeQr(event._id);
  event.qrImage = '';
  event.qrSource = 'none';
}

// GET /api/events
// Optional filters: ?institution=<id>&category=<name>&q=<text>
exports.listEvents = async (req, res) => {
  try {
    // Hard scope to the caller's campus. A user without an institution has
    // nothing in scope, so they get an empty list rather than everyone's events.
    const scope = scopeOf(req);
    if (!scope) return res.json([]);

    const filter = { institution: scope };
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

    if (!event || !inScope(event, req)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error('Get event error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/events/create
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category, registrationUrl } = req.body;

    // The event always belongs to the organiser's own institution; a client
    // cannot publish into a campus it is not part of.
    const scope = scopeOf(req);
    if (!scope) {
      return res.status(400).json({
        message: 'Set your institution in your profile before publishing events'
      });
    }

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
      institution: scope,
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

    const { title, description, date, location, category, registrationUrl } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) return res.status(400).json({ message: 'Title cannot be empty' });
      event.title = String(title).trim();
    }
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;

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
    if (!event || !inScope(event, req)) {
      return res.status(404).json({ message: 'Event not found' });
    }

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
