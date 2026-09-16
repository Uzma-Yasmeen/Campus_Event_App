# Campus Events

A campus event management platform. Organisers publish events and see who signed up;
students browse what is on and register. Each event can carry a QR code that opens its
registration form.

Three parts share one REST API: a Node/Express backend, a web client, and a React Native
mobile app.

![Campus Events](docs/screenshots/landing.png)

## What it does

- **Accounts** — email and password, bcrypt-hashed, JWT sessions
- **Two roles** — participant and organiser, enforced on the server rather than hidden in
  the interface
- **Campus scoping** — you only see events from your own institution
- **Events** — create, edit, delete, with categories, cover images and search
- **Registrations** — organisers see the full participant list for their own events
- **QR codes** — generated from a registration link, or upload one you already have
- **Light and dark themes**, on web

## Running it

You need Node 18+ and MongoDB.

```bash
# 1. API
cd backend
npm install
cp .env.example .env     # set MONGO_URI and JWT_SECRET
npm run seed             # optional sample institutions
npm start                # http://localhost:5000

# 2. Web client - static files, no build step
npx http-server web -p 5500

# 3. Mobile app
cd mobile && npm install && npm start
```

Pointing the web client somewhere other than `localhost:5000` is one line in
[`web/assets/config.js`](web/assets/config.js).

## Tech

Node.js · Express · MongoDB · Mongoose · JWT · Multer · `qrcode` · React Native (Expo) ·
vanilla JS and CSS on the web, with no bundler.

## Documentation

| Document | Contents |
|---|---|
| [docs/API.md](docs/API.md) | Every endpoint, the permission rules, and how QR codes are resolved |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploying free on Atlas, Render and Netlify |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branching model, versioning and commit conventions |

## Status

The backend and web client are verified end to end against a live database — sign-up,
sign-in, role and ownership rules, campus scoping, event CRUD, QR generation and decoding,
and search. The mobile app runs and has been driven through sign-in, browsing, event
detail and registration on the web target, but not yet on physical hardware.

Not built yet: pagination, email notifications, and a mobile dark theme.

## Licence

MIT. See [LICENSE](LICENSE).
