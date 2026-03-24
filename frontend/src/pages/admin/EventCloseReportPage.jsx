import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/api";
import { jsPDF } from "jspdf";
import {
  FileBarChart2,
  CalendarDays,
  Download,
  Filter,
  Loader2,
  PieChart,
  Ticket,
  CheckCircle2,
  Clock3,
  Landmark,
  Percent,
  RefreshCw,
  Receipt,
  BadgeDollarSign,
} from "lucide-react";
import icono2026 from "../../assets/icono_2026.png";

function money(n) {
  const v = Number(n);
  const safe = Number.isFinite(v) ? v : 0;
  return `$${safe.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function pct(n) {
  const v = Number(n);
  const safe = Number.isFinite(v) ? v : 0;
  return `${safe.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
}

function formatDateOnly(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "-";
  }
}

function buildPalette(count) {
  const base = [
    "#007AFF",
    "#FF9500",
    "#34C759",
    "#AF52DE",
    "#FF2D55",
    "#5AC8FA",
    "#FFD60A",
    "#FF6B35",
    "#30D158",
    "#64D2FF",
  ];

  return Array.from({ length: count }, (_, i) => base[i % base.length]);
}

function WhiteStatCard({ label, value, icon: Icon, accent = "blue" }) {
  const accentMap = {
    blue: "text-[#007AFF] bg-[#007AFF]/10 border-[#007AFF]/10",
    orange: "text-[#FF9500] bg-[#FF9500]/10 border-[#FF9500]/10",
    green: "text-[#16a34a] bg-green-500/10 border-green-500/10",
    purple: "text-[#AF52DE] bg-[#AF52DE]/10 border-[#AF52DE]/10",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-slate-500 text-sm font-semibold">{label}</div>
        <div
          className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${accentMap[accent] || accentMap.blue}`}
        >
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3 text-slate-900 text-3xl font-bold">{value}</div>
    </div>
  );
}

function ExecutivePieCard({
  title,
  subtitle,
  items,
  valueKey,
  totalLabel,
  white = false,
}) {
  const total = items.reduce((acc, item) => acc + Number(item[valueKey] || 0), 0);
  const colors = buildPalette(items.length);

  const gradient = items.length
    ? `conic-gradient(${items
        .map((item, idx) => {
          const start =
            items
              .slice(0, idx)
              .reduce((acc, x) => acc + Number(x[valueKey] || 0), 0) / (total || 1);
          const end =
            items
              .slice(0, idx + 1)
              .reduce((acc, x) => acc + Number(x[valueKey] || 0), 0) / (total || 1);

          const startPct = Math.round(start * 10000) / 100;
          const endPct = Math.round(end * 10000) / 100;

          return `${colors[idx]} ${startPct}% ${endPct}%`;
        })
        .join(", ")})`
    : "conic-gradient(#e5e7eb 0% 100%)";

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm ${
        white ? "border-slate-200 bg-white" : "border-white/10 bg-[#121212]"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className={white ? "text-slate-900 font-semibold text-lg" : "text-white font-semibold text-lg"}>
            {title}
          </div>
          <div className={white ? "text-slate-500 text-sm mt-1" : "text-white/50 text-sm mt-1"}>
            {subtitle}
          </div>
        </div>
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
            white ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
          }`}
        >
          <PieChart size={18} className={white ? "text-slate-600" : "text-white/70"} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="relative w-56 h-56 shrink-0">
          <div className="absolute inset-0 translate-y-3 rounded-full bg-black/10 blur-md" />
          <div
            className="absolute inset-0 rounded-full opacity-40"
            style={{ background: gradient, transform: "translateY(10px) scaleY(0.92)" }}
          />
          <div
            className={`absolute inset-0 rounded-full border ${
              white ? "border-slate-200" : "border-white/10"
            }`}
            style={{ background: gradient }}
          />
          <div
            className={`absolute inset-[24%] rounded-full border flex flex-col items-center justify-center text-center px-4 ${
              white ? "bg-white border-slate-200" : "bg-[#121212] border-white/10"
            }`}
          >
            <div className={white ? "text-slate-400 text-xs" : "text-white/40 text-xs"}>
              {totalLabel}
            </div>
            <div className={white ? "text-slate-900 text-2xl font-bold mt-1" : "text-white text-2xl font-bold mt-1"}>
              {total}
            </div>
          </div>
        </div>

        <div className="w-full space-y-3">
          {items.length === 0 ? (
            <div className={white ? "text-slate-500 text-sm" : "text-white/50 text-sm"}>
              No hay datos disponibles.
            </div>
          ) : (
            items.map((item, idx) => {
              const value = Number(item[valueKey] || 0);
              const percent = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";

              return (
                <div
                  key={`${item.ticketTypeId || item.ticketTypeName}-${idx}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-3 border ${
                    white ? "bg-slate-50 border-slate-200" : "bg-black/20 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: colors[idx] }}
                    />
                    <div className="min-w-0">
                      <div className={white ? "text-slate-900 font-medium truncate" : "text-white font-medium truncate"}>
                        {item.ticketTypeName}
                      </div>
                      <div className={white ? "text-slate-500 text-xs" : "text-white/45 text-xs"}>
                        {percent}% del total
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={white ? "text-slate-900 font-semibold" : "text-white font-semibold"}>
                      {value}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

async function createExecutivePieChartDataUrl(items, valueKey, title, totalLabel) {
  const total = items.reduce((acc, item) => acc + Number(item[valueKey] || 0), 0);
  const colors = buildPalette(items.length);

  const canvas = document.createElement("canvas");
  canvas.width = 1300;
  canvas.height = 700;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 34px Arial";
  ctx.fillText(title, 40, 54);

  const cx = 260;
  const cy = 350;
  const radius = 170;

  let startAngle = -Math.PI / 2;

  if (items.length === 0 || total <= 0) {
    ctx.fillStyle = "#d1d5db";
    ctx.beginPath();
    ctx.moveTo(cx, cy + 14);
    ctx.arc(cx, cy + 14, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  } else {
    items.forEach((item) => {
      const value = Number(item[valueKey] || 0);
      const slice = (value / total) * Math.PI * 2;
      const endAngle = startAngle + slice;

      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.moveTo(cx, cy + 16);
      ctx.arc(cx, cy + 16, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      startAngle = endAngle;
    });

    startAngle = -Math.PI / 2;
    items.forEach((item, idx) => {
      const value = Number(item[valueKey] || 0);
      const slice = (value / total) * Math.PI * 2;
      const endAngle = startAngle + slice;

      ctx.fillStyle = colors[idx];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle = endAngle;
    });
  }

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, 82, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.font = "16px Arial";
  ctx.fillText(totalLabel || "Total", cx, cy - 10);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 34px Arial";
  ctx.fillText(String(total), cx, cy + 28);
  ctx.textAlign = "left";

  let legendY = 130;
  items.forEach((item, idx) => {
    const value = Number(item[valueKey] || 0);
    const percent = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";

    ctx.fillStyle = colors[idx];
    ctx.beginPath();
    ctx.roundRect(580, legendY - 16, 22, 22, 6);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 22px Arial";
    ctx.fillText(item.ticketTypeName || "Tipo", 620, legendY + 2);

    ctx.fillStyle = "#64748b";
    ctx.font = "18px Arial";
    ctx.fillText(`${value} • ${percent}%`, 620, legendY + 28);

    legendY += 72;
  });

  return canvas.toDataURL("image/png");
}

export default function EventCloseReportPage() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [functions, setFunctions] = useState([]);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedFunctionId, setSelectedFunctionId] = useState("");

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let alive = true;

    const loadInitial = async () => {
      setLoadingPage(true);
      setErrorMsg("");

      try {
        const [meRes, eventsRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/events"),
        ]);

        const me = meRes.data?.data ?? meRes.data;
        const list = eventsRes.data?.data ?? eventsRes.data ?? [];
        const rawList = Array.isArray(list) ? list : [];

        const filteredEvents =
          me?.role === "PRODUCER"
            ? rawList.filter((e) => e.producerId === me.id || e.producerId === me.userId)
            : rawList;

        if (!alive) return;

        setUser(me);
        setEvents(filteredEvents);
      } catch (error) {
        console.error("[EventCloseReportPage] Error loading initial data:", error);
        if (!alive) return;
        setErrorMsg("No pude cargar la información inicial del reporte.");
      } finally {
        if (alive) setLoadingPage(false);
      }
    };

    loadInitial();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const event = events.find((e) => e.id === selectedEventId);
    setFunctions(Array.isArray(event?.functions) ? event.functions : []);
    setSelectedFunctionId("");
    setReport(null);
    setSuccessMsg("");
  }, [selectedEventId, events]);

  const fetchReport = async () => {
    if (!selectedEventId && !selectedFunctionId) {
      setErrorMsg("Debes seleccionar un evento o una función.");
      return;
    }

    setLoadingReport(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const params = {};
      if (selectedEventId) params.eventId = selectedEventId;
      if (selectedFunctionId) params.functionId = selectedFunctionId;

      const res = await api.get("/admin/reports/event-close", { params });
      const payload =
        res.data?.data?.data ||
        res.data?.data ||
        res.data ||
        null;

      setReport(payload);
      setSuccessMsg("Reporte cargado correctamente.");
    } catch (error) {
      console.error("[EventCloseReportPage] Error loading report:", error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No pude generar el reporte.";

      if (Array.isArray(backendMessage)) {
        setErrorMsg(backendMessage.join(", "));
      } else {
        setErrorMsg(String(backendMessage));
      }

      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const summaryCards = useMemo(() => {
    if (!report?.summary) return [];

    return [
      {
        label: "Tickets vendidos",
        value: report.summary.ticketsSold,
        icon: Ticket,
        accent: "blue",
      },
      {
        label: "Tickets usados",
        value: report.summary.ticketsUsed,
        icon: CheckCircle2,
        accent: "green",
      },
      {
        label: "Pendientes",
        value: report.summary.ticketsPending,
        icon: Clock3,
        accent: "orange",
      },
      {
        label: "% Asistencia",
        value: pct(report.summary.attendanceRate),
        icon: Percent,
        accent: "purple",
      },
      {
        label: "Subtotal boletos",
        value: money(report.summary.netTickets),
        icon: BadgeDollarSign,
        accent: "blue",
      },
      {
        label: "Taxes",
        value: money(report.summary.taxes),
        icon: Landmark,
        accent: "orange",
      },
      {
        label: "Fee",
        value: money(report.summary.fees ?? 0),
        icon: Receipt,
        accent: "purple",
      },
      {
        label: "Total recaudado",
        value: money(report.summary.totalCollected),
        icon: Landmark,
        accent: "green",
      },
    ];
  }, [report]);

  const exportPdf = async () => {
    if (!report) return;

    setExportingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;

      const salesChart = await createExecutivePieChartDataUrl(
        report.salesByType || [],
        "ticketsSold",
        "Ventas por tipo de entrada",
        "Vendidos"
      );

      const attendanceChart = await createExecutivePieChartDataUrl(
        report.attendanceByType || [],
        "ticketsUsed",
        "Asistencia por tipo de entrada",
        "Usados"
      );

      const drawBox = (x, y, w, h, title, bodyLines = []) => {
        doc.setDrawColor(220, 226, 234);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, w, h, 4, 4, "FD");

        doc.setFillColor(245, 248, 252);
        doc.roundedRect(x, y, w, 12, 4, 4, "F");

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(title, x + 4, y + 8);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);

        let lineY = y + 18;
        bodyLines.forEach((line) => {
          doc.text(line, x + 4, lineY);
          lineY += 6;
        });
      };

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.setFillColor(10, 26, 47);
      doc.rect(0, 0, pageWidth, 26, "F");

      try {
        doc.addImage(icono2026, "PNG", 10, 5, 14, 14);
      } catch {}

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Reporte de cierre administrativo", 28, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("ProntoTicketLive", 28, 18);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(report.event?.title || "Evento", margin, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Función: ${formatDateTime(report.function?.date)}   |   Venue: ${report.function?.venueName || "-"}   |   Ciudad: ${report.function?.city || "-"}`,
        margin,
        42
      );
      doc.text(`Generado: ${formatDateTime(report.generatedAt)}`, margin, 47);

      const kpiY = 54;
      const kpiW = 33.5;
      const kpiGap = 4;

      const kpis = [
        ["Vendidos", String(report.summary?.ticketsSold || 0)],
        ["Usados", String(report.summary?.ticketsUsed || 0)],
        ["Pendientes", String(report.summary?.ticketsPending || 0)],
        ["Asistencia", pct(report.summary?.attendanceRate || 0)],
        ["Boletos", money(report.summary?.netTickets || 0)],
        ["Taxes", money(report.summary?.taxes || 0)],
        ["Fee", money(report.summary?.fees ?? 0)],
        ["Total", money(report.summary?.totalCollected || 0)],
      ];

      kpis.forEach((item, idx) => {
        const x = margin + idx * (kpiW + kpiGap);
        doc.setDrawColor(220, 226, 234);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, kpiY, kpiW, 20, 4, 4, "FD");

        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(item[0], x + 4, kpiY + 7);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(item[1], x + 4, kpiY + 15);
      });

      drawBox(margin, 80, 86, 40, "Resumen financiero", [
        `Subtotal boletos: ${money(report.summary?.netTickets || 0)}`,
        `Taxes: ${money(report.summary?.taxes || 0)}`,
        `Fee: ${money(report.summary?.fees ?? 0)}`,
        `Total recaudado: ${money(report.summary?.totalCollected || 0)}`,
      ]);

      if (salesChart) {
        doc.addImage(salesChart, "PNG", 102, 80, 89, 56);
      }

      if (attendanceChart) {
        doc.addImage(attendanceChart, "PNG", 198, 80, 89, 56);
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Ventas por tipo de entrada", margin, 145);
      doc.text("Asistencia por tipo de entrada", 150, 145);

      let y1 = 152;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("Tipo", margin, y1);
      doc.text("Vend.", margin + 42, y1);
      doc.text("%", margin + 58, y1);
      doc.text("Subtotal", margin + 70, y1);
      doc.text("Tax", margin + 98, y1);
      doc.text("Fee", margin + 116, y1);
      doc.text("Total", margin + 132, y1);

      y1 += 5;
      doc.setFont("helvetica", "normal");

      (report.salesByType || []).forEach((row) => {
        if (y1 > 198) return;
        doc.text(String(row.ticketTypeName || "-").slice(0, 24), margin, y1);
        doc.text(String(row.ticketsSold || 0), margin + 42, y1);
        doc.text(pct(row.salesPercent || 0), margin + 58, y1);
        doc.text(money(row.subtotal || 0), margin + 70, y1);
        doc.text(money(row.salesTax || 0), margin + 98, y1);
        doc.text(money(row.serviceFee || 0), margin + 116, y1);
        doc.text(money(row.totalGross || 0), margin + 132, y1);
        y1 += 6;
      });

      let y2 = 152;
      doc.setFont("helvetica", "bold");
      doc.text("Tipo", 150, y2);
      doc.text("Vend.", 192, y2);
      doc.text("Usados", 208, y2);
      doc.text("Pend.", 228, y2);
      doc.text("% Asist.", 248, y2);

      y2 += 5;
      doc.setFont("helvetica", "normal");

      (report.attendanceByType || []).forEach((row) => {
        if (y2 > 198) return;
        doc.text(String(row.ticketTypeName || "-").slice(0, 24), 150, y2);
        doc.text(String(row.ticketsSold || 0), 192, y2);
        doc.text(String(row.ticketsUsed || 0), 208, y2);
        doc.text(String(row.ticketsPending || 0), 228, y2);
        doc.text(pct(row.attendancePercent || 0), 248, y2);
        y2 += 6;
      });

      doc.setDrawColor(220, 226, 234);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Generado por ProntoTicketLive • Cierre administrativo", margin, pageHeight - 5);
      doc.text(formatDateTime(report.generatedAt), pageWidth - 55, pageHeight - 5);

      doc.save(
        `Cierre_Administrativo_${(report.event?.title || "evento")
          .replace(/\s+/g, "_")
          .slice(0, 50)}.pdf`
      );
    } catch (error) {
      console.error("[EventCloseReportPage] Error exporting PDF:", error);
      setErrorMsg("No pude exportar el PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <AdminLayout user={user}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#007AFF]/20 bg-[#007AFF]/10 text-[#8ec5ff] text-sm mb-4">
            <FileBarChart2 size={16} />
            Cierre administrativo del evento
          </div>

          <h1 className="text-2xl font-bold text-white">Reporte de cierre</h1>
          <p className="text-white/50 text-sm mt-1">
            Vista ejecutiva y exportación PDF corporativa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={loadingReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 disabled:opacity-60"
            type="button"
          >
            <RefreshCw size={16} className={loadingReport ? "animate-spin" : ""} />
            <span className="text-sm font-semibold">
              {loadingReport ? "Cargando..." : "Actualizar"}
            </span>
          </button>

          <button
            onClick={exportPdf}
            disabled={!report || exportingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold shadow-lg shadow-[#007AFF]/20 hover:brightness-110 disabled:opacity-60"
            type="button"
          >
            {exportingPdf ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span className="text-sm">Exportar PDF</span>
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#121212] p-5 mb-6">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <Filter size={18} className="text-[#007AFF]" />
          Filtros del reporte
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-white/60">Evento</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="mt-1 w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20"
            >
              <option value="">Seleccionar evento</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-white/60">Función</label>
            <select
              value={selectedFunctionId}
              onChange={(e) => setSelectedFunctionId(e.target.value)}
              disabled={!selectedEventId}
              className="mt-1 w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-white/20 disabled:opacity-60"
            >
              <option value="">
                {!selectedEventId
                  ? "Selecciona un evento primero"
                  : "Seleccionar función"}
              </option>
              {functions.map((fn) => (
                <option key={fn.id} value={fn.id}>
                  {new Date(fn.date).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loadingReport || (!selectedEventId && !selectedFunctionId)}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#FF9500] to-[#ff7700] text-white font-semibold hover:brightness-110 disabled:opacity-60"
              type="button"
            >
              Generar reporte
            </button>
          </div>
        </div>
      </div>

      {loadingPage ? (
        <div className="rounded-3xl border border-white/10 bg-[#121212] p-10 flex flex-col items-center justify-center gap-4">
          <img
            src={icono2026}
            alt="ProntoTicketLive"
            className="w-16 h-16 object-contain animate-pulse"
          />
          <div className="flex items-center gap-2 text-white/70">
            <Loader2 size={18} className="animate-spin" />
            Cargando módulo de reportes...
          </div>
        </div>
      ) : null}

      {!loadingPage && errorMsg ? (
        <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-red-200">
          {errorMsg}
        </div>
      ) : null}

      {!loadingPage && successMsg && !errorMsg ? (
        <div className="mb-6 rounded-3xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-green-200">
          {successMsg}
        </div>
      ) : null}

      {!loadingPage && report ? (
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
              <div>
                <div className="text-slate-900 font-bold text-3xl leading-tight">
                  {report.event?.title || "-"}
                </div>
                <div className="text-slate-500 text-sm mt-2">
                  Función: {formatDateTime(report.function?.date)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                  <div className="text-slate-400 text-xs">Venue</div>
                  <div className="text-slate-900 font-semibold mt-1">
                    {report.function?.venueName || "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                  <div className="text-slate-400 text-xs">Ciudad</div>
                  <div className="text-slate-900 font-semibold mt-1">
                    {report.function?.city || "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                  <div className="text-slate-400 text-xs">Generado</div>
                  <div className="text-slate-900 font-semibold mt-1 text-sm">
                    {formatDateOnly(report.generatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {summaryCards.map((card) => (
              <WhiteStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                accent={card.accent}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-5">
                <Ticket size={18} className="text-[#FF9500]" />
                Ventas por tipo de entrada
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs">
                      <th className="py-2 pr-3 font-semibold">Tipo</th>
                      <th className="py-2 pr-3 font-semibold">Vendidos</th>
                      <th className="py-2 pr-3 font-semibold">% Venta</th>
                      <th className="py-2 pr-3 font-semibold">Boletos</th>
                      <th className="py-2 pr-3 font-semibold">Tax</th>
                      <th className="py-2 pr-3 font-semibold">Fee</th>
                      <th className="py-2 pr-0 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.salesByType || []).map((row) => (
                      <tr key={row.ticketTypeId} className="border-t border-slate-200">
                        <td className="py-3 pr-3 text-slate-900 text-sm font-medium">
                          {row.ticketTypeName}
                        </td>
                        <td className="py-3 pr-3 text-slate-600 text-sm">
                          {row.ticketsSold}
                        </td>
                        <td className="py-3 pr-3 text-slate-600 text-sm">
                          {pct(row.salesPercent)}
                        </td>
                        <td className="py-3 pr-3 text-slate-600 text-sm">
                          {money(row.subtotal)}
                        </td>
                        <td className="py-3 pr-3 text-slate-600 text-sm">
                          {money(row.salesTax)}
                        </td>
                        <td className="py-3 pr-3 text-slate-600 text-sm">
                          {money(row.serviceFee || 0)}
                        </td>
                        <td className="py-3 pr-0 text-slate-900 font-semibold text-sm">
                          {money(row.totalGross)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <ExecutivePieCard
              white
              title="Gráfico de ventas"
              subtitle="Distribución porcentual de entradas vendidas por tipo."
              items={report.salesByType || []}
              valueKey="ticketsSold"
              totalLabel="Tickets vendidos"
            />
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-5">
                <CalendarDays size={18} className="text-[#007AFF]" />
                Asistencia por tipo de entrada
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 text-xs">
                      <th className="py-2 pr-3 font-semibold">Tipo</th>
                      <th className="py-2 pr-3 font-semibold">Vendidos</th>
                      <th className="py-2 pr-3 font-semibold">Usados</th>
                      <th className="py-2 pr-3 font-semibold">Pendientes</th>
                      <th className="py-2 pr-0 font-semibold">% Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.attendanceByType || []).map((row) => (
                      <tr key={row.ticketTypeId} className="border-t border-slate-200">
                        <td className="py-3 pr-3 text-slate-900 text-sm font-medium">
                          {row.ticketTypeName}
                        </td>
                        <td className="py-3 pr-3 text-slate-600 text-sm">
                          {row.ticketsSold}
                        </td>
                        <td className="py-3 pr-3 text-green-600 text-sm font-medium">
                          {row.ticketsUsed}
                        </td>
                        <td className="py-3 pr-3 text-amber-600 text-sm font-medium">
                          {row.ticketsPending}
                        </td>
                        <td className="py-3 pr-0 text-slate-900 font-semibold text-sm">
                          {pct(row.attendancePercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <ExecutivePieCard
              white
              title="Gráfico de asistencia"
              subtitle="Distribución porcentual de tickets usados por tipo."
              items={report.attendanceByType || []}
              valueKey="ticketsUsed"
              totalLabel="Tickets usados"
            />
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-slate-900 font-semibold text-lg mb-5">
              Resumen final del cierre
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4">
                <div className="text-slate-400 text-xs">Vendidos</div>
                <div className="text-slate-900 text-2xl font-bold mt-1">
                  {report.summary?.ticketsSold || 0}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4">
                <div className="text-slate-400 text-xs">Usados</div>
                <div className="text-green-600 text-2xl font-bold mt-1">
                  {report.summary?.ticketsUsed || 0}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4">
                <div className="text-slate-400 text-xs">Pendientes</div>
                <div className="text-amber-600 text-2xl font-bold mt-1">
                  {report.summary?.ticketsPending || 0}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4">
                <div className="text-slate-400 text-xs">% Asistencia</div>
                <div className="text-slate-900 text-2xl font-bold mt-1">
                  {pct(report.summary?.attendanceRate || 0)}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4">
                <div className="text-slate-400 text-xs">Boletos</div>
                <div className="text-slate-900 text-2xl font-bold mt-1">
                  {money(report.summary?.netTickets || 0)}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4">
                <div className="text-slate-400 text-xs">Taxes</div>
                <div className="text-slate-900 text-2xl font-bold mt-1">
                  {money(report.summary?.taxes || 0)}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4">
                <div className="text-slate-400 text-xs">Fee</div>
                <div className="text-slate-900 text-2xl font-bold mt-1">
                  {money(report.summary?.fees ?? 0)}
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-[#0f2746] to-[#16345b] border border-[#007AFF]/20 px-4 py-4">
                <div className="text-white/60 text-xs">Total recaudado</div>
                <div className="text-white text-2xl font-bold mt-1">
                  {money(report.summary?.totalCollected || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}