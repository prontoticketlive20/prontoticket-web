import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

const DEFAULT_TIME_ZONE = "America/New_York";

const TIME_ZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time — New York / Orlando / Miami" },
  { value: "America/Chicago", label: "Central Time — Chicago / Dallas / Houston" },
  { value: "America/Denver", label: "Mountain Time — Denver" },
  { value: "America/Los_Angeles", label: "Pacific Time — Los Angeles / Las Vegas" },
  { value: "America/Phoenix", label: "Arizona — Phoenix" },
  { value: "America/Puerto_Rico", label: "Atlantic Time — Puerto Rico" },
  { value: "America/Caracas", label: "Venezuela — Caracas" },
  { value: "America/Bogota", label: "Colombia — Bogotá" },
  { value: "America/Panama", label: "Panamá" },
  { value: "America/Mexico_City", label: "México — Ciudad de México" },
  { value: "Europe/Madrid", label: "España — Madrid / Barcelona / Valencia / Sevilla / Málaga" },
  { value: "Europe/London", label: "Reino Unido — Londres" },
  { value: "Europe/Paris", label: "Europa Central — París / Francia" },
  { value: "Europe/Rome", label: "Italia — Roma" },
];

export default function EventFunctionsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [functions, setFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [event, setEvent] = useState(null);

  const [date, setDate] = useState("");
  const [timeZone, setTimeZone] = useState(DEFAULT_TIME_ZONE);
  const [currency, setCurrency] = useState("USD");
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [seatmapKey, setSeatmapKey] = useState("");
  const [chartKey, setChartKey] = useState("");
  const [taxRate, setTaxRate] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTimeZone, setEditTimeZone] = useState(DEFAULT_TIME_ZONE);
  const [editCurrency, setEditCurrency] = useState("USD");
  const [editVenueName, setEditVenueName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editSeatmapKey, setEditSeatmapKey] = useState("");
  const [editChartKey, setEditChartKey] = useState("");
  const [editTaxRate, setEditTaxRate] = useState("");
  const chartRef = useRef(null);

  const toPercentValue = (decimalValue) => {
    return Number(decimalValue || 0) * 100;
  };

  const toDecimalValue = (percentValue) => {
    const n = Number(percentValue || 0);
    if (Number.isNaN(n)) return 0;
    return Number((n / 100).toFixed(4));
  };

  const getTimeZone = (value) => {
    return value || DEFAULT_TIME_ZONE;
  };

  const formatDateTimeLocal = (value, zone = DEFAULT_TIME_ZONE) => {
    if (!value) return "";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: getTimeZone(zone),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);

    const getPart = (type) =>
      parts.find((part) => part.type === type)?.value || "";

    return `${getPart("year")}-${getPart("month")}-${getPart(
      "day"
    )}T${getPart("hour")}:${getPart("minute")}`;
  };

  const formatEventDateTime = (value, zone = DEFAULT_TIME_ZONE) => {
    if (!value) return "";

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    try {
      return new Intl.DateTimeFormat("es-US", {
        timeZone: getTimeZone(zone),
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch (error) {
      console.error("Error formatting event date", error);
      return "";
    }
  };

  const getTimeZoneLabel = (zone) => {
    const normalizedZone = getTimeZone(zone);

    return (
      TIME_ZONE_OPTIONS.find((option) => option.value === normalizedZone)
        ?.label || normalizedZone
    );
  };

  const formatTaxLabel = (value) => {
    return `${toPercentValue(value)}%`;
  };

  const loadFunctions = useCallback(async () => {
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
  }, [eventId]);

  const loadEvent = useCallback(async () => {
    try {
      const res = await api.get(`/events/${eventId}`);
      const eventData = res.data?.data || null;
      setEvent(eventData);
    } catch (err) {
      console.error("Error loading event", err);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      loadFunctions();
      loadEvent();
    }
  }, [eventId, loadFunctions, loadEvent]);

  const createFunction = async () => {
    try {
      await api.post("/event-functions", {
        eventId,
        date: date || null,
        timeZone,
        currency,
        venueName,
        city,
        country,
        seatmapKey,
        chartKey,
        taxRate: toDecimalValue(taxRate),
      });

      setDate("");
      setTimeZone(DEFAULT_TIME_ZONE);
      setCurrency("USD");
      setVenueName("");
      setCity("");
      setCountry("");
      setSeatmapKey("");
      setChartKey("");
      setTaxRate("");

      loadFunctions();
    } catch (err) {
      console.error("Error creating function", err);
    }
  };

  // 🔥 NUEVO: TOGGLE
  const toggleFunction = async (id) => {
    try {
      await api.patch(`/event-functions/${id}/toggle`);
      loadFunctions();
    } catch (err) {
      console.error("Error toggling function", err);
    }
  };

  const startEdit = (f) => {
    const functionTimeZone = getTimeZone(f.timeZone);

    setEditingId(f.id);
    setEditDate(formatDateTimeLocal(f.date, functionTimeZone));
    setEditTimeZone(functionTimeZone);
    setEditCurrency(f.currency || "USD");
    setEditVenueName(f.venueName || "");
    setEditCity(f.city || "");
    setEditCountry(f.country || "");
    setEditSeatmapKey(f.seatmapKey || "");
    setEditChartKey(f.chartKey || "");
    setEditTaxRate(String(toPercentValue(f.taxRate || 0)));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDate("");
    setEditTimeZone(DEFAULT_TIME_ZONE);
    setEditCurrency("USD");
    setEditVenueName("");
    setEditCity("");
    setEditCountry("");
    setEditSeatmapKey("");
    setEditChartKey("");
    setEditTaxRate("");
  };

  const saveEdit = async (id) => {
    try {
      await api.patch(`/event-functions/${id}`, {
        date: editDate || null,
        timeZone: editTimeZone,
        currency: editCurrency,
        venueName: editVenueName,
        city: editCity,
        country: editCountry,
        seatmapKey: editSeatmapKey,
        chartKey: editChartKey,
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

          <select
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
          >
            {TIME_ZONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm"
          >
           <option value="USD">USD — Dólar estadounidense</option>
           <option value="EUR">EUR — Euro</option>
         </select>

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
            type="text"
            placeholder="Chart Key (seats.io)"
            value={chartKey}
            onChange={(e) => setChartKey(e.target.value)}
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
            <th className="text-left p-3">Huso horario</th>
            <th className="text-left p-3">Moneda</th>
            <th className="text-left p-3">Venue</th>
            <th className="text-left p-3">Ciudad</th>
            <th className="text-left p-3">País</th>
            <th className="text-left p-3">Impuesto</th>
            <th className="text-left p-3">ChartKey</th>
            <th className="text-left p-3">SeatmapKey</th>
            <th className="text-left p-3">Estado</th>
            <th className="text-left p-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {functions.length === 0 && (
            <tr>
              <td colSpan="11" className="p-4 text-white/40 text-center">
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
                    formatEventDateTime(f.date, f.timeZone)
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <select
                      value={editTimeZone}
                      onChange={(e) => setEditTimeZone(e.target.value)}
                      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm w-full"
                    >
                      {TIME_ZONE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-sm">
                      {getTimeZoneLabel(f.timeZone)}
                    </span>
                  )}
                </td>

                <td className="p-3">
                  {isEditing ? (
                    <select
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm w-full"
                >
                  <option value="USD">USD — Dólar</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              ) : (
                <span className="text-sm font-medium">
                  {f.currency || "USD"}
                </span>
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
                      type="text"
                      placeholder="Chart Key"
                      value={editChartKey}
                      onChange={(e) => setEditChartKey(e.target.value)}
                      className="bg-black/40 border border-white/10 px-3 py-2 rounded text-sm w-full"
                    />
                  ) : (
                    f.chartKey
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
                      onClick={() =>
                        navigate(`/admin/functions/${f.id}/pricing`)
                      }
                      className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm"
                    >
                      Pricing
                    </button>
                  )}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      f.isActive ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {f.isActive ? "Activa" : "Inactiva"}
                  </span>
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
                          onClick={() => toggleFunction(f.id)}
                          className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm"
                        >
                          {f.isActive ? "Desactivar" : "Activar"}
                        </button>

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

                        {/* 🔥 NUEVO BOTÓN LLAMA PLANO SEATS.IO */}
                        <button
                          onClick={() => {
                            window.open(
                              `https://app.seats.io/workspace/525c2c82-fb6b-4e5d-899f-8bed4d5c1130/charts/${f.chartKey}/events/${f.seatmapKey}`,
                              "_blank"
                            );
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded text-xs"
                        >
                          🎛Administrar Plano
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

      {selectedFunction && (
        <div style={{ marginTop: "20px" }}>
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h3 style={{ color: "#fff" }}>
              Administrar Plano: {selectedFunction.venueName || "Función"}
            </h3>

            <button
              onClick={() => setSelectedFunction(null)}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>

          {/* 🔥 IFRAME MANAGER */}
          <iframe
            ref={chartRef}
            title="Seats Manager"
            src={`https://app.seats.io/manager/#/event/${selectedFunction.seatmapKey}`}
            style={{
              width: "100%",
              height: window.innerWidth < 768 ? "500px" : "700px",
              border: "none",
              borderRadius: "12px",
              background: "#111",
            }}
          />
        </div>
      )}
    </div>
  );
}