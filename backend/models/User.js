const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'organizer'], default: 'student' },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
  avatar: { type: String, default: '' },
  notifications: { type: Boolean, default: true },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
