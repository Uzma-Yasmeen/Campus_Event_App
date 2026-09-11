const path = require('path');
const fs = require('fs');
const Event = require('../models/Event');
const { generateQr, isValidUrl, eventSummary } = require('../utils/qr');

const QR_DIR = path.join(__dirname, '..', 'uploads', 'qr');

/**
 * Regenerate a missing QR code on demand.
 *
 * Most free hosting tiers give a service an ephemeral filesystem: the disk is
 * wiped whenever the instance restarts or spins back up from idle. Generated
 * QR codes would disappear with it and every event would show a broken image.
 *
 * Because a generated code is derived entirely from data we still hold in
 * MongoDB, it can simply be rebuilt the first time it is requested. Uploaded
 * codes cannot be rebuilt, so those are left alone - see docs/DEPLOYMENT.md for
 * the persistent-storage options.
 */
module.exports = async function ensureQr(req, res, next) {
  try {
    const match = /^\/qr\/event-([a-f0-9]{24})\.png$/i.exec(req.path);
    if (!match) return next();

    const file = path.join(QR_DIR, `event-${match[1]}.png`);
    if (fs.existsSync(file)) return next();

    const event = await Event.findById(match[1]);
    if (!event) return next();

    const payload = (event.registrationUrl && isValidUrl(event.registrationUrl))
      ? event.registrationUrl
      : eventSummary(event);

    await generateQr(event._id, payload);
    console.log(`Regenerated missing QR code for event ${event._id}`);
  } catch (err) {
    // Fall through to the static handler, which will return a normal 404.
    console.error('QR regeneration failed:', err.message || err);
  }

  next();
};
