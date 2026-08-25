import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./src/db/index.js";
import authRoutes from "./src/routes/auth.routes.js";
import resourceRoutes from "./src/routes/resources.routes.js";
import bookingRoutes from "./src/routes/bookings.routes.js";

dotenv.config();

initDb();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Booking API running on http://localhost:${PORT}`);
});
