import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function EventFunctionsPage() {

  const { eventId } = useParams();
  const navigate = useNavigate();

  const [functions, setFunctions] = useState([]);
  const [event, setEvent] = useState(null);

  const [date, setDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [seatmapKey, setSeatmapKey] = useState("");

  const loadFunctions = async () => {

    try {

      const res = await api.get(`/event-functions/event/${eventId}`);
      const functionsData = res.data?.data || [];

      setFunctions(
        functionsData.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        )
      );

    } catch (err) {

      console.error("Error loading functions", err);
      setFunctions([]);

    }

  };

  const loadEvent = async () => {

    try {

      const res = await api.get(`/events/${eventId}`);
      const eventData = res.data?.data || null;
      setEvent(eventData);

    } catch (err) {

      console.error("Error loading event", err);

    }

  };

  useEffect(() => {

  const loadFunctions = async () => {

    try {

      const res = await api.get(`/event-functions/event/${eventId}`);

      const functionsData = res.data?.data || [];

      setFunctions(
        functionsData.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        )
      );

    } catch (err) {

      console.error("Error loading functions", err);
      setFunctions([]);

    }

  };

  const loadEvent = async () => {

    try {

      const res = await api.get(`/events/${eventId}`);

      const eventData = res.data?.data || null;

      setEvent(eventData);

    } catch (err) {

      console.error("Error loading event", err);

    }

  };

  if (eventId) {

    loadFunctions();
    loadEvent();

  }

}, [eventId]);

  const createFunction = async () => {

    try {

      await api.post("/event-functions", {
        eventId,
        date,
        venueName,
        city,
        country,
        seatmapKey
      });

      setDate("");
      setVenueName("");
      setCity("");
      setCountry("");
      setSeatmapKey("");

      loadFunctions();

    } catch (err) {

      console.error("Error creating function", err);

    }

  };

  const deleteFunction = async (id) => {

    if (!window.confirm("¿Eliminar esta función?")) return;

    try {

      await api.delete(`/event-functions/${id}`);
      loadFunctions();

    } catch (err) {

      console.error("Error deleting function", err);

    }

  };

  return (

    <div className="p-6 text-white">

      <div className="mb-6">

        <h2 className="text-xl font-semibold">
          Funciones del Evento ({functions.length})
        </h2>

        {event && (
          <p className="text-white/60 text-sm mt-1">
            {event.title}
          </p>
        )}

      </div>

      {/* FORMULARIO */}

      <div className="flex gap-3 mb-6 flex-wrap">

        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
        />

        <input
          placeholder="Venue"
          value={venueName}
          onChange={(e) => setVenueName(e.target.value)}
          className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
        />

        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
        />

        <input
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
        />

        <input
          placeholder="seatmapKey (seats.io)"
          value={seatmapKey}
          onChange={(e) => setSeatmapKey(e.target.value)}
          className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
        />

        <button
          onClick={createFunction}
          className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm"
        >
          Crear función
        </button>

      </div>

      {/* TABLA */}

      <table className="w-full border border-white/10 rounded overflow-hidden">

        <thead className="bg-white/5">

          <tr>
            <th className="text-left p-3">Fecha</th>
            <th className="text-left p-3">Venue</th>
            <th className="text-left p-3">Ciudad</th>
            <th className="text-left p-3">País</th>
            <th className="text-left p-3">Pricing</th>
            <th className="text-left p-3">Acciones</th>
          </tr>

        </thead>

        <tbody>

          {functions.length === 0 && (

            <tr>
              <td colSpan="6" className="p-4 text-white/40 text-center">
                Este evento aún no tiene funciones
              </td>
            </tr>

          )}

          {functions.map((f) => (

            <tr key={f.id} className="border-t border-white/10">

              <td className="p-3">
                {new Date(f.date).toLocaleString()}
              </td>

              <td className="p-3">
                {f.venueName}
              </td>

              <td className="p-3">
                {f.city}
              </td>

              <td className="p-3">
                {f.country}
              </td>

              <td className="p-3">

                <button
                  onClick={() => navigate(`/admin/functions/${f.id}/pricing`)}
                  className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm"
                >
                  Pricing
                </button>

              </td>

              <td className="p-3">

                <button
                  onClick={() => deleteFunction(f.id)}
                  className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
                >
                  Eliminar
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}