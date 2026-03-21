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
  const [taxRate, setTaxRate] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editVenueName, setEditVenueName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editSeatmapKey, setEditSeatmapKey] = useState("");
  const [editTaxRate, setEditTaxRate] = useState("");

  const toPercentValue = (decimalValue) => {
    return Number(decimalValue || 0) * 100;
  };

  const toDecimalValue = (percentValue) => {
    const n = Number(percentValue || 0);
    if (Number.isNaN(n)) return 0;
    return Number((n / 100).toFixed(4));
  };

  const formatDateTimeLocal = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const formatTaxLabel = (value) => {
    return `${toPercentValue(value)}%`;
  };

  const loadFunctions = async () => {
    try {
      const res = await api.get(`/event-functions/event/${eventId}`);
      const functionsData = res.data?.data || [];

      setFunctions(
        functionsData.sort((a, b) => new Date(a.date) - new Date(b.date))
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
        seatmapKey,
        taxRate: toDecimalValue(taxRate),
      });

      setDate("");
      setVenueName("");
      setCity("");
      setCountry("");
      setSeatmapKey("");
      setTaxRate("");

      loadFunctions();
    } catch (err) {
      console.error("Error creating function", err);
    }
  };

  const startEdit = (f) => {
    setEditingId(f.id);
    setEditDate(formatDateTimeLocal(f.date));
    setEditVenueName(f.venueName || "");
    setEditCity(f.city || "");
    setEditCountry(f.country || "");
    setEditSeatmapKey(f.seatmapKey || "");
    setEditTaxRate(String(toPercentValue(f.taxRate || 0)));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDate("");
    setEditVenueName("");
    setEditCity("");
    setEditCountry("");
    setEditSeatmapKey("");
    setEditTaxRate("");
  };

  const saveEdit = async (id) => {
    try {
      await api.patch(`/event-functions/${id}`, {
        date: editDate,
        venueName: editVenueName,
        city: editCity,
        country: editCountry,
        seatmapKey: editSeatmapKey,
        taxRate: toDecimalValue(editTaxRate),
      });

      cancelEdit();
      loadFunctions();
    } catch (err) {
      console.error("Error updating function", err);
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

        {event && <p className="text-white/60 text-sm mt-1">{event.title}</p>}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
        <h3 className="text-base font-semibold mb-4">Crear nueva función</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
            placeholder="SeatmapKey (seats.io)"
            value={seatmapKey}
            onChange={(e) => setSeatmapKey(e.target.value)}
            className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Impuesto (%) ej: 8"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
          />
        </div>

        <div className="mt-4">
          <button
            onClick={createFunction}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm"
          >
            Crear función
          </button>
        </div>
      </div>

      <table className="w-full border border-white/10 rounded overflow-hidden">
        <thead className="bg-white/5">
          <tr>
            <th className="text-left p-3">Fecha</th>
            <th className="text-left p-3">Venue</th>
            <th className="text-left p-3">Ciudad</th>
            <th className="text-left p-3">País</th>
            <th className="text-left p-3">Impuesto</th>
            <th className="text-left p-3">Pricing</th>
            <th className="text-left p-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {functions.length === 0 && (
            <tr>
              <td colSpan="7" className="p-4 text-white/40 text-center">
                Este evento aún no tiene funciones
              </td>
            </tr>
          )}

          {functions.map((f) => {
            const isEditing = editingId === f.id;

            return (
              <tr key={f.id} className="border-t border-white/10 align-top">
                <td className="p-3">
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm w-full"
                    />
                  ) : (
                    new Date(f.date).toLocaleString()
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      value={editVenueName}
                      onChange={(e) => setEditVenueName(e.target.value)}
                      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm w-full"
                    />
                  ) : (
                    f.venueName
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm w-full"
                    />
                  ) : (
                    f.city
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm w-full"
                    />
                  ) : (
                    f.country
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editTaxRate}
                      onChange={(e) => setEditTaxRate(e.target.value)}
                      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm w-28"
                    />
                  ) : (
                    <span className="inline-block px-2 py-1 rounded bg-white/10 text-sm">
                      {formatTaxLabel(f.taxRate || 0)}
                    </span>
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <input
                      value={editSeatmapKey}
                      onChange={(e) => setEditSeatmapKey(e.target.value)}
                      placeholder="SeatmapKey"
                      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm w-full"
                    />
                  ) : (
                    <button
                      onClick={() => navigate(`/admin/functions/${f.id}/pricing`)}
                      className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm"
                    >
                      Pricing
                    </button>
                  )}
                </td>

                <td className="p-3">
                  <div className="flex gap-2 flex-wrap">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(f.id)}
                          className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-sm"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(f)}
                          className="bg-amber-600 hover:bg-amber-500 px-3 py-1 rounded text-sm"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => deleteFunction(f.id)}
                          className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}