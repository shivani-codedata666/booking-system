import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getResources } from "../api/client";

export default function Dashboard() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getResources()
      .then(setResources)
      .catch(() => setError("Could not load resources. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-1">Available resources</h1>
      <p className="text-sm text-[#8a8478] mb-8">Pick something to book a time slot.</p>

      {loading && <p className="text-sm text-[#8a8478]">Loading...</p>}
      {error && <p className="text-sm text-[var(--color-warn)]">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {resources.map((r) => (
          <Link
            key={r.id}
            to={`/resources/${r.id}`}
            className="block p-5 rounded-lg border border-[#e5e0d6] bg-white hover:border-[var(--color-accent)] hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h2 className="font-medium text-lg">{r.name}</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-[#f0ede4] text-[#6b6558]">
                cap {r.capacity}
              </span>
            </div>
            <p className="text-sm text-[#8a8478] mb-3">{r.description}</p>
            {r.location && (
              <p className="text-xs text-[var(--color-accent)] font-medium">📍 {r.location}</p>
            )}
          </Link>
        ))}
      </div>

      {!loading && resources.length === 0 && !error && (
        <p className="text-sm text-[#8a8478]">No resources available yet.</p>
      )}
    </div>
  );
}
