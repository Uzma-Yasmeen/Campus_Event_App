const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const QR_DIR = path.join(__dirname, '..', 'uploads', 'qr');
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

/** Accept only links we are willing to turn into a scannable code. */
function isValidUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Render `payload` as a PNG QR code under uploads/qr and return its public path.
 * Named after the event so regenerating on edit overwrites the old file.
 */
async function generateQr(eventId, payload) {
  const filename = `event-${eventId}.png`;

  await QRCode.toFile(path.join(QR_DIR, filename), String(payload).trim(), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 512,
    color: { dark: '#16324f', light: '#ffffff' }
  });

  return `/uploads/qr/${filename}`;
}

/**
 * Text encoded when an event has no registration link, so that every event
 * still carries a QR code that shows something useful when scanned.
 */
function eventSummary(event) {
  const when = event.date ? new Date(event.date).toUTCString() : '';
  return [
    'Campus Events',
    `Event: ${event.title}`,
    event.category ? `Category: ${event.category}` : '',
    when ? `When: ${when}` : '',
    event.location ? `Where: ${event.location}` : ''
  ].filter(Boolean).join('\n');
}

/** Remove a generated QR file; safe to call when the file is already gone. */
function removeQr(eventId) {
  const file = path.join(QR_DIR, `event-${eventId}.png`);
  fs.promises.unlink(file).catch(() => {});
}

module.exports = { generateQr, removeQr, isValidUrl, eventSummary };
