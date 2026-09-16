# API reference

Every route is prefixed with `/api`. Authenticated routes expect an
`Authorization: Bearer <token>` header.


All routes are prefixed with `/api`. Authenticated routes expect an
`Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create an account; returns a token |
| `POST` | `/auth/login` | Public | Sign in; returns a token |
| `GET` | `/auth/me` | Authenticated | Current user |

`register` requires either `institution` (an id) or `institutionName` (a name, created if
it does not exist yet). Accounts cannot exist without an institution, because event
visibility depends on it.

### Events

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/events` | Authenticated | List events at the caller's institution. Filters: `?category=`, `?q=` |
| `GET` | `/events/:id` | Authenticated | A single event |
| `POST` | `/events/create` | Organiser | Create an event (multipart: `image`, `qrImage`) |
| `PUT` | `/events/:id` | Event owner | Update an event |
| `DELETE` | `/events/:id/delete` | Event owner | Delete an event |
| `POST` | `/events/:id/register` | Authenticated | Register for an event |
| `GET` | `/events/:id/participants` | Event owner | List who registered |
| `GET` | `/events/meta/categories` | Public | Allowed category values |

### Institutions

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/institutions` | Public | List institutions |
| `POST` | `/institutions` | Authenticated | Add one (duplicates rejected, case-insensitive) |

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users/profile` | Authenticated | Current profile |
| `PUT` | `/users/profile/update` | Authenticated | Update name, email, institution |
| `PUT` | `/users/change-password` | Authenticated | Change password |
| `PUT` | `/users/settings` | Authenticated | Theme and notification preferences |
| `POST` | `/users/avatar` | Authenticated | Upload a profile picture |

---

## Roles and permissions

Permissions are enforced in middleware on every request, so they hold regardless of what
the client sends.

| Action | Participant | Organiser | Event owner |
|---|:--:|:--:|:--:|
| Browse all events | yes | yes | yes |
| Register for an event | yes | yes | yes |
| Create an event | no | yes | yes |
| Edit / delete an event | no | own events only | yes |
| View a participant list | no | own events only | yes |

An organiser who did not create an event sees it exactly as a participant does — no edit
or delete controls, and the API returns `403` if those endpoints are called directly.

### Campus scoping

Every rule above applies *within an institution*. Events belong to the campus of the
organiser who published them, and a user only ever sees their own campus:

- `GET /events` filters to the caller's institution; there is no parameter to widen it
- `GET /events/:id` returns `404` for an event at another institution, so its existence
  is not disclosed
- `POST /events/:id/register` likewise returns `404` across campuses
- On create, the institution is taken from the organiser's account. A client cannot
  publish into a campus it does not belong to, whatever it puts in the request body

Because of this, an account without an institution would have nothing to see, so one is
required at sign-up. Existing installations can run `npm run backfill:institution`, which
assigns each unscoped event to its organiser's campus.

---

## How QR codes work

A QR code is resolved in this order:

1. **An uploaded code.** If the organiser uploads a `qrImage`, that file is used as-is.
   Useful when a code was printed on posters before the event was added here.
2. **A generated code.** If a `registrationUrl` is supplied — typically a Google Form —
   a PNG is rendered server-side pointing at that link.
3. **Otherwise, no QR code.** The event simply shows no code.

Generated codes are written to `backend/uploads/qr/event-<id>.png` and regenerated when
the registration link changes. Only `http` and `https` links are accepted, so a code can
never encode something a scanner will not open.

> An earlier version encoded the event's title, date and venue as plain text when no link
> was given, so that every event had a code. It was removed: a phone camera scanning plain
> text shows the raw string with nothing to tap, which made the feature look functional
> while doing nothing. A QR code is now only shown when scanning it will actually take
> someone somewhere.

---
