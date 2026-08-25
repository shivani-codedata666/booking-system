import bcrypt from "bcryptjs";
import { db, initDb } from "./index.js";

initDb();

const insertUser = db.prepare(
  "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
);
const insertResource = db.prepare(
  "INSERT INTO resources (name, description, capacity, location, created_by) VALUES (?, ?, ?, ?, ?)"
);

const existing = db.prepare("SELECT COUNT(*) AS c FROM users").get();
if (existing.c > 0) {
  console.log("Database already seeded, skipping.");
  process.exit(0);
}

const adminPass = bcrypt.hashSync("admin123", 10);
const userPass = bcrypt.hashSync("password123", 10);

const admin = insertUser.run("Admin User", "admin@example.com", adminPass, "admin");
insertUser.run("Jane Doe", "jane@example.com", userPass, "user");
insertUser.run("Sam Patel", "sam@example.com", userPass, "user");

const resources = [
  ["Conference Room A", "8-person room with projector and whiteboard", 8, "Floor 2"],
  ["Conference Room B", "4-person room, good for interviews", 4, "Floor 2"],
  ["Yoga Studio", "Group fitness class slot", 15, "Wellness Center"],
  ["Hair Stylist - Alex", "45-minute appointment slots", 1, "Downtown Salon"],
];

for (const [name, description, capacity, location] of resources) {
  insertResource.run(name, description, capacity, location, admin.lastInsertRowid);
}

console.log("Seeded database with demo users and resources.");
console.log("Admin login: admin@example.com / admin123");
console.log("User login:  jane@example.com / password123");
