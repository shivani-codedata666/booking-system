// test_race_condition.js
// Fires N concurrent requests for the SAME overlapping time slot to prove
// only one succeeds and the rest are correctly rejected with 409.

const BASE = "http://localhost:4000";

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.token;
}

async function main() {
  const token = await login("jane@example.com", "password123");

  const payload = {
    resource_id: 2,
    start_time: "2026-09-02T14:00:00.000Z",
    end_time: "2026-09-02T15:00:00.000Z",
  };

  const N = 10;
  console.log(`Firing ${N} concurrent requests for the same slot...`);

  const requests = Array.from({ length: N }, () =>
    fetch(`${BASE}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }).then((r) => r.status)
  );

  const statuses = await Promise.all(requests);
  const successes = statuses.filter((s) => s === 201).length;
  const conflicts = statuses.filter((s) => s === 409).length;

  console.log("Status codes:", statuses);
  console.log(`Successful bookings: ${successes}`);
  console.log(`Rejected as conflicts (409): ${conflicts}`);

  const check = await fetch(`${BASE}/api/resources/2/bookings?date=2026-09-02`).then((r) => r.json());
  console.log(`Actual confirmed bookings in DB for that slot: ${check.length}`);

  if (successes === 1 && check.length === 1) {
    console.log("\n✅ PASS: Exactly one booking succeeded, no double-booking occurred.");
  } else {
    console.log("\n❌ FAIL: Race condition protection did not work as expected.");
  }
}

main().catch(console.error);
