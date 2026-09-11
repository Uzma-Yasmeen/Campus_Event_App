/**
 * CORS policy.
 *
 * In development any origin is allowed, which keeps local work friction-free.
 * In production only the origins listed in CORS_ORIGINS may call the API, so a
 * deployed backend cannot be driven from someone else's page.
 *
 * CORS_ORIGINS is a comma-separated list, e.g.
 *   CORS_ORIGINS=https://campus-events.netlify.app,https://events.example.edu
 */
function buildCorsOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  const allowed = String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (!isProduction) {
    return { origin: true, credentials: false };
  }

  if (allowed.length === 0) {
    console.warn(
      'CORS_ORIGINS is not set. In production the API will reject browser ' +
      'requests from every origin until it is configured.'
    );
  }

  return {
    credentials: false,
    origin(origin, callback) {
      // Requests without an Origin header - curl, mobile apps, server-to-server -
      // are not subject to the browser's same-origin rules, so let them through.
      if (!origin) return callback(null, true);

      const normalised = origin.replace(/\/$/, '');
      if (allowed.includes(normalised)) return callback(null, true);

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  };
}

module.exports = { buildCorsOptions };
