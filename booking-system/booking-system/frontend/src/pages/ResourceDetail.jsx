import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addDays, parseISO, isSameDay } from "date-fns";
import { getResource, getResourceBookings, createBooking } from "../api/client";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 17; // slots generated hourly from 9am-5pm
const SLOT_MINUTES = 60;

function generateDateOptions() {
  const days = [];
  for (let i = 1; i <= 7; i++) {
    days.push(addDays(new Date(), i));
  }
  return days;
}

function generateSlots(dateObj) {
  const slots = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const start = new Date(dateObj);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + SLOT_MINUTES);
    slots.push({ start, end });
  }
  return slots;
}

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => addDays(new Date(), 1));
  const [existingBookings, setExistingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingSlot, setBookingSlot] = useState(null); // slot currently being submitted
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const dateOptions = useMemo(generateDateOptions, []);
  const slots = useMemo(() => generateSlots(selectedDate), [selectedDate]);

  const loadBookings = () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    getResourceBookings(id, dateStr).then(setExistingBookings);
  };

  useEffect(() => {
    setLoading(true);
    getResource(id)
      .then(setResource)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedDate]);

  const isSlotTaken = (slot) =>
    existingBookings.some((b) => {
      const bStart = parseISO(b.start_time);
      return isSameDay(bStart, slot.start) && bStart.getTime() === slot.start.getTime();
    });

  const handleBook = async (slot) => {
    setMessage(null);
    setBookingSlot(slot);
    try {
      await createBooking({
        resource_id: Number(id),
        start_time: slot.start.toISOString(),
        end_time: slot.end.toISOString(),
        notes,
      });
      setMessage({ type: "success", text: `Booked ${format(slot.start, "h:mm a")} — see it in My Bookings.` });
      setNotes("");
      loadBookings();
    } catch (err) {
      const text = err.response?.data?.error || "Booking failed. Please try again.";
      setMessage({ type: "error", text });
      loadBookings(); // refresh in case someone else just took it
    } finally {
      setBookingSlot(null);
    }
  };

  if (loading) return <p className="max-w-3xl mx-auto px-6 py-10 text-sm text-[#8a8478]">Loading...</p>;
  if (!resource) return <p className="max-w-3xl mx-auto px-6 py-10 text-sm text-[var(--color-warn)]">Resource not found.</p>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button onClick={() => navigate(-1)} className="text-sm text-[#8a8478] hover:text-[var(--color-accent)] mb-4">
        ← Back
      </button>

      <h1 className="text-2xl font-semibold">{resource.name}</h1>
      <p className="text-sm text-[#8a8478] mb-1">{resource.description}</p>
      {resource.location && <p className="text-xs text-[var(--color-accent)] font-medium mb-6">📍 {resource.location}</p>}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Choose a date</label>
        <div className="flex gap-2 flex-wrap">
          {dateOptions.map((d) => (
            <button
              key={d.toISOString()}
              onClick={() => setSelectedDate(d)}
              className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                isSameDay(d, selectedDate)
                  ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                  : "border-[#e5e0d6] hover:border-[var(--color-accent)]"
              }`}
            >
              {format(d, "EEE, MMM d")}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Team standup"
          className="w-full border border-[#e5e0d6] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-[#eaf3ec] text-[var(--color-accent-dark)]"
              : "bg-[#f6e9e3] text-[var(--color-warn)]"
          }`}
        >
          {message.text}
        </div>
      )}

      <label className="block text-sm font-medium mb-2">Available time slots — {format(selectedDate, "EEEE, MMM d")}</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((slot) => {
          const taken = isSlotTaken(slot);
          const isSubmitting = bookingSlot?.start.getTime() === slot.start.getTime();
          return (
            <button
              key={slot.start.toISOString()}
              disabled={taken || isSubmitting}
              onClick={() => handleBook(slot)}
              className={`py-2 rounded-md text-sm border transition-colors ${
                taken
                  ? "bg-[#f0ede4] text-[#b3ab9c] border-[#e5e0d6] cursor-not-allowed line-through"
                  : "border-[#e5e0d6] hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)]"
              }`}
            >
              {isSubmitting ? "..." : format(slot.start, "h:mm a")}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[#8a8478] mt-4">
        Slots update live — if two people click the same slot at once, only the first request is confirmed;
        the second gets a clear "already booked" message instead of silently overwriting it.
      </p>
    </div>
  );
}
