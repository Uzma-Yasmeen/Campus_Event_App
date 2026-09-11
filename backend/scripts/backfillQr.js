// Give every existing event a QR code.
// Run with: npm run backfill:qr
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Event = require('../models/Event');
const { generateQr, isValidUrl, eventSummary } = require('../utils/qr');

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    const events = await Event.find({
      $or: [{ qrImage: '' }, { qrImage: { $exists: false } }]
    });

    if (!events.length) {
      console.log('Every event already has a QR code.');
      await mongoose.disconnect();
      process.exit(0);
    }

    for (const event of events) {
      const payload = (event.registrationUrl && isValidUrl(event.registrationUrl))
        ? event.registrationUrl
        : eventSummary(event);

      event.qrImage = await generateQr(event._id, payload);
      event.qrSource = 'generated';
      await event.save();
      console.log(`QR created for "${event.title}"`);
    }

    console.log(`Done. ${events.length} event(s) updated.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
