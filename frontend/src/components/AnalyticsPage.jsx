import React, { useEffect, useState } from "react";
import api from "../api/api";

function LineChart({ data }) {
  const width = 600;
  const height = 200;
  const padding = 40;

  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map(d => d.value), 1);

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / (data.length - 1 || 1);
    const y = height - padding - (d.value / max) * (height - padding * 2);
    return { x, y, value: d.value };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <svg width="100%" height={height}>
      {/* línea */}
      <path
        d={path}
        fill="none"
        stroke="#00ffaa"
        strokeWidth="3"
        style={{ filter: "drop-shadow(0 0 6px #00ffaa)" }}
      />

      {/* puntos */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="#007aff"
        />
      ))}
    </svg>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  const [events, setEvents] = useState([]);
  
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [eventId, setEventId] = useState("");

  // eslint-disable-next-Line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, []);

  const load = async () => {
  try {
    
    // 🔥 1. Traer analytics con filtros
    const res = await api.get("orders/analytics/dashboard", {
      params: {
        from,
        to,
        eventId,
      },
    });

    // 🔥 2. Traer eventos (SEPARADO)
    const eventsRes = await api.get("orders/analytics/events");
    setEvents(eventsRes.data.data);

    // 🔥 3. Guardar data
    setData(res.data.data);

  } catch (error) {
    console.error("ERROR ANALYTICS:", error);
  }
};

  if (!data) return <div style={{ color: "#fff" }}>Loading...</div>;

  const { summary, byEvent } = data;

// 🔥 SIMULACIÓN DE TENDENCIA (hasta que hagamos backend real por fecha)
const chartData = (byEvent || []).slice(0, 6).map((e, i) => ({
  label: e.eventName,
  value: e.revenue || 0,
}));

  const conversionRate =
    summary.views > 0
      ? ((summary.purchases / summary.views) * 100).toFixed(2)
      : 0;

  const maxRevenue = Math.max(...(byEvent || []).map(e => e.revenue || 0), 1);

  return (
    <div style={{ padding: 24, color: "#fff" }}>
      
      <h2 style={{ marginBottom: 20 }}>📊 Analytics Dashboard</h2>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>

  <input
  type="date"
  value={from}
  onChange={(e) => setFrom(e.target.value)}
  className="px-3 py-2 rounded-xl bg-[#1a1a1a] text-white border border-white/10 focus:outline-none focus:border-[#7c3aed]"
/>

<input
  type="date"
  value={to}
  onChange={(e) => setTo(e.target.value)}
  className="px-3 py-2 rounded-xl bg-[#1a1a1a] text-white border border-white/10 focus:outline-none focus:border-[#7c3aed]"
/>

<select
  value={eventId}
  onChange={(e) => setEventId(e.target.value)}
  className="px-3 py-2 rounded-xl bg-[#1a1a1a] text-white border border-white/10 focus:outline-none focus:border-[#7c3aed]"
>
  <option value="">🎟 Todos los eventos</option>

  {events.map((e) => (
    <option key={e.id} value={e.id}>
      {e.title}
    </option>
  ))}
</select>

  <button
  onClick={load}
  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white font-semibold shadow-lg shadow-[#7c3aed]/30 hover:brightness-110 active:scale-[0.98] transition"
  type="button"
>
  <span>📊</span>
  <span className="text-sm">Filtrar</span>
</button>

</div>      

      {/* 🔥 KPIs */}
      <div style={grid}>
        <Card title="Views" value={summary.views} />
        <Card title="Clicks" value={summary.clicks} />
        <Card title="Purchases" value={summary.purchases} />
        <Card title="Revenue" value={`$${summary.revenue}`} highlight />
        <Card title="Conversion" value={`${conversionRate}%`} />
      </div>

{/* 🔥 GRÁFICA */}
<h3 style={{ marginTop: 40 }}>📈 Revenue Trend</h3>

<div
  style={{
    background: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #2a2a2a",
    marginTop: 10,
  }}
>
  <LineChart data={chartData} />
</div>

      {/* 🔥 TOP EVENTOS */}
      <h3 style={{ marginTop: 40 }}>🔥 Top Eventos</h3>

      <div style={{ marginTop: 20 }}>
        {(byEvent || []).map((item, index) => {
          const { eventId, eventName, views, clicks, purchases, revenue } = item;

          const percent = (revenue / maxRevenue) * 100;

          return (
            <div key={eventId} style={eventCard}>
              
              {/* HEADER */}
              <div style={{ marginBottom: 8 }}>
                <strong>#{index + 1}</strong> — {eventName}
              </div>

              {/* BARRA DE INGRESO */}
              <div style={barContainer}>
                <div
                  style={{
                    ...barFill,
                    width: `${percent}%`,
                  }}
                />
              </div>

              {/* STATS */}
              <div style={row}>
                <Stat label="👁 Views" value={views} />
                <Stat label="🖱 Clicks" value={clicks} />
                <Stat label="🎟 Purchases" value={purchases} />
                <Stat label="💰 Revenue" value={`$${revenue}`} highlight />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 🔥 COMPONENTES */

function Card({ title, value, highlight }) {
  return (
    <div
      style={{
        background: highlight
          ? "linear-gradient(135deg, #00ffaa20, #00ffaa10)"
          : "#1a1a1a",
        padding: 20,
        borderRadius: 14,
        flex: 1,
        minWidth: 140,
        border: "1px solid #2a2a2a",
        boxShadow: highlight
          ? "0 0 20px #00ffaa33"
          : "0 0 10px #000",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.6 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div
      style={{
        background: highlight ? "#00ffaa20" : "#111",
        padding: "6px 10px",
        borderRadius: 8,
        fontSize: 13,
      }}
    >
      {label}: <strong>{value}</strong>
    </div>
  );
}

/* 🎨 ESTILOS */

const grid = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
};

const eventCard = {
  background: "#1a1a1a",
  padding: 16,
  borderRadius: 12,
  marginBottom: 14,
  border: "1px solid #2a2a2a",
};

const row = {
  display: "flex",
  gap: 10,
  marginTop: 10,
  flexWrap: "wrap",
};

const barContainer = {
  width: "100%",
  height: 6,
  background: "#111",
  borderRadius: 10,
  overflow: "hidden",
};

const barFill = {
  height: "100%",
  background: "linear-gradient(90deg, #00ffaa, #007aff)",
  transition: "width 0.4s ease",
};