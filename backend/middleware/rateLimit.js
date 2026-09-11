const rateLimit = require('express-rate-limit');

// Rate limiting is disabled in tests so suites do not trip over each other.
const disabled = process.env.NODE_ENV === 'test';

const skip = () => disabled;

/**
 * Sign-in and sign-up are the endpoints worth brute-forcing, so they get a
 * tighter budget than the rest of the API. Counting only failed sign-ins keeps
 * a user who legitimately signs in on several devices from locking themselves
 * out, while still stopping password guessing.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' }
});

/** Account creation, limited per IP so the user table cannot be flooded. */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: { message: 'Too many accounts created from this address. Try again later.' }
});

/** A broad ceiling for everything else. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip
});

/** Uploads are the most expensive writes, so they get their own budget. */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: { message: 'Upload limit reached. Please try again later.' }
});

module.exports = { authLimiter, registerLimiter, apiLimiter, uploadLimiter };
