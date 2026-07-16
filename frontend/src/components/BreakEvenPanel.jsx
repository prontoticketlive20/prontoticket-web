import React, { useEffect, useState } from "react";
import api from "../api/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function BreakEvenPanel({ eventId }) {
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState([]);
  const [cost, setCost] = useState("");
  const [result, setResult] = useState(null);

  // 🔥 SAFE HELPER (anti errores)
  const safe = (v) => Number(v || 0);

  // ===============================
  // LOAD DATA
  // ===============================
  useEffect(() => {
    if (!eventId) return;

    const loadData = async () => {
      try {
        const eventRes = await api.get(`/events/${eventId}`);
        const evt = eventRes.data?.data || eventRes.data;
        setEvent(evt);

        const statsRes = await api.get(`/admin/summary`, {
          params: { eventId },
        });

        const s = statsRes.data?.data || statsRes.data || {};
        setStats(s);
      } catch (err) {
        console.error("Error loading BreakEven:", err);
      }
    };

    loadData();
  }, [eventId]);

  // ===============================
  // CALCULAR
  // ===============================
  const calculate = () => {
    if (!stats || !cost || cost <= 0) return;

    const totalRevenue = safe(stats?.netTickets);
    const totalSales = safe(stats?.ticketsSold);

    const avgTicket =
      totalSales > 0 ? totalRevenue / totalSales : 0;

    const breakEvenTickets =
      avgTicket > 0 ? Math.ceil(cost / avgTicket) : 0;

    const remainingTickets = Math.max(
      breakEvenTickets - totalSales,
      0
    );

    let eventDate = null;

    if (event?.functions?.length > 0) {
      eventDate = new Date(event.functions[0].date);
    } else if (event?.date) {
      eventDate = new Date(event.date);
    }

    const today = new Date();

    let daysRemaining = 0;

    if (eventDate && !isNaN(eventDate)) {
      const diffTime = eventDate - today;
      daysRemaining = Math.max(
        Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
        1
      );
    }

    const ticketsPerDay =
      daysRemaining > 0
        ? Math.ceil(remainingTickets / daysRemaining)
        : 0;

    const progress =
      breakEvenTickets > 0
        ? Math.min((totalSales / breakEvenTickets) * 100, 100)
        : 0;

    const velocityActual =
      daysRemaining > 0
        ? totalSales / Math.max(daysRemaining, 1)
        : totalSales;

    const velocityRequired = ticketsPerDay;

    const projectedFinalSales =
      totalSales + velocityActual * daysRemaining;

    let status = "neutral";
    let message = "";

    if (progress >= 100) {
      status = "success";
      message = "🔥 Ya superaste el Break Even";
    } else if (velocityActual >= velocityRequired) {
      status = "good";
      message = "🟢 Vas por buen camino";
    } else if (velocityActual >= velocityRequired * 0.7) {
      status = "warning";
      message = "🟡 Vas justo, necesitas empujar ventas";
    } else {
      status = "danger";
      message = "🔴 Vas atrasado, necesitas acción urgente";
    }

    setResult({
      totalRevenue,
      totalSales,
      avgTicket,
      breakEvenTickets,
      remainingTickets,
      daysRemaining,
      ticketsPerDay,
      progress,
      projectedFinalSales,
      velocityActual,
      velocityRequired,
      status,
      message,
    });
  };

  // ===============================
  // CHART DATA
  // ===============================
  const generateChartData = () => {
    if (!result) return [];

    const data = [];
    const totalDays = result.daysRemaining;

    for (let i = 0; i <= totalDays; i++) {
      const projected =
        result.totalSales + result.velocityActual * i;

      const ideal =
        result.breakEvenTickets * (i / totalDays);

      data.push({
        day: i,
        projected: Math.round(projected),
        ideal: Math.round(ideal),
      });
    }

    return data;
  };

  // ===============================
  const getProgressColor = (progress) => {
    if (progress < 40) return "bg-red-500";
    if (progress < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 mt-6">
      <h3 className="text-white text-lg font-semibold mb-4">
        🎯 Break Even Inteligente
      </h3>

      <div className="flex gap-3 mb-4">
        <input
          type="number"
          placeholder="Costo total del evento"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          className="flex-1 p-3 rounded-lg bg-zinc-800 text-white"
        />

        <button
          onClick={calculate}
          className="bg-blue-600 px-4 rounded-lg text-white"
        >
          Calcular
        </button>
      </div>

      {result && (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Card label="Revenue" value={`$${safe(result.totalRevenue).toFixed(2)}`} />
            <Card label="Tickets vendidos" value={result.totalSales} />
            <Card label="Ticket promedio" value={`$${safe(result.avgTicket).toFixed(2)}`} />
            <Card label="Break Even" value={result.breakEvenTickets} />
            <Card label="Faltan" value={result.remainingTickets} />
            <Card label="Días restantes" value={result.daysRemaining} />
            <Card label="Tickets/día requerido" value={result.ticketsPerDay} highlight />
            <Card label="Proyección final" value={Math.round(result.projectedFinalSales)} />
          </div>

          {/* PROGRESO */}
          <div className="mt-6">
            <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
              <div
                className={`${getProgressColor(result.progress)} h-3`}
                style={{ width: `${result.progress}%` }}
              />
            </div>

            <p className="text-xs mt-2 text-white">
              {safe(result.progress).toFixed(1)}%
            </p>
          </div>

          {/* ALERTA */}
          <div className="mt-4 text-center">
            <p
              className={`font-semibold ${
                result.status === "danger"
                  ? "text-red-400"
                  : result.status === "warning"
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {result.message}
            </p>
          </div>

          {/* VELOCIDAD */}
          <div className="mt-4 text-xs text-center text-zinc-400">
            Velocidad actual: {safe(result.velocityActual).toFixed(2)} tickets/día •
            Necesario: {result.velocityRequired}
          </div>

          {/* CHART */}
          <div className="mt-8">
            <h4 className="text-white text-sm mb-2">
              📈 Proyección de ventas vs objetivo
            </h4>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={generateChartData()}>
                <CartesianGrid stroke="#333" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="ideal"
                  stroke="#facc15"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ===============================
function Card({ label, value, highlight }) {
  return (
    <div
      className={`p-3 rounded-xl ${
        highlight ? "bg-blue-600" : "bg-zinc-800"
      }`}
    >
      <p className="text-zinc-400 text-xs">{label}</p>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}