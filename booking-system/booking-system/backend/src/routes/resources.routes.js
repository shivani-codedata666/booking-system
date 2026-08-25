import { Router } from "express";
import { z } from "zod";
import { db } from "../db/index.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// GET /api/resources - list all bookable resources
router.get("/", (req, res) => {
  const resources = db.prepare("SELECT * FROM resources ORDER BY name").all();
  res.json(resources);
});

// GET /api/resources/:id - single resource detail
router.get("/:id", (req, res) => {
  const resource = db.prepare("SELECT * FROM resources WHERE id = ?").get(req.params.id);
  if (!resource) return res.status(404).json({ error: "Resource not found" });
  res.json(resource);
});

// GET /api/resources/:id/bookings?date=YYYY-MM-DD - existing bookings for a day (for slot picker)
router.get("/:id/bookings", (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: "date query param is required (YYYY-MM-DD)" });

  const bookings = db
    .prepare(
      `SELECT id, start_time, end_time, user_id
       FROM bookings
       WHERE resource_id = ?
         AND status = 'confirmed'
         AND date(start_time) = ?
       ORDER BY start_time`
    )
    .all(req.params.id, date);

  res.json(bookings);
});

const createResourceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  capacity: z.number().int().positive().default(1),
  location: z.string().optional(),
});

// POST /api/resources - admin only, create a new bookable resource
router.post("/", requireAuth, requireAdmin, (req, res) => {
  const parsed = createResourceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { name, description, capacity, location } = parsed.data;
  const result = db
    .prepare(
      "INSERT INTO resources (name, description, capacity, location, created_by) VALUES (?, ?, ?, ?, ?)"
    )
    .run(name, description || null, capacity, location || null, req.user.id);

  const resource = db.prepare("SELECT * FROM resources WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(resource);
});

export default router;
