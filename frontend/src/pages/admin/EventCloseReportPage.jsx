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

function PieCard({ title, subtitle, items, valueKey, totalLabel }) {
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
    : "conic-gradient(#1f2937 0% 100%)";

  return (
    <div className="rounded-3xl border border-white/10 bg-[#121212] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-white font-semibold text-lg">{title}</div>
          <div className="text-white/50 text-sm mt-1">{subtitle}</div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <PieChart size={18} className="text-white/70" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="relative w-52 h-52 shrink-0">
          <div
            className="w-full h-full rounded-full border border-white/10"
            style={{ background: gradient }}
          />
          <div className="absolute inset-[22%] rounded-full bg-[#121212] border border-white/10 flex flex-col items-center justify-center text-center px-4">
            <div className="text-white/40 text-xs">{totalLabel}</div>
            <div className="text-white text-2xl font-bold mt-1">{total}</div>
          </div>
        </div>

        <div className="w-full space-y-3">
          {items.length === 0 ? (
            <div className="text-white/50 text-sm">
              No hay datos disponibles.
            </div>
          ) : (
            items.map((item, idx) => {
              const value = Number(item[valueKey] || 0);
              const percent = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";

              return (
                <div
                  key={`${item.ticketTypeId || item.ticketTypeName}-${idx}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 border border-white/10 px-3 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: colors[idx] }}
                    />
                    <div className="min-w-0">
                      <div className="text-white font-medium truncate">
                        {item.ticketTypeName}
                      </div>
                      <div className="text-white/45 text-xs">
                        {percent}% del total
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-white font-semibold">{value}</div>
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

async function createPieChartDataUrl(items, valueKey, title) {
  const total = items.reduce((acc, item) => acc + Number(item[valueKey] || 0), 0);
  const colors = buildPalette(items.length);

  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.fillText(title, 40, 45);

  const cx = 220;
  const cy = 260;
  const radius = 140;

  let startAngle = -Math.PI / 2;

  if (items.length === 0 || total <= 0) {
    ctx.fillStyle = "#374151";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  } else {
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

      startAngle = endAngle;
    });
  }

  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.arc(cx, cy, 72, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#9ca3af";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Total", cx, cy - 8);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Arial";
  ctx.fillText(String(total), cx, cy + 24);
  ctx.textAlign = "left";

  let legendY = 105;
  items.forEach((item, idx) => {
    const value = Number(item[valueKey] || 0);
    const percent = total > 0 ? ((value / total) * 100).toFixed(2) : "0.00";

    ctx.fillStyle = colors[idx];
    ctx.fillRect(450, legendY - 12, 18, 18);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText(item.ticketTypeName || "Tipo", 480, legendY + 2);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "15px Arial";
    ctx.fillText(`${value} • ${percent}%`, 480, legendY + 24);

    legendY += 58;
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

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const summaryCards = useMemo(() => {
    if (!report?.summary) return [];

    return [
      {
        label: "Tickets vendidos",
        value: report.summary.ticketsSold,
        icon: Ticket,
      },
      {
        label: "Tickets usados",
        value: report.summary.ticketsUsed,
        icon: CheckCircle2,
      },
      {
        label: "Pendientes",
        value: report.summary.ticketsPending,
        icon: Clock3,
      },
      {
        label: "Asistencia",
        value: pct(report.summary.attendanceRate),
        icon: Percent,
      },
      {
        label: "Total recaudado",
        value: money(report.summary.totalGross),
        icon: Landmark,
      },
    ];
  }, [report]);

  const exportPdf = async () => {
    if (!report) return;

    setExportingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 12;

      const salesChart = await createPieChartDataUrl(
        report.salesByType || [],
        "ticketsSold",
        "Ventas por tipo de entrada"
      );

      const attendanceChart = await createPieChartDataUrl(
        report.attendanceByType || [],
        "ticketsUsed",
        "Asistencia por tipo de entrada"
      );

      doc.setFillColor(12, 12, 12);
      doc.rect(0, 0, pageWidth, 32, "F");

      try {
        doc.addImage(icono2026, "PNG", 14, 7, 16, 16);
      } catch {}

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Reporte de cierre de evento", 36, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("ProntoTicketLive", 36, 23);

      let y = 42;

      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Evento", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Título: ${report.event?.title || "-"}`, margin, y);
      y += 5;
      doc.text(`Función: ${formatDateTime(report.function?.date)}`, margin, y);
      y += 5;
      doc.text(`Venue: ${report.function?.venueName || "-"}`, margin, y);
      y += 5;
      doc.text(
        `Ciudad: ${report.function?.city || "-"} ${report.function?.country ? `- ${report.function.country}` : ""}`,
        margin,
        y
      );
      y += 5;
      doc.text(`Generado: ${formatDateTime(report.generatedAt)}`, margin, y);
      y += 9;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Resumen general", margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Tickets vendidos: ${report.summary?.ticketsSold || 0}`, margin, y);
      y += 5;
      doc.text(`Tickets usados: ${report.summary?.ticketsUsed || 0}`, margin, y);
      y += 5;
      doc.text(`Tickets pendientes: ${report.summary?.ticketsPending || 0}`, margin, y);
      y += 5;
      doc.text(`Asistencia: ${pct(report.summary?.attendanceRate || 0)}`, margin, y);
      y += 5;
      doc.text(`Subtotal entradas: ${money(report.summary?.subtotal || 0)}`, margin, y);
      y += 5;
      doc.text(`Taxes: ${money(report.summary?.salesTax || 0)}`, margin, y);
      y += 5;
      doc.text(`Total recaudado: ${money(report.summary?.totalGross || 0)}`, margin, y);
      y += 10;

      if (salesChart) {
        doc.addImage(salesChart, "PNG", 12, y, 186, 86);
        y += 92;
      }

      if (y > 220) {
        doc.addPage();
        y = 18;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Detalle de ventas por tipo", margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      (report.salesByType || []).forEach((row) => {
        const line = `${row.ticketTypeName} | Vendidos: ${row.ticketsSold} | ${pct(
          row.salesPercent
        )} | Subtotal: ${money(row.subtotal)} | Tax: ${money(
          row.salesTax
        )} | Total: ${money(row.totalGross)}`;

        const lines = doc.splitTextToSize(line, 180);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;

        if (y > 270) {
          doc.addPage();
          y = 18;
        }
      });

      if (attendanceChart) {
        if (y > 180) {
          doc.addPage();
          y = 18;
        }

        doc.addImage(attendanceChart, "PNG", 12, y + 2, 186, 86);
        y += 94;
      }

      if (y > 240) {
        doc.addPage();
        y = 18;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Detalle de asistencia por tipo", margin, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      (report.attendanceByType || []).forEach((row) => {
        const line = `${row.ticketTypeName} | Vendidos: ${row.ticketsSold} | Usados: ${row.ticketsUsed} | Pendientes: ${row.ticketsPending} | Asistencia: ${pct(
          row.attendancePercent
        )}`;

        const lines = doc.splitTextToSize(line, 180);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 2;

        if (y > 270) {
          doc.addPage();
          y = 18;
        }
      });

      doc.save(
        `ProntoTicketLive_Cierre_${(report.event?.title || "evento")
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
            Ventas, recaudación y asistencia por tipo de entrada.
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
        <>
          <div className="rounded-3xl border border-white/10 bg-[#121212] p-5 mb-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <div className="text-white font-bold text-2xl">
                  {report.event?.title || "-"}
                </div>
                <div className="text-white/50 text-sm mt-1">
                  Función: {formatDateTime(report.function?.date)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-3">
                  <div className="text-white/45 text-xs">Venue</div>
                  <div className="text-white font-semibold mt-1">
                    {report.function?.venueName || "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-3">
                  <div className="text-white/45 text-xs">Ciudad</div>
                  <div className="text-white font-semibold mt-1">
                    {report.function?.city || "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-3">
                  <div className="text-white/45 text-xs">Generado</div>
                  <div className="text-white font-semibold mt-1 text-sm">
                    {formatDateOnly(report.generatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-3xl border border-white/10 bg-[#121212] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white/60 text-sm font-semibold">
                      {card.label}
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon size={18} className="text-white/70" />
                    </div>
                  </div>
                  <div className="mt-3 text-3xl font-bold text-white">
                    {card.value}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 mb-6">
            <div className="rounded-3xl border border-white/10 bg-[#121212] p-5">
              <div className="flex items-center gap-2 text-white font-semibold mb-4">
                <Ticket size={18} className="text-[#FF9500]" />
                Venta por tipo de entrada
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-white/50 text-xs">
                      <th className="py-2 pr-3 font-semibold">Tipo</th>
                      <th className="py-2 pr-3 font-semibold">Vendidos</th>
                      <th className="py-2 pr-3 font-semibold">% Venta</th>
                      <th className="py-2 pr-3 font-semibold">Subtotal</th>
                      <th className="py-2 pr-3 font-semibold">Tax</th>
                      <th className="py-2 pr-0 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.salesByType || []).map((row) => (
                      <tr key={row.ticketTypeId} className="border-t border-white/10">
                        <td className="py-3 pr-3 text-white/90 text-sm font-medium">
                          {row.ticketTypeName}
                        </td>
                        <td className="py-3 pr-3 text-white/70 text-sm">
                          {row.ticketsSold}
                        </td>
                        <td className="py-3 pr-3 text-white/70 text-sm">
                          {pct(row.salesPercent)}
                        </td>
                        <td className="py-3 pr-3 text-white/70 text-sm">
                          {money(row.subtotal)}
                        </td>
                        <td className="py-3 pr-3 text-white/70 text-sm">
                          {money(row.salesTax)}
                        </td>
                        <td className="py-3 pr-0 text-white font-semibold text-sm">
                          {money(row.totalGross)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <PieCard
              title="Gráfico de ventas"
              subtitle="Distribución porcentual de entradas vendidas por tipo."
              items={report.salesByType || []}
              valueKey="ticketsSold"
              totalLabel="Tickets vendidos"
            />
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 mb-6">
            <div className="rounded-3xl border border-white/10 bg-[#121212] p-5">
              <div className="flex items-center gap-2 text-white font-semibold mb-4">
                <CalendarDays size={18} className="text-[#007AFF]" />
                Asistencia por tipo de entrada
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-white/50 text-xs">
                      <th className="py-2 pr-3 font-semibold">Tipo</th>
                      <th className="py-2 pr-3 font-semibold">Vendidos</th>
                      <th className="py-2 pr-3 font-semibold">Usados</th>
                      <th className="py-2 pr-3 font-semibold">Pendientes</th>
                      <th className="py-2 pr-0 font-semibold">% Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.attendanceByType || []).map((row) => (
                      <tr key={row.ticketTypeId} className="border-t border-white/10">
                        <td className="py-3 pr-3 text-white/90 text-sm font-medium">
                          {row.ticketTypeName}
                        </td>
                        <td className="py-3 pr-3 text-white/70 text-sm">
                          {row.ticketsSold}
                        </td>
                        <td className="py-3 pr-3 text-green-300 text-sm font-medium">
                          {row.ticketsUsed}
                        </td>
                        <td className="py-3 pr-3 text-yellow-300 text-sm font-medium">
                          {row.ticketsPending}
                        </td>
                        <td className="py-3 pr-0 text-white font-semibold text-sm">
                          {pct(row.attendancePercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <PieCard
              title="Gráfico de asistencia"
              subtitle="Distribución porcentual de tickets usados por tipo."
              items={report.attendanceByType || []}
              valueKey="ticketsUsed"
              totalLabel="Tickets usados"
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#121212] p-5">
            <div className="text-white font-semibold text-lg mb-4">
              Resumen final
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
              <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-4">
                <div className="text-white/45 text-xs">Tickets vendidos</div>
                <div className="text-white text-2xl font-bold mt-1">
                  {report.summary?.ticketsSold || 0}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-4">
                <div className="text-white/45 text-xs">Usados</div>
                <div className="text-green-300 text-2xl font-bold mt-1">
                  {report.summary?.ticketsUsed || 0}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-4">
                <div className="text-white/45 text-xs">Pendientes</div>
                <div className="text-yellow-300 text-2xl font-bold mt-1">
                  {report.summary?.ticketsPending || 0}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-4">
                <div className="text-white/45 text-xs">Subtotal</div>
                <div className="text-white text-2xl font-bold mt-1">
                  {money(report.summary?.subtotal || 0)}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-4">
                <div className="text-white/45 text-xs">Taxes</div>
                <div className="text-white text-2xl font-bold mt-1">
                  {money(report.summary?.salesTax || 0)}
                </div>
              </div>

              <div className="rounded-2xl bg-black/20 border border-white/10 px-4 py-4">
                <div className="text-white/45 text-xs">Total recaudado</div>
                <div className="text-[#FFB347] text-2xl font-bold mt-1">
                  {money(report.summary?.totalGross || 0)}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AdminLayout>
  );
}