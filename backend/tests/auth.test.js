const { app, request, makeInstitution, makeUser, auth } = require('./helpers');

describe('POST /api/auth/register', () => {
  it('creates an account and returns a token with the institution resolved', async () => {
    const inst = await makeInstitution('IIT Delhi');

    const res = await request(app).post('/api/auth/register').send({
      name: 'Priya Menon',
      email: 'priya@iitd.ac.in',
      password: 'secret123',
      role: 'organizer',
      institution: inst._id.toString()
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.institution.name).toBe('IIT Delhi');
    // The password hash must never travel to a client.
    expect(res.body.user.password).toBeUndefined();
  });

  it('creates the institution when given a name that is not listed yet', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'New Student',
      email: 'new@college.edu',
      password: 'secret123',
      institutionName: 'A College Not Yet Listed'
    });

    expect(res.status).toBe(201);
    expect(res.body.user.institution.name).toBe('A College Not Yet Listed');
  });

  it('refuses an account with no institution, which would see nothing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'No Campus',
      email: 'nocampus@test.edu',
      password: 'secret123'
    });

    expect(res.status).toBe(400);
  });

  it('refuses a duplicate email', async () => {
    const inst = await makeInstitution();
    const body = {
      name: 'First',
      email: 'taken@test.edu',
      password: 'secret123',
      institution: inst._id.toString()
    };

    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send({ ...body, name: 'Second' });

    expect(res.status).toBe(409);
  });

  it('refuses a password under six characters', async () => {
    const inst = await makeInstitution();

    const res = await request(app).post('/api/auth/register').send({
      name: 'Short',
      email: 'short@test.edu',
      password: 'abc',
      institution: inst._id.toString()
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const registerArjun = async () => {
    const inst = await makeInstitution();
    await request(app).post('/api/auth/register').send({
      name: 'Arjun',
      email: 'arjun@test.edu',
      password: 'secret123',
      institution: inst._id.toString()
    });
  };

  it('returns a token for the right password', async () => {
    await registerArjun();

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'arjun@test.edu', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('gives the same answer for a wrong password and an unknown account', async () => {
    await registerArjun();

    const wrongPassword = await request(app).post('/api/auth/login')
      .send({ email: 'arjun@test.edu', password: 'wrongwrong' });
    const noSuchAccount = await request(app).post('/api/auth/login')
      .send({ email: 'nobody@test.edu', password: 'wrongwrong' });

    // Identical replies, so the endpoint cannot be used to discover which
    // email addresses have accounts here.
    expect(wrongPassword.status).toBe(401);
    expect(noSuchAccount.status).toBe(401);
    expect(wrongPassword.body.message).toBe(noSuchAccount.body.message);
  });

  it('is case-insensitive about the email', async () => {
    await registerArjun();

    const res = await request(app).post('/api/auth/login')
      .send({ email: 'ARJUN@TEST.EDU', password: 'secret123' });

    expect(res.status).toBe(200);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in user', async () => {
    const { token, user } = await makeUser({ name: 'Me' });

    const res = await request(app).get('/api/auth/me').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a token that is not ours', async () => {
    const res = await request(app).get('/api/auth/me').set(auth('not.a.real.token'));
    expect(res.status).toBe(401);
  });
});
