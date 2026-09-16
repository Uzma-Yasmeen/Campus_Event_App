const { app, request, makeInstitution, makeUser, makeEvent, auth } = require('./helpers');

describe('publishing events', () => {
  it('lets an organiser publish, and files it under their own campus', async () => {
    const { token, institution } = await makeUser({ role: 'organizer' });

    const event = await makeEvent(token, { title: 'Robotics Hackathon' });

    expect(event.title).toBe('Robotics Hackathon');
    expect(String(event.institution)).toBe(institution._id.toString());
  });

  it('refuses a participant', async () => {
    const { token } = await makeUser({ role: 'student' });

    const res = await request(app).post('/api/events/create')
      .set(auth(token))
      .field('title', 'Nope')
      .field('date', '2027-01-01T10:00:00.000Z');

    expect(res.status).toBe(403);
  });

  it('ignores an institution supplied by the client', async () => {
    const other = await makeInstitution('Somewhere Else');
    const { token, institution } = await makeUser({ role: 'organizer' });

    const res = await request(app).post('/api/events/create')
      .set(auth(token))
      .field('title', 'Planted')
      .field('date', '2027-01-01T10:00:00.000Z')
      .field('institution', other._id.toString());

    // The organiser's own campus wins, whatever the request body said.
    expect(String(res.body.institution)).toBe(institution._id.toString());
  });

  it('refuses a registration link that is not http(s)', async () => {
    const { token } = await makeUser({ role: 'organizer' });

    const res = await request(app).post('/api/events/create')
      .set(auth(token))
      .field('title', 'Bad link')
      .field('date', '2027-01-01T10:00:00.000Z')
      .field('registrationUrl', 'javascript:alert(1)');

    expect(res.status).toBe(400);
  });
});

describe('campus scoping', () => {
  it('shows an event to its own campus and hides it from another', async () => {
    const a = await makeUser({ role: 'organizer' });
    await makeEvent(a.token, { title: 'Campus A Event' });

    const b = await makeUser({
      role: 'organizer',
      institution: await makeInstitution('Campus B')
    });

    const seenByA = await request(app).get('/api/events').set(auth(a.token));
    const seenByB = await request(app).get('/api/events').set(auth(b.token));

    expect(seenByA.body).toHaveLength(1);
    expect(seenByB.body).toHaveLength(0);
  });

  it('lets the owner fetch their own event by id', async () => {
    const owner = await makeUser({ role: 'organizer' });
    const created = await makeEvent(owner.token, { title: 'Fetch Me' });

    const res = await request(app).get(`/api/events/${created._id}`).set(auth(owner.token));

    // Regression: this route populates the institution, so the scope check has
    // to compare ids rather than stringify a populated object. It previously
    // returned 404 to everyone, including the owner.
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Fetch Me');
  });

  it('lets anyone on the same campus fetch the event', async () => {
    const owner = await makeUser({ role: 'organizer' });
    const created = await makeEvent(owner.token);
    const classmate = await makeUser({ role: 'student', institution: owner.institution });

    const res = await request(app).get(`/api/events/${created._id}`).set(auth(classmate.token));

    expect(res.status).toBe(200);
  });

  it('answers 404 rather than 403 for another campus, so nothing is disclosed', async () => {
    const a = await makeUser({ role: 'organizer' });
    const event = await makeEvent(a.token);

    const b = await makeUser({
      role: 'student',
      institution: await makeInstitution('Campus B')
    });

    const fetched = await request(app).get(`/api/events/${event._id}`).set(auth(b.token));
    const registered = await request(app).post(`/api/events/${event._id}/register`).set(auth(b.token));

    expect(fetched.status).toBe(404);
    expect(registered.status).toBe(404);
  });
});

