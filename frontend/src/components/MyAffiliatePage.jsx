import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Link2,
  MapPin,
  RefreshCw,
  Ticket,
  TrendingUp,
  UserRound,
} from "lucide-react";

import api from "../api/api";

// =========================================================
// HELPERS
// =========================================================

const formatMoney = (value, currency = "USD") => {
  const amount = Number(value || 0);
  const normalizedCurrency = String(currency || "USD").toUpperCase();

  try {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${normalizedCurrency} ${amount.toFixed(2)}`;
  }
};

const formatDate = (value, includeTime = false) => {
  if (!value) return "Fecha no disponible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  try {
    return new Intl.DateTimeFormat("es-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      ...(includeTime
        ? {
            hour: "2-digit",
            minute: "2-digit",
          }
        : {}),
    }).format(date);
  } catch (error) {
    return date.toLocaleDateString();
  }
};

const formatCommission = (assignment) => {
  const value = Number(assignment?.commissionValue || 0);

  if (assignment?.commissionType === "PERCENT") {
    return `${value}%`;
  }

  if (assignment?.commissionType === "FIXED") {
    return `${value.toFixed(2)} por ticket`;
  }

  return String(value);
};

const getAffiliateUrl = (assignment) => {
  const event = assignment?.event;
  const refCode = assignment?.refCode;

  if (!event?.id || !refCode) return "";

  const eventPath = event.slug
    ? `/evento/${event.slug}-${event.id}`
    : `/evento/${event.id}`;

  return `${window.location.origin}${eventPath}?ref=${encodeURIComponent(
    refCode
  )}`;
};

const normalizeTotals = (totals) =>
  Array.isArray(totals)
    ? totals.map((item) => ({
        currency: String(item?.currency || "USD").toUpperCase(),
        ticketsSold: Number(item?.ticketsSold || 0),
        ticketSales: Number(item?.ticketSales || 0),
        commissionGenerated: Number(item?.commissionGenerated || 0),
      }))
    : [];

// =========================================================
// COMPONENT
// =========================================================

export default function MyAffiliatePage() {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  // =======================================================
  // LOAD REPORT
  // =======================================================

  const loadReport = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await api.get("/affiliates/me/report");

      const payload = response?.data?.data || response?.data || null;

      if (!payload) {
        throw new Error("El servidor no devolvio el reporte de afiliado.");
      }

      setReport(payload);
    } catch (error) {
      console.error("[MyAffiliatePage] Error cargando reporte:", error);

      const status = error?.response?.status;

      if (status === 403) {
        setErrorMsg(
          "Esta cuenta no tiene acceso al Panel de Afiliado."
        );
      } else if (status === 401) {
        setErrorMsg(
          "Tu sesion ha expirado. Inicia sesion nuevamente."
        );
      } else {
        setErrorMsg(
          error?.response?.data?.message ||
            "No fue posible cargar tu informacion de afiliado."
        );
      }

      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  // =======================================================
  // NORMALIZED DATA
  // =======================================================

  const affiliate = report?.affiliate || null;

  const assignments = useMemo(
    () => (Array.isArray(report?.assignments) ? report.assignments : []),
    [report]
  );

  const summary = report?.summary || {};

  const totalsByCurrency = useMemo(
    () => normalizeTotals(summary?.totalsByCurrency),
    [summary?.totalsByCurrency]
  );

  // =======================================================
  // COPY
  // =======================================================

  const copyText = async (text, key, successMessage) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setCopyMessage(successMessage);

      window.setTimeout(() => {
        setCopiedKey("");
        setCopyMessage("");
      }, 2500);
    } catch (error) {
      console.error("[MyAffiliatePage] Error copiando:", error);
      setCopiedKey("");
      setCopyMessage("No fue posible copiar la informacion.");
    }
  };

  // =======================================================
  // PDF
  // =======================================================

  const exportPdf = async () => {
    if (!report) return;

    try {
      setExportingPdf(true);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;

      const affiliateName =
        affiliate?.user?.name ||
        affiliate?.user?.email ||
        "Afiliado";

      const affiliateEmail = affiliate?.user?.email || "";

      const drawCorporateHeader = (
        title = "Reporte Personal de Afiliado",
        subtitle = ""
      ) => {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 32, "F");

        // Branding textual seguro.
        // Evitamos depender de un asset que esta pagina aun no importa.
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(17);
        doc.text("ProntoTicketLive", margin, 13);

        doc.setFontSize(11);
        doc.text(title, margin, 21);

        if (subtitle) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(203, 213, 225);
          doc.text(String(subtitle).slice(0, 125), margin, 27);
        }
      };

      const drawFooter = () => {
        doc.setDrawColor(226, 232, 240);
        doc.line(
          margin,
          pageHeight - 11,
          pageWidth - margin,
          pageHeight - 11
        );

        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);

        doc.text(
          "Generado por ProntoTicketLive - Reporte personal de afiliado",
          margin,
          pageHeight - 6
        );

        doc.text(
          `Generado: ${new Date().toLocaleString("es-US")}`,
          pageWidth - margin,
          pageHeight - 6,
          { align: "right" }
        );
      };

      drawCorporateHeader(
        "Reporte Personal de Afiliado",
        `${affiliateName}${affiliateEmail ? ` - ${affiliateEmail}` : ""}`
      );

      // ---------------------------------------------------
      // PERFIL
      // ---------------------------------------------------

      let y = 42;

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Resumen general", margin, y);

      y += 7;

      const assignedEvents = Number(summary?.assignedEvents || 0);
      const ticketsSold = Number(summary?.ticketsSold || 0);

      const generalBoxGap = 5;
      const generalBoxWidth =
        (pageWidth - margin * 2 - generalBoxGap) / 2;

      [
        {
          label: "Eventos asignados",
          value: String(assignedEvents),
        },
        {
          label: "Tickets vendidos",
          value: String(ticketsSold),
        },
      ].forEach((box, index) => {
        const x =
          margin + index * (generalBoxWidth + generalBoxGap);

        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(
          x,
          y,
          generalBoxWidth,
          22,
          3,
          3,
          "FD"
        );

        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(box.label, x + 4, y + 7);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(box.value, x + 4, y + 16);
      });

      y += 31;

      // ---------------------------------------------------
      // TOTALES POR MONEDA
      // ---------------------------------------------------

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Resultados por moneda", margin, y);

      y += 6;

      if (totalsByCurrency.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          "Aun no existen ventas atribuidas a tus enlaces.",
          margin,
          y + 5
        );
        y += 14;
      } else {
        totalsByCurrency.forEach((currencyRow) => {
          if (y + 18 > pageHeight - 20) {
            drawFooter();
            doc.addPage();
            drawCorporateHeader(
              "Reporte Personal de Afiliado",
              affiliateName
            );
            y = 40;
          }

          doc.setFillColor(241, 245, 249);
          doc.roundedRect(
            margin,
            y,
            pageWidth - margin * 2,
            15,
            2,
            2,
            "F"
          );

          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);

          doc.text(
            currencyRow.currency,
            margin + 4,
            y + 6
          );

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);

          doc.text(
            `Tickets: ${currencyRow.ticketsSold}`,
            margin + 35,
            y + 6
          );

          doc.text(
            `Ventas: ${formatMoney(
              currencyRow.ticketSales,
              currencyRow.currency
            )}`,
            margin + 80,
            y + 6
          );

          doc.text(
            `Comision generada: ${formatMoney(
              currencyRow.commissionGenerated,
              currencyRow.currency
            )}`,
            margin + 155,
            y + 6
          );

          y += 19;
        });
      }

      // ---------------------------------------------------
      // ASSIGNMENTS
      // ---------------------------------------------------

      if (y + 15 > pageHeight - 20) {
        drawFooter();
        doc.addPage();
        drawCorporateHeader(
          "Reporte Personal de Afiliado",
          affiliateName
        );
        y = 40;
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Detalle por evento", margin, y);

      y += 8;

      if (assignments.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          "No tienes eventos asignados actualmente.",
          margin,
          y
        );
      }

      assignments.forEach((assignment, assignmentIndex) => {
        const eventTitle =
          assignment?.event?.title || "Evento";

        const assignmentTotals = normalizeTotals(
          assignment?.totalsByCurrency
        );

        const salesByType = Array.isArray(
          assignment?.salesByType
        )
          ? assignment.salesByType
          : [];

        const estimatedHeight =
          34 +
          assignmentTotals.length * 6 +
          salesByType.length * 5;

        if (y + estimatedHeight > pageHeight - 20) {
          drawFooter();
          doc.addPage();

          drawCorporateHeader(
            "Reporte Personal de Afiliado",
            affiliateName
          );

          y = 40;
        }

        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(
          margin,
          y,
          pageWidth - margin * 2,
          Math.max(28, estimatedHeight),
          3,
          3,
          "FD"
        );

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);

        doc.text(
          `${assignmentIndex + 1}. ${String(eventTitle).slice(
            0,
            75
          )}`,
          margin + 4,
          y + 7
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);

        doc.text(
          `Ref Code: ${assignment?.refCode || "-"}`,
          margin + 4,
          y + 14
        );

        doc.text(
          `Comision: ${formatCommission(assignment)}`,
          margin + 62,
          y + 14
        );

        doc.text(
          `Estado: ${
            assignment?.isActive ? "Activo" : "Inactivo"
          }`,
          margin + 125,
          y + 14
        );

        doc.text(
          `Tickets vendidos: ${Number(
            assignment?.ticketsSold || 0
          )}`,
          margin + 178,
          y + 14
        );

        let detailY = y + 21;

        if (assignmentTotals.length === 0) {
          doc.setTextColor(100, 116, 139);
          doc.text(
            "Sin ventas atribuidas.",
            margin + 4,
            detailY
          );
          detailY += 6;
        } else {
          assignmentTotals.forEach((row) => {
            doc.setTextColor(71, 85, 105);

            doc.text(
              `${row.currency} - Ventas: ${formatMoney(
                row.ticketSales,
                row.currency
              )} | Comision generada: ${formatMoney(
                row.commissionGenerated,
                row.currency
              )}`,
              margin + 4,
              detailY
            );

            detailY += 6;
          });
        }

        if (salesByType.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(71, 85, 105);
          doc.text(
            "Detalle por tipo de ticket:",
            margin + 4,
            detailY
          );

          detailY += 5;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);

          salesByType.forEach((typeRow) => {
            const currency = String(
              typeRow?.currency ||
                assignmentTotals?.[0]?.currency ||
                "USD"
            ).toUpperCase();

            doc.text(
              `${String(
                typeRow?.ticketTypeName || "Entrada"
              ).slice(0, 45)}: ${Number(
                typeRow?.ticketsSold || 0
              )} ticket(s) | Ventas ${formatMoney(
                typeRow?.ticketSales || 0,
                currency
              )} | Comision ${formatMoney(
                typeRow?.commissionGenerated || 0,
                currency
              )}`,
              margin + 7,
              detailY
            );

            detailY += 5;
          });
        }

        y += Math.max(28, estimatedHeight) + 5;
      });

      drawFooter();

      const safeName = String(affiliateName)
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 50);

      doc.save(
        `Reporte_Afiliado_${safeName || "ProntoTicketLive"}.pdf`
      );
    } catch (error) {
      console.error(
        "[MyAffiliatePage] Error exportando PDF:",
        error
      );

      setCopyMessage(
        "No fue posible generar el reporte PDF."
      );
    } finally {
      setExportingPdf(false);
    }
  };

  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="min-h-[55vh] flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-4" />
            <p className="text-white/70">
              Cargando tu Panel de Afiliado...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================
  // ERROR / UNAUTHORIZED
  // =======================================================

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <button
            type="button"
            onClick={() => navigate("/account")}
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Mi Cuenta
          </button>

          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center">
            <UserRound className="w-12 h-12 mx-auto mb-4 text-red-300" />

            <h1 className="text-2xl font-bold mb-2">
              Panel de Afiliado
            </h1>

            <p className="text-white/70 mb-6">
              {errorMsg}
            </p>

            <button
              type="button"
              onClick={loadReport}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-950 px-5 py-3 font-semibold hover:bg-white/90"
            >
              <RefreshCw className="w-4 h-4" />
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =======================================================
  // MAIN
  // =======================================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HERO */}
      <div className="border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <button
            type="button"
            onClick={() => navigate("/account")}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-7"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Mi Cuenta
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300">
                  ProntoTicketLive
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                    affiliate?.isActive
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {affiliate?.isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Clock3 className="w-3.5 h-3.5" />
                  )}

                  {affiliate?.isActive
                    ? "Afiliado activo"
                    : "Afiliado inactivo"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Panel de Afiliado
              </h1>

              <p className="mt-3 text-white/60 max-w-2xl">
                Consulta tus eventos, enlaces, ventas atribuidas y
                comisiones generadas desde un solo lugar.
              </p>

              <div className="mt-4 text-sm text-white/50">
                <span className="text-white/80 font-medium">
                  {affiliate?.user?.name ||
                    affiliate?.user?.email ||
                    "Afiliado"}
                </span>

                {affiliate?.user?.email &&
                  affiliate?.user?.name && (
                    <span> · {affiliate.user.email}</span>
                  )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadReport}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-sm font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>

              <button
                type="button"
                onClick={exportPdf}
                disabled={exportingPdf}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-4 py-3 text-sm font-semibold shadow-lg shadow-blue-950/30"
              >
                {exportingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}

                {exportingPdf
                  ? "Generando PDF..."
                  : "Exportar a PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* MESSAGE */}
        {copyMessage && (
          <div className="mb-6 rounded-xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm text-blue-200">
            {copyMessage}
          </div>
        )}

        {/* GLOBAL SUMMARY */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">
                  Eventos asignados
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {Number(summary?.assignedEvents || 0)}
                </p>
              </div>

              <div className="rounded-xl bg-blue-400/10 p-3 text-blue-300">
                <CalendarDays className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">
                  Tickets vendidos
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {Number(summary?.ticketsSold || 0)}
                </p>
              </div>

              <div className="rounded-xl bg-orange-400/10 p-3 text-orange-300">
                <Ticket className="w-6 h-6" />
              </div>
            </div>
          </div>
        </section>

        {/* CURRENCY SUMMARY */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-300" />

            <h2 className="text-xl font-semibold">
              Resultados por moneda
            </h2>
          </div>

          {totalsByCurrency.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-white/60">
                Todavia no existen ventas atribuidas a tus
                enlaces de afiliado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {totalsByCurrency.map((row) => (
                <div
                  key={row.currency}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                        Moneda
                      </p>

                      <p className="text-2xl font-bold mt-1">
                        {row.currency}
                      </p>
                    </div>

                    <BadgeDollarSign className="w-7 h-7 text-emerald-300" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-black/20 p-4">
                      <p className="text-xs text-white/45">
                        Tickets
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {row.ticketsSold}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-4">
                      <p className="text-xs text-white/45">
                        Ventas atribuidas
                      </p>
                      <p className="text-lg font-semibold mt-1">
                        {formatMoney(
                          row.ticketSales,
                          row.currency
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-black/20 p-4">
                      <p className="text-xs text-white/45">
                        Comision generada
                      </p>
                      <p className="text-lg font-semibold mt-1 text-emerald-300">
                        {formatMoney(
                          row.commissionGenerated,
                          row.currency
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EVENTS */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Mis eventos y enlaces
              </h2>

              <p className="text-sm text-white/50 mt-1">
                Cada evento tiene su propio codigo y enlace de
                afiliado.
              </p>
            </div>

            <p className="text-xs text-white/40">
              {assignments.length} asignacion(es)
            </p>
          </div>

          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <Link2 className="w-10 h-10 mx-auto text-white/30 mb-3" />

              <h3 className="font-semibold">
                No tienes eventos asignados
              </h3>

              <p className="text-sm text-white/50 mt-2">
                Cuando se te asigne un evento, apareceran aqui tu
                codigo y enlace personal.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {assignments.map((assignment) => {
                const event = assignment?.event || {};
                const affiliateUrl =
                  getAffiliateUrl(assignment);

                const assignmentTotals = normalizeTotals(
                  assignment?.totalsByCurrency
                );

                const salesByType = Array.isArray(
                  assignment?.salesByType
                )
                  ? assignment.salesByType
                  : [];

                const functions = Array.isArray(
                  assignment?.functions
                )
                  ? assignment.functions
                  : [];

                return (
                  <article
                    key={
                      assignment?.id ||
                      `${event?.id}-${assignment?.refCode}`
                    }
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]"
                  >
                    {/* EVENT HEADER */}
                    <div className="p-5 sm:p-6 border-b border-white/10">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                assignment?.isActive
                                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                  : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                              }`}
                            >
                              {assignment?.isActive
                                ? "Enlace activo"
                                : "Enlace inactivo"}
                            </span>

                            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60">
                              Comision:{" "}
                              {formatCommission(assignment)}
                            </span>
                          </div>

                          <h3 className="text-xl font-bold break-words">
                            {event?.title || "Evento"}
                          </h3>

                          <p className="mt-2 text-sm text-white/45">
                            Codigo de referencia:{" "}
                            <span className="font-mono text-white/80">
                              {assignment?.refCode || "-"}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                assignment?.refCode,
                                `ref-${assignment?.refCode}`,
                                "Codigo de referencia copiado."
                              )
                            }
                            disabled={!assignment?.refCode}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 px-3 py-2.5 text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            {copiedKey ===
                            `ref-${assignment?.refCode}`
                              ? "Copiado"
                              : "Copiar codigo"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                affiliateUrl,
                                `url-${assignment?.refCode}`,
                                "Link de afiliado copiado."
                              )
                            }
                            disabled={!affiliateUrl}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-2.5 text-sm font-semibold"
                          >
                            <Link2 className="w-4 h-4" />
                            {copiedKey ===
                            `url-${assignment?.refCode}`
                              ? "Link copiado"
                              : "Copiar link"}
                          </button>

                          {affiliateUrl && (
                            <a
                              href={affiliateUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Abrir
                            </a>
                          )}
                        </div>
                      </div>

                      {affiliateUrl && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                          <p className="text-xs text-white/40 mb-1">
                            Tu enlace personal
                          </p>

                          <p className="font-mono text-xs sm:text-sm text-blue-300 break-all">
                            {affiliateUrl}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* EVENT STATS */}
                    <div className="p-5 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs text-white/45">
                            Tickets vendidos
                          </p>

                          <p className="text-2xl font-bold mt-1">
                            {Number(
                              assignment?.ticketsSold || 0
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                          <p className="text-xs text-white/45">
                            Condicion de comision
                          </p>

                          <p className="text-lg font-semibold mt-1">
                            {formatCommission(assignment)}
                          </p>
                        </div>
                      </div>

                      {/* TOTALS BY CURRENCY */}
                      <div className="mb-5">
                        <h4 className="text-sm font-semibold text-white/80 mb-3">
                          Ventas y comisiones
                        </h4>

                        {assignmentTotals.length === 0 ? (
                          <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-4 text-sm text-white/50">
                            Aun no hay ventas atribuidas a este
                            enlace.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {assignmentTotals.map((row) => (
                              <div
                                key={row.currency}
                                className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-semibold">
                                    {row.currency}
                                  </span>

                                  <span className="text-xs text-white/40">
                                    {row.ticketsSold} ticket(s)
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs text-white/40">
                                      Ventas
                                    </p>
                                    <p className="font-semibold mt-1">
                                      {formatMoney(
                                        row.ticketSales,
                                        row.currency
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-xs text-white/40">
                                      Comision
                                    </p>
                                    <p className="font-semibold mt-1 text-emerald-300">
                                      {formatMoney(
                                        row.commissionGenerated,
                                        row.currency
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* FUNCTIONS */}
                      {functions.length > 0 && (
                        <div className="mb-5">
                          <h4 className="text-sm font-semibold text-white/80 mb-3">
                            Funciones del evento
                          </h4>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {functions.map((eventFunction) => (
                              <div
                                key={eventFunction?.id}
                                className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <CalendarDays className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />

                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                      {formatDate(
                                        eventFunction?.date,
                                        true
                                      )}
                                    </p>

                                    <div className="mt-2 flex items-start gap-2 text-xs text-white/50">
                                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />

                                      <span>
                                        {[
                                          eventFunction?.venueName,
                                          eventFunction?.city,
                                          eventFunction?.country,
                                        ]
                                          .filter(Boolean)
                                          .join(" · ") ||
                                          "Lugar no disponible"}
                                      </span>
                                    </div>

                                    <p className="mt-2 text-xs text-white/40">
                                      Moneda:{" "}
                                      {String(
                                        eventFunction?.currency ||
                                          "USD"
                                      ).toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SALES BY TYPE */}
                      <div>
                        <h4 className="text-sm font-semibold text-white/80 mb-3">
                          Detalle de ventas por tipo de ticket
                        </h4>

                        {salesByType.length === 0 ? (
                          <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-4 text-sm text-white/50">
                            No existen tickets vendidos por este
                            enlace todavia.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-white/10">
                            <table className="w-full min-w-[650px] text-sm">
                              <thead className="bg-white/[0.06] text-white/55">
                                <tr>
                                  <th className="text-left font-medium px-4 py-3">
                                    Tipo de ticket
                                  </th>

                                  <th className="text-right font-medium px-4 py-3">
                                    Tickets
                                  </th>

                                  <th className="text-right font-medium px-4 py-3">
                                    Ventas
                                  </th>

                                  <th className="text-right font-medium px-4 py-3">
                                    Comision generada
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {salesByType.map(
                                  (typeRow, index) => {
                                    const currency = String(
                                      typeRow?.currency ||
                                        assignmentTotals?.[0]
                                          ?.currency ||
                                        "USD"
                                    ).toUpperCase();

                                    return (
                                      <tr
                                        key={`${
                                          typeRow?.ticketTypeId ||
                                          typeRow?.ticketTypeName ||
                                          "ticket"
                                        }-${currency}-${index}`}
                                        className="border-t border-white/10"
                                      >
                                        <td className="px-4 py-3 text-white/80">
                                          {typeRow?.ticketTypeName ||
                                            "Entrada"}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                          {Number(
                                            typeRow?.ticketsSold ||
                                              0
                                          )}
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                          {formatMoney(
                                            typeRow?.ticketSales ||
                                              0,
                                            currency
                                          )}
                                        </td>

                                        <td className="px-4 py-3 text-right text-emerald-300 font-medium">
                                          {formatMoney(
                                            typeRow?.commissionGenerated ||
                                              0,
                                            currency
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* EXPLANATION */}
        <section className="mt-8 rounded-2xl border border-blue-400/10 bg-blue-400/[0.05] p-5">
          <h3 className="font-semibold mb-2">
            Sobre tus comisiones
          </h3>

          <p className="text-sm leading-6 text-white/55">
            Este panel muestra las ventas atribuidas a tus enlaces
            de afiliado y la comision generada segun las condiciones
            asignadas a cada evento. Los importes se mantienen
            separados por moneda y no representan un estado de pago
            o liquidacion.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
          <Link
            to="/account"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Mi Cuenta
          </Link>

          {report?.generatedAt && (
            <p className="text-xs text-white/35">
              Reporte actualizado:{" "}
              {formatDate(report.generatedAt, true)}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}