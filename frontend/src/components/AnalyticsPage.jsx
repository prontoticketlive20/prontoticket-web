import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import logoPronto from "../assets/logo-prontoticketlive.png";
import React, { useEffect, useRef, useState } from "react";
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
import PlatformPerformance from "../components/PlatformPerformance";

export default function AnalyticsPage() {
  const reportRef = useRef(null);
  const pdfReportRef = useRef(null);
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [eventId, setEventId] = useState("");
  const [showAllEvents, setShowAllEvents] = useState(false);

  const [platformStats, setPlatformStats] = useState([]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  if (eventId) {
    loadPlatformStats();
  }
}, [eventId]);

  const money = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const number = (value) =>
    new Intl.NumberFormat("en-US").format(Number(value || 0));

  const percent = (value) => `${Number(value || 0).toFixed(2)}%`;

  const setQuickRange = (range) => {
    const today = new Date();
    const end = today.toISOString().split("T")[0];

    const startDate = new Date(today);

    if (range === "today") {
      setFrom(end);
      setTo(end);
      return;
    }

    if (range === "7d") {
      startDate.setDate(today.getDate() - 7);
    }

    if (range === "30d") {
      startDate.setDate(today.getDate() - 30);
    }

    if (range === "month") {
      startDate.setDate(1);
    }

    setFrom(startDate.toISOString().split("T")[0]);
    setTo(end);
  };

  const load = async () => {
    try {
      const res = await api.get("/orders/analytics/dashboard", {
        params: {
          from,
          to,
          eventId,
        },
      });

      const eventsRes = await api.get("/events");

      const eventsList =
      eventsRes.data?.data ||
      eventsRes.data ||
      [];

      setEvents(Array.isArray(eventsList) ? eventsList : []);
      setData(res.data.data);

      console.log("📊 ANALYTICS DATA:", res.data.data);
    } catch (error) {
      console.error("ERROR ANALYTICS:", error);
    }
  };

     const loadPlatformStats = async () => {
  try {
    if (!eventId) {
      setPlatformStats([]);
      return;
    }

    const res = await api.get(`/orders/analytics/platform/${eventId}`);

    console.log("📊 Platform stats:", res.data);

    setPlatformStats(res.data.data || []);
  } catch (error) {
    console.error("❌ Error loading platform stats:", error);
    setPlatformStats([]);
  }
};

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white p-10">
        Loading...
      </div>
    );
  }

  const { summary, byEvent, byDate } = data;

  const chartData = (byDate || []).map((d) => ({
    date: d.date,
    revenue: Number((d.revenue || 0).toFixed(2)),
  }));

  const prev = chartData[chartData.length - 2]?.revenue || 0;
  const last = chartData[chartData.length - 1]?.revenue || 0;

  const growth = prev > 0 ? (((last - prev) / prev) * 100).toFixed(1) : 0;

  const conversionRate =
    summary.views > 0 ? (summary.purchases / summary.views) * 100 : 0;

  const conversionClick =
    summary.clicks > 0 ? (summary.purchases / summary.clicks) * 100 : 0;

  const avgTicket =
    summary.purchases > 0 ? summary.revenue / summary.purchases : 0;

  const revenuePerView =
    summary.views > 0 ? summary.revenue / summary.views : 0;

  const revenuePerClick =
    summary.clicks > 0 ? summary.revenue / summary.clicks : 0;

  const maxRevenue = Math.max(
    ...(byEvent || []).map((e) => Number(e.revenue || 0)),
    1
  );

  const maxViews = summary.views || 1;

  const viewsPct = 100;
  const clicksPct = (summary.clicks / maxViews) * 100;
  const purchasesPct = (summary.purchases / maxViews) * 100;

  const topEvent = (byEvent || [])[0];

  const bestConversionEvent = (byEvent || []).reduce((best, current) => {
    const currentRate =
      current.views > 0 ? current.purchases / current.views : 0;

    const bestRate = best?.views > 0 ? best.purchases / best.views : 0;

    return currentRate > bestRate ? current : best;
  }, null);

  const weakEvent = (byEvent || []).find(
    (e) => e.views > 50 && e.purchases === 0
  );

  const visibleEvents = showAllEvents ? byEvent || [] : (byEvent || []).slice(0, 10);

  const exportToExcel = () => {
  const reportDate = new Date().toLocaleString();

  const summarySheet = [
    ["ProntoTicketLive Analytics Report"],
    ["Fecha del reporte", reportDate],
    [""],
    ["Resumen"],
    ["Revenue", money(summary.revenue)],
    ["Purchases", number(summary.purchases)],
    ["Views", number(summary.views)],
    ["Clicks", number(summary.clicks)],
    ["Conversion Rate", percent(conversionRate)],
    ["Conversion Clicks", percent(conversionClick)],
    ["Avg Ticket", money(avgTicket)],
    ["Revenue por View", money(revenuePerView)],
    ["Revenue por Click", money(revenuePerClick)],
  ];

  const eventsSheet = (byEvent || []).map((item, index) => {
    const eventConversion =
      item.views > 0
        ? Number(((item.purchases / item.views) * 100).toFixed(2))
        : 0;

    const eventAvgTicket =
      item.purchases > 0
        ? Number((item.revenue / item.purchases).toFixed(2))
        : 0;

    return {
      Ranking: index + 1,
      Evento: item.eventName,
      Views: item.views || 0,
      Clicks: item.clicks || 0,
      Purchases: item.purchases || 0,
      Revenue: Number(item.revenue || 0),
      "Conversion Rate": `${eventConversion}%`,
      "Avg Ticket": eventAvgTicket,
    };
  });

  const workbook = XLSX.utils.book_new();

  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summarySheet);
  const eventsWorksheet = XLSX.utils.json_to_sheet(eventsSheet);

  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Resumen");
  XLSX.utils.book_append_sheet(workbook, eventsWorksheet, "Eventos");

  XLSX.writeFile(workbook, "ProntoTicketLive_Analytics_Report.xlsx");
};

  const exportToPDF = async () => {
  try {
    const input = pdfReportRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#000000",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("ProntoTicketLive_Analytics_Report.pdf");
  } catch (error) {
    console.error("Error exportando PDF:", error);
    alert("No se pudo exportar el PDF");
  }
};

  return (
    <div
  ref={reportRef}
  className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 py-6"
>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
  <div>
    <h2 className="text-2xl sm:text-3xl font-bold">
      📊 Analytics Dashboard
    </h2>
    <p className="text-white/50 text-sm mt-1">
      Rendimiento general de eventos, ventas, revenue y conversión.
    </p>
  </div>

  <button
    onClick={exportToExcel}
    className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold shadow-lg shadow-green-500/20 hover:brightness-110 active:scale-[0.98] transition"
    type="button"
  >
    📊 Exportar Excel
  </button>

   <button
  onClick={exportToPDF}
  className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.98] transition"
  type="button"
