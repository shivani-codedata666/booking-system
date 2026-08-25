Booking & Reservation System
A full-stack booking system (think Calendly/OpenTable, simplified) built to demonstrate real-world backend engineering, not just CRUD: JWT auth, relational data modeling, and — the centerpiece — race-condition-safe booking so two users can never double-book the same time slot.

The Core Problem This Project Solves
Two users click "Book" on the same time slot at almost the same instant. Without protection, both requests can pass a "is this slot free?" check before either one writes to the database — resulting in a double-booking.

This project prevents that with:

A database transaction wrapping the overlap-check + insert as one atomic unit, so no other write can interleave between the check and the write.
An interval-overlap query (start_a < end_b AND start_b < end_a) rather than a naive exact-match check, so partially-overlapping bookings are caught too.
A UNIQUE index on (resource_id, start_time) for confirmed bookings as a second line of defense.
See backend/src/routes/bookings.routes.js for the implementation, and backend/test_race_condition.js for a script that fires 10 concurrent requests at the same slot and proves exactly one succeeds:

Firing 10 concurrent requests for the same slot...
Status codes: [ 201, 409, 409, 409, 409, 409, 409, 409, 409, 409 ]
Successful bookings: 1
Rejected as conflicts (409): 9
Actual confirmed bookings in DB for that slot: 1

✅ PASS: Exactly one booking succeeded, no double-booking occurred.
Features
Signup / login with JWT auth (passwords hashed with bcrypt)
Browse bookable resources (rooms, classes, appointment slots)
Interactive time-slot picker, 7 days out, hourly slots
Race-condition-safe booking creation
View and cancel your own bookings
Admin role can create new resources
Input validation on every endpoint (Zod)
Tech Stack
Layer	Choice
Frontend	React (Vite) + React Router + Tailwind CSS v4
Backend	Node.js + Express
Database	SQLite (via better-sqlite3) — zero setup, runs anywhere
Auth	JWT + bcrypt
Validation	Zod
SQLite was chosen deliberately over PostgreSQL for this portfolio project so anyone can clone and run it with zero external setup — no database server to install or configure. The transaction/locking pattern used here (see bookings.routes.js) maps directly onto SELECT ... FOR UPDATE in PostgreSQL for a production, multi-server deployment.

Project Structure
booking-system/
├── backend/
│   ├── server.js                       # Express app entrypoint
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.sql              # Table definitions + indexes
│   │   │   ├── index.js                # DB connection
│   │   │   └── seed.js                 # Demo data seeder
│   │   ├── middleware/auth.js          # JWT verification, admin guard
│   │   └── routes/
│   │       ├── auth.routes.js          # Signup / login
│   │       ├── resources.routes.js     # Bookable resources CRUD
│   │       └── bookings.routes.js      # Booking creation (core logic)
│   ├── test_race_condition.js          # Concurrency proof script
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/client.js                # Axios client + API calls
    │   ├── context/AuthContext.jsx      # Auth state management
    │   ├── components/                  # Navbar, ProtectedRoute
    │   └── pages/
    │       ├── Login.jsx / Signup.jsx
    │       ├── Dashboard.jsx            # Resource list
    │       ├── ResourceDetail.jsx       # Slot picker + booking
    │       └── MyBookings.jsx           # View/cancel bookings
    └── package.json
How to Run
Backend:

cd backend
npm install
cp .env.example .env
npm run seed      # creates DB + demo users/resources
npm start         # runs on http://localhost:4000
Frontend (in a separate terminal):

cd frontend
npm install
cp .env.example .env
npm run dev       # runs on http://localhost:5173
Demo login:

jane@example.com / password123
admin@example.com / admin123 (admin — can create resources via API)
To see the concurrency protection in action:

cd backend
node test_race_condition.js
API Endpoints
Method	Route	Auth	Description
POST	/api/auth/signup	—	Create account
POST	/api/auth/login	—	Log in
GET	/api/resources	—	List all bookable resources
GET	/api/resources/:id	—	Get one resource
GET	/api/resources/:id/bookings?date=	—	Bookings for a resource on a date
POST	/api/resources	Admin	Create a resource
POST	/api/bookings	User	Create a booking (race-condition-safe)
GET	/api/bookings/mine	User	List your bookings
DELETE	/api/bookings/:id	Owner/Admin	Cancel a booking
Design Decisions Worth Knowing for an Interview
Why a transaction instead of a SELECT then INSERT in application code? Because between the SELECT and the INSERT, another request could slip in and pass the same check. Wrapping both in a transaction (and relying on SQLite's single-writer serialization) closes that window.
Why also add a UNIQUE index, if the transaction already handles it? Defense in depth — if the transaction logic ever has a bug, the database itself still refuses the duplicate write.
Why SQLite instead of Postgres for a "real" project? Portfolio reviewers need to run this in under 2 minutes. SQLite removes the "install and configure Postgres" friction while still demonstrating the same relational/transactional concepts. The README calls this out explicitly so it doesn't read as a shortcut.
Next Steps
Swap SQLite for PostgreSQL + SELECT ... FOR UPDATE for true multi-process concurrency.
Add email confirmation on booking (e.g. via a free Resend/SendGrid tier).
Add an admin dashboard showing booking volume and utilization per resource.
Deploy: frontend to Vercel, backend to Render/Railway.
