import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function CampaignsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await api.get("/events");
      setEvents(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error("Error cargando eventos", err);
    }
  };

  const toggleEvent = (id) => {
    if (selectedEvents.includes(id)) {
      setSelectedEvents(selectedEvents.filter(e => e !== id));
    } else {
      setSelectedEvents([...selectedEvents, id]);
    }
  };

  const sendCampaign = async () => {
    if (!selectedEvents.length) {
      alert("Selecciona al menos un evento");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/mail/send-campaign", {
  eventIds: selectedEvents
});

console.log("RESPONSE CAMPAIGN:", res.data);
console.log("TEST MODE:", process.env.CAMPAIGN_TEST_MODE);

      alert("🚀 Campaña enviada correctamente");
      setSelectedEvents([]);
    } catch (err) {
      console.error(err);
      alert("Error enviando campaña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", color: "#fff" }}>
      
      <h2 style={{ marginBottom: "20px" }}>
        📧 Envío de Campañas
      </h2>

      {/* LISTA DE EVENTOS */}
      <div style={{ display: "grid", gap: "12px" }}>
        {events.map(event => (
          <div
            key={event.id}
            style={{
              background: "#111827",
              padding: "15px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <div>
              <h4 style={{ margin: 0 }}>
                {event.title || "Evento"}
              </h4>
              <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>
                {event.date ? new Date(event.date).toLocaleDateString() : ""}
              </p>
            </div>

            <input
              type="checkbox"
              checked={selectedEvents.includes(event.id)}
              onChange={() => toggleEvent(event.id)}
              style={{ transform: "scale(1.3)" }}
            />
          </div>
        ))}
      </div>

      {/* BOTÓN ENVIAR */}
      <div style={{ marginTop: "20px" }}>
        <button
          onClick={sendCampaign}
          disabled={loading}
          style={{
            background: "#f97316",
            color: "#fff",
            border: "none",
            padding: "12px 20px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
            width: "100%"
          }}
        >
          {loading ? "Enviando..." : "🚀 Enviar Campaña"}
        </button>
      </div>

    </div>
  );
}