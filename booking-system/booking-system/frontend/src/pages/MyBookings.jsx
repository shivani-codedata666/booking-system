import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { getMyBookings, cancelBooking } from "../api/client";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    setLoading(true);
    getMyBookings()
      .then(setBookings)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await cancelBooking(id);
      load();
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = bookings.filter((b) => b.status === "confirmed" && new Date(b.start_time) > new Date());
  const past = bookings.filter((b) => b.status !== "confirmed" || new Date(b.start_time) <= new Date());

  const renderBooking = (b) => (
    <div
      key={b.id}
      className="p-4 rounded-lg border border-[#e5e0d6] bg-white flex items-center justify-between"
    >
      <div>
        <p className="font-medium">{b.resource_name}</p>
        <p className="text-sm text-[#8a8478]">
          {format(parseISO(b.start_time), "EEE, MMM d · h:mm a")} – {format(parseISO(b.end_time), "h:mm a")}
        </p>
        {b.notes && <p className="text-xs text-[#8a8478] mt-1">"{b.notes}"</p>}
      </div>
      <div className="text-right">
        {b.status === "cancelled" ? (
          <span className="text-xs px-2 py-1 rounded-full bg-[#f6e9e3] text-[var(--color-warn)]">cancelled</span>
        ) : new Date(b.start_time) > new Date() ? (
          <button
            onClick={() => handleCancel(b.id)}
            disabled={cancellingId === b.id}
            className="text-sm px-3 py-1.5 rounded-md border border-[#e5e0d6] hover:border-[var(--color-warn)] hover:text-[var(--color-warn)] transition-colors"
          >
            {cancellingId === b.id ? "Cancelling..." : "Cancel"}
          </button>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-[#f0ede4] text-[#8a8478]">past</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-1">My bookings</h1>
      <p className="text-sm text-[#8a8478] mb-8">Everything you've reserved.</p>

      {loading && <p className="text-sm text-[#8a8478]">Loading...</p>}

      {!loading && (
        <>
          <h2 className="text-sm font-medium text-[#8a8478] uppercase tracking-wide mb-3">Upcoming</h2>
          <div className="space-y-3 mb-8">
            {upcoming.length ? upcoming.map(renderBooking) : (
              <p className="text-sm text-[#8a8478]">No upcoming bookings yet.</p>
            )}
          </div>

          {past.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-[#8a8478] uppercase tracking-wide mb-3">Past / cancelled</h2>
              <div className="space-y-3">{past.map(renderBooking)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
