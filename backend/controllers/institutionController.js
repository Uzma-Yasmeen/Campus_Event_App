const Institution = require('../models/Institution');

// Escape user input before using it inside a regular expression.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Find an institution by name (case-insensitive), creating it if absent. */
async function findOrCreateByName(rawName) {
  const name = String(rawName || '').trim();
  if (!name) return null;

  const existing = await Institution.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i')
  });
  if (existing) return existing;

  return Institution.create({ name });
}

// GET /api/institutions
exports.getInstitutions = async (req, res) => {
  try {
    const list = await Institution.find().sort({ name: 1 }).lean();
    res.json(list);
  } catch (err) {
    console.error('Get institutions error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/institutions
exports.createInstitution = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const code = String(req.body.code || '').trim();

    if (name.length < 2) {
      return res.status(400).json({ message: 'Institution name must be at least 2 characters' });
    }
    if (name.length > 120) {
      return res.status(400).json({ message: 'Institution name is too long' });
    }

    const existing = await Institution.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, 'i')
    });
    if (existing) {
      return res.status(409).json({ message: 'That institution is already listed', institution: existing });
    }

    const institution = await Institution.create({ name, code: code || undefined });
    res.status(201).json(institution);
  } catch (err) {
    console.error('Create institution error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.findOrCreateByName = findOrCreateByName;
