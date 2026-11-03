# EPIA CRM Backend

A Node.js/Express backend for managing patient appointments, WhatsApp reminders, and follow-ups — built with SQLite for lightweight persistence.

## Setup

```bash
npm install
npm start
```

The server starts on `http://localhost:3000`.

---

## Task 1 — Appointments API

### Bugs identified and fixed in the original code

| # | Bug | Fix |
|---|-----|-----|
| 1 | **Missing `express.json()` middleware** — `req.body` is `undefined` so destructuring silently produces `undefined` values | Added `app.use(express.json())` before routes |
| 2 | **Type mismatch on ID lookup** — `req.params.id` is a string (`"1"`) but the stored ID is a number (`1`); strict `===` never matches | Parse `req.params.id` with `Number()` before comparison |
| 3 | **No input validation** — missing fields silently create broken records | Return `400` with a list of missing fields |
| 4 | **No meaningful HTTP status codes** — always returns `200` with a plain text string | `201` on creation, `400`/`404`/`500` for errors, JSON responses throughout |
| 5 | **No persistence** — in-memory array is lost on server restart | Replaced with SQLite database (`better-sqlite3`) |

### Endpoints

**Create appointment**
```
POST /appointments
Content-Type: application/json

{ "name": "Riya Sharma", "phone": "+919876543210", "date": "2026-11-10" }
```
Response: `201 Created`

**List all appointments**
```
GET /appointments
```

**Get appointment by ID**
```
GET /appointments/1
```
Response: `200 OK` or `404 Not Found`

---

## Task 2 — WhatsApp API Integration

### Part A — Diagnosis

See [TASK2A_DIAGNOSIS.md](TASK2A_DIAGNOSIS.md) for the full written diagnosis covering:
1. Most likely cause of `code: 190` (expired/invalid OAuth token)
2. Investigation and resolution steps
3. What to check when a message is accepted but never delivered
4. How to detect similar failures promptly

### Part B — Implementation

A simulated WhatsApp reminder endpoint that:
- Sends a reminder through a simulated Meta WhatsApp Business API
- Handles success (records `sent`) and failure (records `failed` with error details)
- Logs non-sensitive error information (error code and type, never tokens)
- Prevents API failures from crashing the app (try/catch around all API calls)
- Records every message attempt in the `messages` table for auditability

**Send reminder**
```
POST /whatsapp/send-reminder
Content-Type: application/json

{ "appointment_id": 1 }
```

**View message history for an appointment**
```
GET /whatsapp/messages/1
```

---

## Task 3 — Follow-Up Feature

**Create a follow-up**
```
POST /follow-ups
Content-Type: application/json

{ "appointment_id": 1, "follow_up_date": "2026-11-15", "notes": "Check healing progress" }
```
- Returns `409 Conflict` if a follow-up already exists for that appointment + date (duplicate prevention via UNIQUE constraint).

**Get pending follow-ups**
```
GET /follow-ups/pending
```
Returns all follow-ups with `status = 'pending'`, joined with patient name and phone.

**Mark follow-up as completed**
```
PATCH /follow-ups/1/complete
```

---

## Project Structure

```
epia/
├── src/
│   ├── app.js              # Express server entry point
│   ├── database.js          # SQLite setup and schema
│   └── routes/
│       ├── appointments.js  # Task 1: CRUD for appointments
│       ├── whatsapp.js      # Task 2B: Simulated WhatsApp reminders
│       └── followups.js     # Task 3: Follow-up management
├── TASK2A_DIAGNOSIS.md      # Task 2A: Written diagnosis
├── package.json
└── README.md
```