>
  📄 Exportar PDF
</button>
</div>

      {/* FILTROS */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-3 rounded-xl bg-[#1a1a1a] text-white border border-white/10 focus:outline-none focus:border-[#7c3aed]"
          />

          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-3 rounded-xl bg-[#1a1a1a] text-white border border-white/10 focus:outline-none focus:border-[#7c3aed]"
          />

          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="px-3 py-3 rounded-xl bg-[#1a1a1a] text-white border border-white/10 focus:outline-none focus:border-[#7c3aed] sm:col-span-2"
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
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white font-semibold shadow-lg shadow-[#7c3aed]/30 hover:brightness-110 active:scale-[0.98] transition"
            type="button"
          >
            <span>📊</span>
            <span className="text-sm">Filtrar</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <QuickButton label="Hoy" onClick={() => setQuickRange("today")} />
          <QuickButton label="7 días" onClick={() => setQuickRange("7d")} />
          <QuickButton label="30 días" onClick={() => setQuickRange("30d")} />
          <QuickButton label="Este mes" onClick={() => setQuickRange("month")} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4 mb-8">
        <Card title="Revenue" value={money(summary.revenue)} icon="💰" color="#f59e0b" />
        <Card title="Purchases" value={number(summary.purchases)} icon="🎟" color="#22c55e" />
        <Card title="Conversion" value={percent(conversionRate)} icon="📊" color="#38bdf8" />
        <Card title="Avg Ticket" value={money(avgTicket)} icon="🎫" color="#f97316" />
        <Card title="Views" value={number(summary.views)} icon="👁" color="#00d4ff" />
        <Card title="Clicks" value={number(summary.clicks)} icon="🖱" color="#a855f7" />
        <Card title="Click Conv." value={percent(conversionClick)} icon="⚡" color="#f43f5e" />
      </div>

      {/* MÉTRICAS EXTRA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <MiniMetric
          title="Revenue por vista"
          value={money(revenuePerView)}
          description="Cuánto produce cada visita en promedio."
        />
        <MiniMetric
          title="Revenue por click"
          value={money(revenuePerClick)}
          description="Cuánto produce cada click en promedio."
        />
      </div>

      {/* GRÁFICA */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg sm:text-xl font-bold">📈 Revenue Trend</h3>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            Number(growth) >= 0
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {Number(growth) >= 0 ? "▲" : "▼"} {growth}%
        </span>
      </div>

      <div className="bg-[#1a1a1a] p-4 sm:p-5 rounded-2xl border border-white/10 mb-10">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ffcc" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#00ffcc" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />

            <XAxis dataKey="date" stroke="#aaa" tick={{ fontSize: 11 }} />
            <YAxis stroke="#aaa" tick={{ fontSize: 11 }} />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#111] border border-white/10 p-3 rounded-xl">
                      <div className="text-xs text-white/50">
                        {payload[0].payload.date}
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        💰 {money(payload[0].value)}
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

      {/* FUNNEL */}
      <h3 className="text-lg sm:text-xl font-bold mb-4">🚀 Conversion Funnel</h3>

      <div className="bg-[#1a1a1a] p-4 sm:p-5 rounded-2xl border border-white/10 mb-10">
        <FunnelRow
          label="👁 Views"
          value={`${viewsPct}%`}
          width={viewsPct}
          color="#00d4ff"
        />

        <FunnelRow
          label="🖱 Clicks"
          value={percent(clicksPct)}
          width={clicksPct}
          color="#a855f7"
        />

        <FunnelRow
          label="🎟 Purchases"
          value={percent(purchasesPct)}
          width={purchasesPct}
          color="#22c55e"
          last
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/10">
          <div className="text-sm text-white/70">
            Views → Clicks:
            <strong className="text-purple-400 ml-2">{percent(clicksPct)}</strong>
          </div>

          <div className="text-sm text-white/70">
            Clicks → Purchases:
            <strong className="text-green-400 ml-2">{percent(conversionClick)}</strong>
          </div>
        </div>
      </div>

      {/* TOP EVENTOS */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold">🏆 Top Eventos</h3>

        {(byEvent || []).length > 10 && (
          <button
            onClick={() => setShowAllEvents(!showAllEvents)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {showAllEvents ? "Ver menos ▲" : "Ver más ▼"}
          </button>
        )}
      </div>

      <div className="bg-[#1a1a1a] p-4 sm:p-5 rounded-2xl border border-white/10 mb-10">
        {visibleEvents.map((item, index) => {
          const percentRevenue = (Number(item.revenue || 0) / maxRevenue) * 100;

          return (
            <div key={item.eventId} className="mb-5 last:mb-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                <div className="font-semibold text-sm sm:text-base leading-tight">
                  <span className="text-white/50">#{index + 1}</span>{" "}
                  {item.eventName}
                </div>

                <div className="text-sm sm:text-base text-orange-300 font-bold">
                  💰 {money(item.revenue)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-white/50 mb-2">
                <span>👁 {number(item.views)}</span>
                <span>🖱 {number(item.clicks)}</span>
                <span>🎟 {number(item.purchases)}</span>
              </div>

              <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  style={{ width: `${percentRevenue}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-[#00ffcc] to-[#007aff] transition-all duration-500"
                />
              </div>
            </div>
          );
        })}

        {(!byEvent || byEvent.length === 0) && (
          <div className="text-white/40 text-center py-6">
            No hay eventos con datos todavía.
          </div>
        )}
      </div>

      {/* INSIGHTS */}
      <h3 className="text-lg sm:text-xl font-bold mb-4">🧠 Insights</h3>

      <div className="bg-[#1a1a1a] p-4 sm:p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
        {topEvent && (
          <Insight color="text-green-400">
            🔥 <strong>{topEvent.eventName}</strong> es el evento con mayor revenue:
            {" "}{money(topEvent.revenue)}
          </Insight>
        )}

        {bestConversionEvent && (
          <Insight color="text-blue-400">
            📈 <strong>{bestConversionEvent.eventName}</strong> tiene la mejor conversión.
          </Insight>
        )}

        {weakEvent && (
          <Insight color="text-yellow-400">
            ⚠ <strong>{weakEvent.eventName}</strong> tiene tráfico pero no está convirtiendo.
          </Insight>
        )}

        {!topEvent && !bestConversionEvent && !weakEvent && (
          <Insight color="text-white/50">
            Todavía no hay suficientes datos para generar insights.
          </Insight>
        )}
      </div>

      {eventId && (
  <PlatformPerformance data={platformStats} />
)}
   
      {/* PDF REPORT OCULTO */}
<div
  ref={pdfReportRef}
  style={{
    position: "absolute",
    left: "-9999px",
    top: 0,
    width: "794px",
    minHeight: "1123px",
    background: "#050505",
    color: "#ffffff",
    padding: "32px",
    fontFamily: "Arial, sans-serif",
  }}
>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
    <img
      src={logoPronto}
      alt="ProntoTicketLive"
      style={{ width: 170, height: "auto" }}
    />

    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>
        Analytics Report
      </div>
      <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
        {new Date().toLocaleDateString()}
      </div>
    </div>
  </div>

  <div
    style={{
      background: "linear-gradient(135deg, #0b1220, #111827)",
      border: "1px solid #1f2937",
      borderRadius: 18,
      padding: 22,
      marginBottom: 22,
    }}
  >
    <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>
      Resumen ejecutivo
    </div>

    <div style={{ fontSize: 30, fontWeight: 900, color: "#f59e0b" }}>
      {money(summary.revenue)}
    </div>

    <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>
      Revenue total generado por los eventos en el período seleccionado.
    </div>
  </div>

  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
    <PdfKpi title="Purchases" value={number(summary.purchases)} color="#22c55e" />
    <PdfKpi title="Views" value={number(summary.views)} color="#00d4ff" />
    <PdfKpi title="Clicks" value={number(summary.clicks)} color="#a855f7" />
    <PdfKpi title="Conversion" value={percent(conversionRate)} color="#38bdf8" />
  </div>

  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
    <PdfKpi title="Avg Ticket" value={money(avgTicket)} color="#f97316" />
    <PdfKpi title="Revenue / View" value={money(revenuePerView)} color="#f59e0b" />
    <PdfKpi title="Revenue / Click" value={money(revenuePerClick)} color="#f43f5e" />
  </div>

  <div
    style={{
      background: "#111111",
      border: "1px solid #27272a",
      borderRadius: 18,
      padding: 22,
      marginBottom: 28,
    }}
  >
    <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 20 }}>
  Top Eventos por Revenue
</div>

{(byEvent || []).slice(0, 8).map((item, index) => {
  const percentRevenue = (Number(item.revenue || 0) / maxRevenue) * 100;

  return (
    <div key={item.eventId} style={{ marginBottom: 16 }}>

      {/* 🔥 HEADER CORREGIDO */}
<div
  style={{
    marginBottom: 8,
    width: "100%",
  }}
>

  <div
    style={{
      fontSize: 12,
      display: "flex",
      justifyContent: "space-between",
      width: "100%",
      alignItems: "flex-start",
      gap: 10,
    }}
  >

    <div style={{ flex: 1 }}>
      <strong>#{index + 1}</strong> — {item.eventName}
    </div>

    <div
      style={{
        fontWeight: 700,
        color: "#f59e0b",
        whiteSpace: "nowrap",
      }}
    >
      {money(item.revenue)}
    </div>

  </div>

</div>

      {/* 🔥 BARRA (NO TOCAR) */}
      <div style={{ height: 6, marginTop: 8, background: "#27272a", borderRadius: 20 }}>
        <div
          style={{
            width: `${percentRevenue}%`,
            height: "100%",
            borderRadius: 20,
            background: "linear-gradient(90deg, #00ffcc, #007aff)",
          }}
        />
      </div>

    </div>
  );
})}
  </div>

  <div
  style={{
    background: "#111111",
    border: "1px solid #27272a",
    borderRadius: 18,
    padding: 22,
    marginBottom: 28,
  }}
>
 
<div
  style={{
    height: 1,
    background: "#1f2937",
    margin: "20px 0 16px 0",
  }}
/>

  <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>
    Distribución por Plataforma (Origen de ventas)
  </div>

  {(platformStats || []).map((p, index) => {
    const totalRevenue = platformStats.reduce(
      (acc, item) => acc + Number(item.revenue || 0),
      0
    );

    const percent =
      totalRevenue > 0
        ? Math.round((Number(p.revenue || 0) / totalRevenue) * 100)
        : 0;

    return (
      <div key={index} style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            marginBottom: 5,
          }}
        >
          <span style={{ textTransform: "capitalize" }}>
            {p.platform || "web"}
          </span>

          <strong style={{ color: "#f59e0b" }}>
            ${Number(p.revenue || 0).toLocaleString()} (
            {totalRevenue > 0
            ? Math.round((Number(p.revenue || 0) / totalRevenue) * 100)
            : 0}
             %)
           </strong>
        </div>

        <div
          style={{
            height: 6,
            background: "#27272a",
            borderRadius: 20,
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              borderRadius: 20,
              background: "linear-gradient(90deg, #00ffcc, #007aff)",
            }}
          />
        </div>
      </div>
    );
  })}

{platformStats.length > 0 && (() => {
  const totalRevenue = platformStats.reduce(
    (acc, item) => acc + Number(item.revenue || 0),
    0
  );

  const topPlatform = platformStats.reduce((prev, current) =>
    Number(current.revenue || 0) > Number(prev.revenue || 0)
      ? current
      : prev
  );

  const percent =
    totalRevenue > 0
      ? Math.round((Number(topPlatform.revenue || 0) / totalRevenue) * 100)
      : 0;

  return (
    <div
      style={{
        marginTop: 12,
        fontSize: 12,
        color: "#9ca3af",
      }}
    >
      🔥 La plataforma más efectiva es{" "}
      <strong style={{ color: "#ffffff" }}>
        {topPlatform.platform || "web"}
      </strong>{" "}
      con el {percent}% del revenue
    </div>
  );
})()}

</div>

  <div
    style={{
      background: "#111111",
      border: "1px solid #27272a",
      borderRadius: 18,
      padding: 22,
      marginBottom: 28,
    }}
  >
    <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>
      Insights
    </div>

    {topEvent && (
      <div style={{ fontSize: 13, color: "#22c55e", marginBottom: 8 }}>
        🔥 <strong>{topEvent.eventName}</strong> es el evento con mayor revenue: {money(topEvent.revenue)}
      </div>
    )}

    {bestConversionEvent && (
      <div style={{ fontSize: 13, color: "#38bdf8", marginBottom: 8 }}>
        📈 <strong>{bestConversionEvent.eventName}</strong> tiene la mejor conversión.
      </div>
    )}

    {weakEvent && (
      <div style={{ fontSize: 13, color: "#f59e0b" }}>
        ⚠ <strong>{weakEvent.eventName}</strong> tiene tráfico pero no está convirtiendo.
      </div>
    )}
  </div>

  <div
  style={{
    marginTop: 20,
    paddingTop: 10,
    borderTop: "1px solid #1f2937",
    textAlign: "center",
    fontSize: 11,
    color: "#9ca3af",
    pageBreakInside: "avoid",
  }}
>
  © 2026 ProntoTicketLive - Inteligencia aplicada a la venta de eventos
</div>

  {/* =============================== */}
{/* 🔥 PAGE 2 */}
{/* =============================== */}

<div style={{ pageBreakBefore: "always" }} />

<div style={{ height: 30 }} />

{/* HEADER PAGE 2 */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
  <img
    src={logoPronto}
    alt="ProntoTicketLive"
    style={{ width: 150 }}
  />

  <div style={{ textAlign: "right" }}>
    <div style={{ fontSize: 18, fontWeight: 700 }}>
      Analytics Report
    </div>
    <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
      {new Date().toLocaleDateString()}
    </div>
  </div>
</div>

{/* TITULO */}
<div style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>
  Performance Inteligente
</div>

  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
  <img
    src={logoPronto}
    alt="ProntoTicketLive"
    style={{ width: 150 }}
  />

  <div style={{ textAlign: "right" }}>
    <div style={{ fontSize: 18, fontWeight: 700 }}>
      Analytics Report
    </div>
    <div style={{ fontSize: 11, color: "#999" }}>
      Página 2
    </div>
  </div>
</div>  

  {/* FUNNEL */}
  <div
  style={{
    height: 1,
    background: "#1f2937",
    margin: "20px 0 16px 0",
  }}
/> 
  <div style={{ background: "#111111", padding: 18, borderRadius: 18, marginBottom: 24 }}>
    <div style={{ fontWeight: 800, marginBottom: 12 }}>Conversion Funnel (Comportamiento del usuario)</div>

    {[
      { label: "Views", value: summary.views },
      { label: "Clicks", value: summary.clicks },
      { label: "Purchases", value: summary.purchases },
    ].map((f, i) => {
      const max = Math.max(summary.views || 1, 1);
      const percent = (f.value / max) * 100;

      return (
        <div key={i} style={{ marginBottom: 12 }}>
          <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 6,
  }}
>
  <div>{f.label}</div>

  <div
    style={{
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    {f.value}
  </div>
</div>
          <div style={{ height: 6, background: "#222", borderRadius: 20 }}>
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                background: "#00ffcc",
              }}
            />
          </div>
        </div>
      );
    })}
  </div>

  {/* SCORE */}
  <div
  style={{
    height: 1,
    background: "#1f2937",
    margin: "20px 0 16px 0",
  }}
/>
  <div style={{ background: "#111111", padding: 18, borderRadius: 18 }}>
  <div style={{ fontWeight: 800 }}>Event Score (Salud del evento)</div>

  {(() => {
    let score = 0;

    if (summary.views > 50) score += 30;
    if (summary.clicks > 10) score += 30;
    if (summary.purchases > 5) score += 40;

    return (
      <>
  

     <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  <div
    style={{
      fontSize: 32,
      fontWeight: 900,
      color:
        score > 70
          ? "#22c55e"
          : score > 40
          ? "#f59e0b"
          : "#ef4444",
    }}
  >
    {score}/100 ({score}%)
  </div>

  <div
    style={{
      fontSize: 11,
      fontWeight: 700,
      padding: "4px 8px",
      borderRadius: 999,
      background:
        score > 70
          ? "#22c55e22"
          : score > 40
          ? "#f59e0b22"
          : "#ef444422",
      color:
        score > 70
          ? "#22c55e"
          : score > 40
          ? "#f59e0b"
          : "#ef4444",
    }}
  >
    {score > 70
      ? "HIGH"
      : score > 40
      ? "MEDIUM"
      : "LOW"}
  </div>
</div>

{/* 🔥 TERMÓMETRO */}
<div
  style={{
    marginTop: 10,
    height: 8,
    background: "#1f2937",
    borderRadius: 20,
    overflow: "hidden",
  }}
>
  <div
    style={{
      width: `${score}%`,
      height: "100%",
      borderRadius: 20,
      background:
        score > 70
          ? "linear-gradient(90deg, #22c55e, #16a34a)"
          : score > 40
          ? "linear-gradient(90deg, #f59e0b, #d97706)"
          : "linear-gradient(90deg, #ef4444, #dc2626)",
    }}
  />
</div>

<div style={{ fontSize: 12, color: "#999" }}>
  {score > 70
    ? "🔥 Excelente"
    : score > 40
    ? "⚠ Performance media"
    : "🚨 Bajo rendimiento"}
</div>

<div
  style={{
    marginTop: 6,
    fontSize: 11,
    fontWeight: 600,
    color:
      score > 70
      ? "#22c55e"
      : score > 40
      ? "#f59e0b"
      : "#ef4444",
  }}
>
  {score > 70
    ? "🔥 High Performance"
    : score > 40
    ? "⚠ Medium Performance"
    : "🚨 Low Performance"}
</div>

{/* 🔥 NUEVO BLOQUE IA */}
<div
  style={{
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  }}
>
  <div
    style={{
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 6,
      color: "#38bdf8",
    }}
  >
    📊 Recomendación Inteligente
  </div>

          <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: "16px" }}>
            {(() => {
              if (!platformStats || platformStats.length === 0) {
                return "No hay suficientes datos para generar recomendaciones.";
              }

              const totalRevenue = platformStats.reduce(
                (acc, item) => acc + Number(item.revenue || 0),
                0
              );

              const topPlatform = platformStats.reduce((prev, current) =>
                Number(current.revenue || 0) > Number(prev.revenue || 0)
                  ? current
                  : prev
              );

              const percent =
                totalRevenue > 0
                  ? Math.round((Number(topPlatform.revenue || 0) / totalRevenue) * 100)
                  : 0;

              if (percent > 70) {
                return `Tu canal principal es ${topPlatform.platform}. Escala inversión en este canal para maximizar ventas.`;
              }

              if (percent > 40) {
                return `Buen rendimiento en ${topPlatform.platform}, pero puedes optimizar otros canales para diversificar ventas.`;
              }

              return "Ventas distribuidas. Optimiza campañas para mejorar conversión.";
            })()}
          </div>
        </div>

      </>
    );
  })()}
</div>

</div>

   </div>
  );
}

/* COMPONENTES */

function QuickButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs hover:bg-white/10 hover:text-white transition"
      type="button"
    >
      {label}
    </button>
  );
}

function Card({ title, value, icon, color }) {
  return (
    <div className="relative overflow-hidden bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 sm:p-5 min-h-[120px] hover:scale-[1.02] transition">
      <div
        style={{
          background: `${color}30`,
        }}
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-3xl"
      />

      <div className="text-lg mb-2">{icon}</div>
      <div className="text-xs text-white/50">{title}</div>
      <div className="text-xl sm:text-2xl font-bold mt-1 break-words">
        {value}
      </div>
    </div>
  );
}

function MiniMetric({ title, value, description }) {
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
      <div className="text-white/50 text-xs">{title}</div>
      <div className="text-2xl font-bold mt-1 text-white">{value}</div>
      <div className="text-white/40 text-xs mt-1">{description}</div>
    </div>
  );
}

function FunnelRow({ label, value, width, color, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 14 }}>

      {/* HEADER */}
      <div style={{ marginBottom: 8 }}>

        <div
          style={{
            fontSize: 12,
            lineHeight: "16px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 12,
            textAlign: "right",
            marginTop: 2,
          }}
        >
          {value}
        </div>

      </div>

      {/* BARRA */}
      <div style={{ height: 6, background: "#2a2a2a", borderRadius: 20 }}>
        <div
          style={{
            width: `${Math.min(Number(width || 0), 100)}%`,
            height: "100%",
            borderRadius: 20,
            background: color,
          }}
        />
      </div>

    </div>
  );
}

function Insight({ children, color }) {
  return (
    <div className={`text-sm sm:text-base ${color}`}>
      {children}
    </div>
  );
}

function PdfKpi({ title, value, color }) {
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #27272a",
        borderRadius: 14,
        padding: 14,
        marginBottom: 24,
      }}
    >
      <div style={{ fontSize: 11, color: "#9ca3af" }}>
        {title}
      </div>

      <div style={{ fontSize: 19, fontWeight: 800, color, marginTop: 5 }}>
        {value}
      </div>
    </div>
  );
}