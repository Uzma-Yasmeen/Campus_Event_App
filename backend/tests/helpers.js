const request = require('supertest');
const app = require('../server');
const Institution = require('../models/Institution');

/** Create an institution directly; most tests just need one to exist. */
async function makeInstitution(name = 'Test University') {
  return Institution.create({ name });
}

/**
 * Register an account through the API and hand back its token, so tests
 * exercise the same path a real client does.
 */
async function makeUser({ role = 'student', institution, email, name = 'Test Person' } = {}) {
  const inst = institution || (await makeInstitution());
  const res = await request(app).post('/api/auth/register').send({
    name,
    email: email || `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.edu`,
    password: 'secret123',
    role,
    institution: inst._id.toString()
  });

  if (res.status !== 201) {
    throw new Error(`could not create ${role}: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { token: res.body.token, user: res.body.user, institution: inst };
}

/** Publish an event as the given organiser. */
async function makeEvent(token, overrides = {}) {
  const body = {
    title: 'Test Event',
    category: 'Seminar',
    date: '2027-01-01T10:00:00.000Z',
    location: 'Main Hall',
    ...overrides
  };

  const req = request(app).post('/api/events/create').set('Authorization', `Bearer ${token}`);
  Object.entries(body).forEach(([k, v]) => req.field(k, String(v)));

  const res = await req;
  if (res.status !== 201) {
    throw new Error(`could not create event: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { app, request, makeInstitution, makeUser, makeEvent, auth };
