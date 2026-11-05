# EPIA CRM Backend

A Node.js REST API for managing patient appointments, sending WhatsApp reminders (simulated), and tracking follow-ups — built with Express and SQLite.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

## Setup

```bash
git clone <repo-url>
cd epia
npm install
```

The SQLite database (`epia_crm.db`) is created automatically on first run — no manual setup needed.

## Running

```bash
npm start
```

Server starts at **http://localhost:3000**.

For development with auto-reload on file changes:

```bash
npm run dev
```

Open `http://localhost:3000` in a browser to use the built-in frontend, or use the API directly with curl/Postman.

---

## API Reference

### Appointments

**Create an appointment**
```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -d '{"name": "Riya Sharma", "phone": "+919876543210", "date": "2025-01-15"}'
```
Response: `201 Created`

**List all appointments**
```bash
curl http://localhost:3000/appointments
```

**Get appointment by ID**
```bash
curl http://localhost:3000/appointments/1
```
Returns `404` if not found.

### WhatsApp Reminders

The WhatsApp integration uses a simulated API — no real messages are sent. The simulator randomly returns success (~60%) or one of three realistic error types (auth failure, rate limit, invalid recipient).

**Send a reminder**
```bash
curl -X POST http://localhost:3000/whatsapp/send-reminder \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": 1}'
```

**View message log for an appointment**
```bash
curl http://localhost:3000/whatsapp/messages/1
```
Every send attempt is logged with its status (`sent`, `failed`, or `error`) and error details.

### Follow-Ups

**Create a follow-up**
```bash
curl -X POST http://localhost:3000/follow-ups \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": 1, "follow_up_date": "2025-01-20", "notes": "Check recovery progress"}'
```
Returns `409 Conflict` if a follow-up already exists for that appointment on the same date.

**List pending follow-ups**
```bash
curl http://localhost:3000/follow-ups/pending
```

**Mark a follow-up as completed**
```bash
curl -X PATCH http://localhost:3000/follow-ups/1/complete
```

---

## Testing

1. Start the server with `npm start`.
2. Open `http://localhost:3000` for the frontend, or use the curl commands above.
3. Create a few appointments first — WhatsApp reminders and follow-ups reference appointments by ID.
4. Send a WhatsApp reminder multiple times to see both success and failure responses (it's random).
5. Create a duplicate follow-up (same appointment + same date) to verify the 409 conflict response.

## Project Structure

```
epia/
├── public/
│   └── index.html           # Frontend (single-page app)
├── src/
│   ├── app.js               # Express server and route mounting
│   ├── database.js          # SQLite connection and schema
│   └── routes/
│       ├── appointments.js  # Appointment CRUD
│       ├── whatsapp.js      # Simulated WhatsApp reminders + message log
│       └── followups.js     # Follow-up management
├── TASK2A_DIAGNOSIS.md      # WhatsApp API error diagnosis writeup
├── package.json
└── README.md
```

## Bugs Fixed in the Original Appointments API

| # | Issue | Fix |
|---|-------|-----|
| 1 | `express.json()` middleware missing — `req.body` was `undefined` | Added `app.use(express.json())` before routes |
| 2 | ID lookup type mismatch — `req.params.id` is a string, stored ID is a number, `===` never matched | Parse with `Number()` before comparison |
| 3 | No input validation — missing fields silently created broken records | Return `400` with list of missing fields |
| 4 | No proper HTTP status codes — always returned `200` | `201` on creation, `400`/`404`/`500` for errors |
| 5 | No persistence — in-memory array lost on restart | Replaced with SQLite via `better-sqlite3` |

## Limitations

- WhatsApp integration is simulated — replacing `simulateWhatsAppAPI()` with a real HTTP call to Meta's Cloud API would make it functional.
- No authentication — the API is open. Production would need JWT or session-based auth.
- No pagination on list endpoints — fine for small datasets, needs cursor-based pagination at scale.
- SQLite is single-file and not suited for high-concurrency production workloads.
- No automated test suite — testing is manual via curl or the frontend.

## Technical Explanation

The most challenging part was designing the WhatsApp integration to handle failure gracefully. The simulated API returns four distinct response shapes — success, auth error (code 190), rate limit (code 4), and invalid recipient (code 131030) — each requiring different HTTP status codes and client-facing messages. The key decision was to record every send attempt in the database regardless of outcome, creating a complete audit trail. Error responses are mapped to appropriate status codes (401 for auth, 502 for upstream failures) while a top-level try-catch ensures unexpected exceptions never crash the server.

For debugging the original appointments code, the approach was to isolate each issue: first confirmed `req.body` was undefined (missing middleware), then traced the ID lookup failure to JavaScript's strict equality between string and number types, then added validation and persistence layer by layer.

For production readiness, the system would need: real WhatsApp API credentials with automatic token refresh, a retry queue with exponential backoff for rate-limited messages, authentication on all endpoints, request rate limiting, input sanitization, an automated test suite, and migration to PostgreSQL for concurrent access.