describe('ownership', () => {
  it('lets the owner edit, and stops another organiser on the same campus', async () => {
    const owner = await makeUser({ role: 'organizer' });
    const event = await makeEvent(owner.token);
    const other = await makeUser({ role: 'organizer', institution: owner.institution });

    const byOwner = await request(app).put(`/api/events/${event._id}`)
      .set(auth(owner.token)).send({ title: 'Renamed' });
    const byOther = await request(app).put(`/api/events/${event._id}`)
      .set(auth(other.token)).send({ title: 'Hijacked' });

    expect(byOwner.status).toBe(200);
    expect(byOwner.body.title).toBe('Renamed');
    expect(byOther.status).toBe(403);
  });

  it('lets only the owner delete', async () => {
    const owner = await makeUser({ role: 'organizer' });
    const event = await makeEvent(owner.token);
    const other = await makeUser({ role: 'organizer', institution: owner.institution });

    const byOther = await request(app).delete(`/api/events/${event._id}/delete`).set(auth(other.token));
    const byOwner = await request(app).delete(`/api/events/${event._id}/delete`).set(auth(owner.token));

    expect(byOther.status).toBe(403);
    expect(byOwner.status).toBe(200);
  });

  it('shows the participant list to the owner only', async () => {
    const owner = await makeUser({ role: 'organizer' });
    const event = await makeEvent(owner.token);
    const student = await makeUser({ role: 'student', institution: owner.institution });
    const other = await makeUser({ role: 'organizer', institution: owner.institution });

    await request(app).post(`/api/events/${event._id}/register`).set(auth(student.token));

    const asOwner = await request(app).get(`/api/events/${event._id}/participants`).set(auth(owner.token));
    const asOther = await request(app).get(`/api/events/${event._id}/participants`).set(auth(other.token));
    const asStudent = await request(app).get(`/api/events/${event._id}/participants`).set(auth(student.token));

    expect(asOwner.status).toBe(200);
    expect(asOwner.body).toHaveLength(1);
    expect(asOther.status).toBe(403);
    expect(asStudent.status).toBe(403);
  });
});

describe('registering', () => {
  it('records a registration once and refuses a second', async () => {
    const owner = await makeUser({ role: 'organizer' });
    const event = await makeEvent(owner.token);
    const student = await makeUser({ role: 'student', institution: owner.institution });

    const first = await request(app).post(`/api/events/${event._id}/register`).set(auth(student.token));
    const second = await request(app).post(`/api/events/${event._id}/register`).set(auth(student.token));

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
  });
});

describe('QR codes', () => {
  it('generates one from a registration link', async () => {
    const { token } = await makeUser({ role: 'organizer' });

    const event = await makeEvent(token, { registrationUrl: 'https://example.com/form' });

    expect(event.qrSource).toBe('generated');
    expect(event.qrImage).toMatch(/^\/uploads\/qr\/event-[a-f0-9]{24}\.png$/);
  });

  it('gives no code to an event with no link, rather than one that does nothing', async () => {
    const { token } = await makeUser({ role: 'organizer' });

    const event = await makeEvent(token);

    expect(event.qrSource).toBe('none');
    expect(event.qrImage).toBe('');
  });
});

describe('searching and filtering', () => {
  it('filters by category and by free text', async () => {
    const { token } = await makeUser({ role: 'organizer' });
    await makeEvent(token, { title: 'Sports Day', category: 'Sports', location: 'Stadium' });
    await makeEvent(token, { title: 'Django Workshop', category: 'Workshop', location: 'Lab' });

    const byCategory = await request(app).get('/api/events?category=Sports').set(auth(token));
    const bySearch = await request(app).get('/api/events?q=django').set(auth(token));
    const byVenue = await request(app).get('/api/events?q=stadium').set(auth(token));

    expect(byCategory.body.map((e) => e.title)).toEqual(['Sports Day']);
    expect(bySearch.body.map((e) => e.title)).toEqual(['Django Workshop']);
    expect(byVenue.body.map((e) => e.title)).toEqual(['Sports Day']);
  });
});
