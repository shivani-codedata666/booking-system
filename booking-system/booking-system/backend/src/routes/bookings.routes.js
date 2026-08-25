import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const createBookingSchema = z.object({
  resource_id: z.number().int().positive(),
  start_time: z.string().datetime({ message: "start_time must be ISO 8601" }),
  end_time: z.string().datetime({ message: "end_time must be ISO 8601" }),
  notes: z.string().optional(),
});

/**
 * POST /api/bookings
 *
 * This is the core "hard problem" of the project: preventing two users from
 * booking overlapping time slots on the same resource when requests arrive
 * concurrently (a classic race condition).
 *
 * How it's handled:
 *   1. better-sqlite3 transactions are synchronous and SQLite serializes
 *      writes, so the overlap check + insert below execute as one atomic
 *      unit — no other write can interleave between the SELECT and the
 *      INSERT for this resource.
 *   2. The overlap check itself uses the standard interval-overlap
 *      condition: two ranges [startA, endA) and [startB, endB) overlap iff
 *      startA < endB AND startB < endA.
 *   3. A UNIQUE index on (resource_id, start_time) for confirmed bookings
 *      (see schema.sql) is a second line of defense against exact-duplicate
 *      start times slipping through.
 *
 * In a multi-server deployment (not single-process SQLite), the equivalent
 * pattern is a DB-level transaction with SELECT ... FOR UPDATE, or a unique
 * constraint on a normalized slot key, to get the same guarantee under
 * concurrent writers.
 */
router.post("/", requireAuth, (req, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { resource_id, start_time, end_time, notes } = parsed.data;

  if (new Date(start_time) >= new Date(end_time)) {
    return res.status(400).json({ error: "start_time must be before end_time" });
  }
  if (new Date(start_time) < new Date()) {
    return res.status(400).json({ error: "Cannot book a time slot in the past" });
  }

  const resource = db.prepare("SELECT * FROM resources WHERE id = ?").get(resource_id);
  if (!resource) return res.status(404).json({ error: "Resource not found" });

  const createBooking = db.transaction(() => {
    const overlap = db
      .prepare(
        `SELECT id FROM bookings
         WHERE resource_id = ?
           AND status = 'confirmed'
           AND start_time < ?
           AND end_time > ?
         LIMIT 1`
      )
      .get(resource_id, end_time, start_time);

    if (overlap) {
      const err = new Error("SLOT_TAKEN");
      throw err;
    }

    const result = db
      .prepare(
        `INSERT INTO bookings (resource_id, user_id, start_time, end_time, notes)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(resource_id, req.user.id, start_time, end_time, notes || null);

    return result.lastInsertRowid;
  });

  try {
    const bookingId = createBooking();
    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
    return res.status(201).json(booking);
  } catch (err) {
    if (err.message === "SLOT_TAKEN" || err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "This time slot was just booked by someone else. Please pick another." });
    }
    console.error(err);
    return res.status(500).json({ error: "Failed to create booking" });
  }
});

// GET /api/bookings/mine - current user's bookings
router.get("/mine", requireAuth, (req, res) => {
  const bookings = db
    .prepare(
      `SELECT b.*, r.name AS resource_name, r.location
       FROM bookings b
       JOIN resources r ON r.id = b.resource_id
       WHERE b.user_id = ?
       ORDER BY b.start_time DESC`
    )
    .all(req.user.id);
  res.json(bookings);
});

// DELETE /api/bookings/:id - cancel a booking (owner only)
router.delete("/:id", requireAuth, (req, res) => {
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.user_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "You can only cancel your own bookings" });
  }

  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
  res.json({ message: "Booking cancelled" });
});

export default router;
