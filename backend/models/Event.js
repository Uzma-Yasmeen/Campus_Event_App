const mongoose = require('mongoose');

const EVENT_CATEGORIES = [
  'Seminar', 'Workshop', 'Hackathon', 'Cultural', 'Sports', 'Conference', 'Other'
];

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, enum: EVENT_CATEGORIES, default: 'Other' },
  date: { type: Date, required: true },
  location: { type: String, default: '' },
  image: { type: String, default: '' },

  // External registration form (typically a Google Form). The QR code below
  // points at this link so attendees can scan straight through to it.
  registrationUrl: { type: String, default: '' },

  // Path to the QR image. Either generated from registrationUrl, or a file
  // the organiser uploaded because they already had a QR code prepared.
  qrImage: { type: String, default: '' },
  qrSource: { type: String, enum: ['generated', 'uploaded', 'none'], default: 'none' },

  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
module.exports.CATEGORIES = EVENT_CATEGORIES;
