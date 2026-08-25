-- ============================================================
-- Booking System Schema
-- ============================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A "resource" is anything bookable: a table, a room, a class, an appointment slot type
CREATE TABLE IF NOT EXISTS resources (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    description   TEXT,
    capacity      INTEGER NOT NULL DEFAULT 1,
    location      TEXT,
    created_by    INTEGER REFERENCES users(id),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Bookings reserve a resource for a time range.
-- The UNIQUE constraint on (resource_id, start_time) plus the application-level
-- overlap check is what prevents double-booking under concurrent requests.
CREATE TABLE IF NOT EXISTS bookings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id   INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time    TEXT NOT NULL,   -- ISO 8601
    end_time      TEXT NOT NULL,   -- ISO 8601
    status        TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    notes         TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_resource_time ON bookings(resource_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);

-- Prevents two CONFIRMED bookings on the same resource from starting at the
-- exact same instant. This is a last line of defense; the real overlap check
-- (different start/end times that still overlap) happens in application code
-- inside a transaction — see src/routes/bookings.routes.js.
CREATE UNIQUE INDEX IF NOT EXISTS uq_resource_start_confirmed
    ON bookings(resource_id, start_time)
    WHERE status = 'confirmed';
