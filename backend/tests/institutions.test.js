const { app, request, makeInstitution, makeUser, auth } = require('./helpers');

describe('/api/institutions', () => {
  it('lists institutions without a token, because sign-up needs them', async () => {
    await makeInstitution('Anna University');

    const res = await request(app).get('/api/institutions');

    expect(res.status).toBe(200);
    expect(res.body.map((i) => i.name)).toContain('Anna University');
  });

  it('needs a token to add one', async () => {
    const res = await request(app).post('/api/institutions').send({ name: 'Ghost College' });

    expect(res.status).toBe(401);
  });

  it('adds one for a signed-in user', async () => {
    const { token } = await makeUser();

    const res = await request(app).post('/api/institutions')
      .set(auth(token)).send({ name: 'Brand New Institute' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Brand New Institute');
  });

  it('refuses a duplicate regardless of casing', async () => {
    const { token } = await makeUser();
    await makeInstitution('Anna University');

    const res = await request(app).post('/api/institutions')
      .set(auth(token)).send({ name: 'anna UNIVERSITY' });

    expect(res.status).toBe(409);
  });

  it('refuses a name that is too short to mean anything', async () => {
    const { token } = await makeUser();

    const res = await request(app).post('/api/institutions').set(auth(token)).send({ name: 'A' });

    expect(res.status).toBe(400);
  });
});
