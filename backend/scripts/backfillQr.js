// Give every existing event a QR code.
// Run with: npm run backfill:qr
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Event = require('../models/Event');
const { generateQr, isValidUrl } = require('../utils/qr');

(async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    // Only events with a registration link get a code; one without a link has
    // nothing worth encoding.
    const events = await Event.find({
      $or: [{ qrImage: '' }, { qrImage: { $exists: false } }],
      registrationUrl: { $nin: ['', null] }
    });

    if (!events.length) {
      console.log('No events are missing a QR code.');
      await mongoose.disconnect();
      process.exit(0);
    }

    for (const event of events) {
      if (!isValidUrl(event.registrationUrl)) continue;

      event.qrImage = await generateQr(event._id, event.registrationUrl);
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
