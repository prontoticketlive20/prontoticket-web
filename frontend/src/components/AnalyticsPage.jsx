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
  
export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  const [events, setEvents] = useState([]);
  
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [eventId, setEventId] = useState("");
  
  useEffect(() => {
    load();
    // eslint-disable-next-Line react-hooks/exhaustive-deps 
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
    const eventsRes = await api.get("events");
    setEvents(eventsRes.data.data);

    // 🔥 3. Guardar data
    setData(res.data.data);

  } catch (error) {
    console.error("ERROR ANALYTICS:", error);
  }
};

  if (!data) return <div style={{ color: "#fff" }}>Loading...</div>;

  const { summary, byEvent, byDate } = data;

// 🔥 SIMULACIÓN DE TENDENCIA (hasta que hagamos backend real por fecha)
const chartData = (data.byDate || []).map((d) => ({
  date: d.date,
  revenue: d.revenue || 0,
}));

const totalRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);

const prev = chartData[chartData.length - 2]?.revenue || 0;
const last = chartData[chartData.length - 1]?.revenue || 0;

const growth = prev > 0 ? (((last - prev) / prev) * 100).toFixed(1) : 0;

  const conversionRate =
    summary.views > 0
      ? ((summary.purchases / summary.views) * 100).toFixed(2)
      : 0;

   const conversionClick =
      summary.clicks > 0
      ? ((summary.purchases / summary.clicks) * 100).toFixed(2)
      : 0;

   const avgTicket =
      summary.purchases > 0
      ? (summary.revenue / summary.purchases).toFixed(2)
      : 0; 

    const maxRevenue = Math.max(
       ...(byEvent || []).map((e) => e.revenue || 0),
       1
      );

    const maxViews = summary.views || 1;

    const viewsPct = 100;
    const clicksPct = ((summary.clicks / maxViews) * 100).toFixed(1);
    const purchasesPct = ((summary.purchases / maxViews) * 100).toFixed(1);

    // 🔥 EVENTO TOP (más revenue)
const topEvent = (byEvent || [])[0];

// 🔥 EVENTO CON MEJOR CONVERSIÓN
const bestConversionEvent = (byEvent || []).reduce((best, current) => {
  const currentRate =
    current.views > 0
      ? current.purchases / current.views
      : 0;

  const bestRate =
    best?.views > 0
      ? best.purchases / best.views
      : 0;

  return currentRate > bestRate ? current : best;
}, null);

// 🔥 EVENTO CON BAJA CONVERSIÓN (pero con tráfico)
const weakEvent = (byEvent || []).find((e) =>
  e.views > 50 && e.purchases === 0
);    

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
      <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
  <Card
    title="Views"
    value={summary.views}
    icon="👁"
    color="#00d4ff"
  />

  <Card
    title="Clicks"
    value={summary.clicks}
    icon="🖱"
    color="#a855f7"
  />

  <Card
    title="Purchases"
    value={summary.purchases}
    icon="🎟"
    color="#22c55e"
  />

  <Card
    title="Revenue"
    value={`$${summary.revenue}`}
    icon="💰"
    color="#f59e0b"
  />

  <Card
    title="Conversion Rate"
    value={`${conversionRate}%`}
    icon="📊"
    color="#38bdf8"
  />

  <Card
  title="Conversion (Clicks)"
  value={`${conversionClick}%`}
  icon="⚡"
  color="#f43f5e"
/>

<Card
  title="Avg Ticket"
  value={`$${avgTicket}`}
  icon="🎫"
  color="#f97316"
/>

</div>

{/* 🔥 GRÁFICA */}
<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
  <h3 style={{ marginTop: 40 }}>📈 Revenue Trend</h3>

  <span
    style={{
      background: growth >= 0 ? "#00ffae20" : "#ff4d4d20",
      color: growth >= 0 ? "#00ffae" : "#ff4d4d",
      padding: "4px 10px",
      borderRadius: 10,
      fontSize: 12,
    }}
  >
    {growth >= 0 ? "▲" : "▼"} {growth}%
  </span>
</div>

<div
  style={{
    marginTop: 20,
    background: "#1a1a1a",
    padding: 20,
    borderRadius: 16,
    border: "1px solid #2a2a2a",
  }}
>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={chartData}> 

  <defs>
    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#00ffcc" stopOpacity={0.8} />
      <stop offset="100%" stopColor="#00ffcc" stopOpacity={0} />
    </linearGradient>
  </defs>

     <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />

      <XAxis
        dataKey="date"
        stroke="#aaa"
        tick={{ fontSize: 12 }}
      />

      <YAxis
        stroke="#aaa"
        tick={{ fontSize: 12 }}
      />

      <Tooltip
  content={({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "#111",
            border: "1px solid #333",
            padding: 10,
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 12, color: "#aaa" }}>
            {payload[0].payload.date}
          </div>
          <div style={{ fontSize: 14, fontWeight: "bold" }}>
            💰 ${payload[0].value}
          </div>
        </div>
      );
    }
    return null;
  }}
