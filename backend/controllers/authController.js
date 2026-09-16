const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { findOrCreateByName } = require('./institutionController');

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  institution: user.institution,
  avatar: user.avatar,
  theme: user.theme
});

/** Resolve the institution reference so clients can show its name. */
const withInstitution = (user) => user.populate('institution', 'name code');

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, institution, institutionName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (role && !['student', 'organizer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be student or organizer' });
    }
    // Events are scoped per campus, so an account without an institution would
    // have nothing to see. Require one up front rather than stranding the user.
    if (!institution && !institutionName) {
      return res.status(400).json({ message: 'Choose your institution, or add it if it is not listed' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

    // A new user may name an institution that is not listed yet; create it on demand
    // so sign-up is never blocked by a missing directory entry.
    let institutionId = institution || null;
    if (!institutionId && institutionName) {
      const created = await findOrCreateByName(institutionName);
      institutionId = created ? created._id : null;
    }
    if (!institutionId) {
      return res.status(400).json({ message: 'That institution could not be resolved' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role || 'student',
      institution: institutionId
    });

    await withInstitution(user);
    res.status(201).json({ token: generateToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('Register error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    await withInstitution(user);
    res.json({ token: generateToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  await withInstitution(req.user);
  res.json({ user: publicUser(req.user) });
};
