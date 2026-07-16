import React, { useEffect, useState } from "react";
import api from "../../api/api";
import BreakEvenPanel from "../../components/BreakEvenPanel";

export default function BreakEvenPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");

  // 🔥 Cargar eventos
  useEffect(() => {
    const loadEvents = async () => {
      const res = await api.get("/events");
      const data = res.data?.data || res.data || [];
      setEvents(data);
    };

    loadEvents();
  }, []);

  return (
    <div className="p-6 text-white">
      
      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4">
        📊 Break Even & Proyección
      </h1>

      {/* SELECTOR */}
      <div className="mb-6">
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 w-full"
        >
          <option value="">Selecciona un evento</option>
          {events.map((evt) => (
            <option key={evt.id} value={evt.id}>
              {evt.title}
            </option>
          ))}
        </select>
      </div>

      {/* PANEL */}
      {selectedEvent && (
        <BreakEvenPanel eventId={selectedEvent} />
      )}
    </div>
  );
}