/>

      <Line
        type="monotone"
        dataKey="revenue"
        stroke="#00ffcc"
        strokeWidth={3}
        dot={{ r: 3 }}
        activeDot={{ r: 6 }}
        fill="url(#colorRevenue)"
      />
    </LineChart>
  </ResponsiveContainer>
</div>

{/* 🔥 FUNNEL DE CONVERSIÓN */}
<h3 style={{ marginTop: 50 }}>🚀 Conversion Funnel</h3>

<div style={{
  marginTop: 20,
  background: "#1a1a1a",
  padding: 20,
  borderRadius: 16,
  border: "1px solid #2a2a2a",
}}>

  {/* Views */}
  <div style={{ marginBottom: 15 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>👁 Views</span>
      <span>{viewsPct}%</span>
    </div>
    <div style={{
      height: 8,
      background: "#2a2a2a",
      borderRadius: 10,
      marginTop: 5,
    }}>
      <div style={{
        width: `${viewsPct}%`,
        background: "#00d4ff",
        height: "100%",
        borderRadius: 10,
      }} />
    </div>
  </div>

  {/* Clicks */}
  <div style={{ marginBottom: 15 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>🖱 Clicks</span>
      <span>{clicksPct}%</span>
    </div>
    <div style={{
      height: 8,
      background: "#2a2a2a",
      borderRadius: 10,
      marginTop: 5,
    }}>
      <div style={{
        width: `${clicksPct}%`,
        background: "#a855f7",
        height: "100%",
        borderRadius: 10,
      }} />
    </div>
  </div>

  {/* Purchases */}
  <div>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>🎟 Purchases</span>
      <span>{purchasesPct}%</span>
    </div>
    <div style={{
      height: 8,
      background: "#2a2a2a",
      borderRadius: 10,
      marginTop: 5,
    }}>
      <div style={{
        width: `${purchasesPct}%`,
        background: "#22c55e",
        height: "100%",
        borderRadius: 10,
      }} />
    </div>
  </div>

</div>

      {/* 🔥 TOP EVENTOS */}
      <h3 style={{ marginTop: 50 }}>🏆 Top Eventos</h3>

<div
  style={{
    marginTop: 20,
    background: "#1a1a1a",
    padding: 20,
    borderRadius: 16,
    border: "1px solid #2a2a2a",
  }}
>
  {(byEvent || []).map((item, index) => {
    const percent = (item.revenue / maxRevenue) * 100;

    return (
      <div key={item.eventId} style={{ marginBottom: 18 }}>
        
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 5
        }}>
          <span>
            <strong>#{index + 1}</strong> — {item.eventName}
          </span>
          <span>💰 ${item.revenue}</span>
        </div>

        {/* Barra */}
        <div
          style={{
            height: 8,
            background: "#2a2a2a",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              borderRadius: 10,
              background:
                "linear-gradient(90deg, #00ffcc, #007aff)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>
    );
  })}
</div>

{/* 🔥 INSIGHTS AUTOMÁTICOS */}
<h3 style={{ marginTop: 50 }}>🧠 Insights</h3>

<div
  style={{
    marginTop: 20,
    background: "#1a1a1a",
    padding: 20,
    borderRadius: 16,
    border: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  }}
>
  {topEvent && (
    <div style={{ color: "#22c55e" }}>
      🔥 <strong>{topEvent.eventName}</strong> es el evento con mayor revenue
    </div>
  )}

  {bestConversionEvent && (
    <div style={{ color: "#38bdf8" }}>
      📈 <strong>{bestConversionEvent.eventName}</strong> tiene la mejor conversión
    </div>
  )}

  {weakEvent && (
    <div style={{ color: "#f59e0b" }}>
      ⚠ <strong>{weakEvent.eventName}</strong> tiene tráfico pero no está convirtiendo
    </div>
  )}
</div>

    </div>
  );
}

/* 🔥 COMPONENTES */

function Card({ title, value, icon, color }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        background: "#1a1a1a",
        borderRadius: 16,
        padding: 20,
        border: "1px solid #2a2a2a",
        position: "relative",
        overflow: "hidden",
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          background: color + "30",
          borderRadius: "50%",
          filter: "blur(30px)",
        }}
      />

      {/* Icono */}
      <div style={{ fontSize: 18, marginBottom: 10 }}>{icon}</div>

      {/* Título */}
      <div style={{ fontSize: 12, opacity: 0.6 }}>{title}</div>

      {/* Valor */}
      <div style={{ fontSize: 26, fontWeight: "bold", marginTop: 5 }}>
        {value}
      </div>
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