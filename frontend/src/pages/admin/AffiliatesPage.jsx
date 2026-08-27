import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Link2,
  BarChart3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  RefreshCw,
  Ticket,
  DollarSign,
} from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/api";
import { jsPDF } from "jspdf";
import logoProntoTicketLive from "../../assets/logo-prontoticketlive.png";

export default function AffiliatesPage() {
  const navigate = useNavigate();

  // =========================================================
  // GENERAL
  // =========================================================

  const [activeSection, setActiveSection] = useState("affiliates");

  const [affiliates, setAffiliates] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);

  const [loadingAffiliates, setLoadingAffiliates] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // =========================================================
  // CREAR AFILIADO
  // =========================================================

  const [selectedUserId, setSelectedUserId] = useState("");
  const [affiliatePhone, setAffiliatePhone] = useState("");
  const [creatingAffiliate, setCreatingAffiliate] = useState(false);
  const [affiliateMessage, setAffiliateMessage] = useState(null);

  // =========================================================
  // ASIGNAR AFILIADO A EVENTO
  // =========================================================

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedAffiliateId, setSelectedAffiliateId] = useState("");
  const [commissionType, setCommissionType] = useState("PERCENT");
  const [commissionValue, setCommissionValue] = useState("");

  const [creatingLink, setCreatingLink] = useState(false);
  const [linkMessage, setLinkMessage] = useState(null);
  const [generatedAssignment, setGeneratedAssignment] = useState(null);

  // =========================================================
  // REPORTES
  // =========================================================

  const [reportData, setReportData] = useState([]);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [reportSelectedEventId, setReportSelectedEventId] = useState("");
  const [reportSelectedFunctionId, setReportSelectedFunctionId] = useState("");
  const [reportFunctions, setReportFunctions] = useState([]);

  // =========================================================
  // NORMALIZADORES
  // =========================================================

  const normalizeUsers = (response) => {
    const payload =
      response?.data?.data?.data ??
      response?.data?.data ??
      response?.data ??
      [];

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload)) {
      return payload;
    }

    return [];
  };

  const normalizeEvents = (response) => {
    const payload = response?.data?.data ?? response?.data ?? [];

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload)) {
      return payload;
    }

    return [];
  };

  const normalizeAffiliates = (response) => {
    const payload =
      response?.data?.data?.data ??
      response?.data?.data ??
      response?.data ??
      {};

    if (Array.isArray(payload?.affiliates)) {
      return payload.affiliates;
    }

    if (Array.isArray(payload)) {
      return payload;
    }

    return [];
  };

  // =========================================================
  // LOADERS
  // =========================================================

  const loadAffiliates = async () => {
    try {
      setLoadingAffiliates(true);

      const response = await api.get("/affiliates");

      const list = normalizeAffiliates(response);

      setAffiliates(list);
    } catch (error) {
      console.error("Error cargando afiliados:", error);
      setAffiliates([]);
    } finally {
      setLoadingAffiliates(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      const response = await api.get("/users", {
        params: {
          page: 1,
          limit: 200,
        },
      });

      const list = normalizeUsers(response);

      setUsers(list);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);

      const response = await api.get("/events");

      const list = normalizeEvents(response);

      setEvents(list);
    } catch (error) {
      console.error("Error cargando eventos:", error);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    loadAffiliates();
    loadUsers();
    loadEvents();
  }, []);

  // =========================================================
  // USUARIOS DISPONIBLES
  // =========================================================

  const availableUsers = useMemo(() => {
    const affiliateUserIds = new Set(
      affiliates
        .map((affiliate) => affiliate.userId || affiliate.user?.id)
        .filter(Boolean)
    );

    return users.filter((user) => !affiliateUserIds.has(user.id));
  }, [users, affiliates]);

  // =========================================================
  // CREAR AFILIADO
  // =========================================================

  const handleCreateAffiliate = async (event) => {
    event.preventDefault();

    setAffiliateMessage(null);

    if (!selectedUserId) {
      setAffiliateMessage({
        type: "error",
        text: "Selecciona un usuario.",
      });
      return;
    }

    try {
      setCreatingAffiliate(true);

      const payload = {
        userId: selectedUserId,
      };

      if (affiliatePhone.trim()) {
        payload.phone = affiliatePhone.trim();
      }

      const response = await api.post("/affiliates", payload);

      const result =
        response?.data?.data ??
        response?.data ??
        {};

      if (result?.alreadyAffiliate) {
        setAffiliateMessage({
          type: "success",
          text: "Este usuario ya estaba registrado como afiliado.",
        });
      } else {
        setAffiliateMessage({
          type: "success",
          text: "Afiliado creado correctamente.",
        });
      }

      setSelectedUserId("");
      setAffiliatePhone("");

      await loadAffiliates();
    } catch (error) {
      console.error("Error creando afiliado:", error);

      setAffiliateMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "No fue posible crear el afiliado.",
      });
    } finally {
      setCreatingAffiliate(false);
    }
  };

  // =========================================================
  // ASIGNAR AFILIADO A EVENTO
  // =========================================================

  const handleCreateEventAffiliate = async (event) => {
    event.preventDefault();

    setLinkMessage(null);
    setGeneratedAssignment(null);

    if (!selectedEventId) {
      setLinkMessage({
        type: "error",
        text: "Selecciona un evento.",
      });
      return;
    }

    if (!selectedAffiliateId) {
      setLinkMessage({
        type: "error",
        text: "Selecciona un afiliado.",
      });
      return;
    }

    const numericCommission = Number(commissionValue);

    if (
      commissionValue === "" ||
      Number.isNaN(numericCommission) ||
      numericCommission < 0
    ) {
      setLinkMessage({
        type: "error",
        text: "Ingresa una comisión válida.",
      });
      return;
    }

    if (commissionType === "PERCENT" && numericCommission > 100) {
      setLinkMessage({
        type: "error",
        text: "La comisión porcentual no puede superar 100%.",
      });
      return;
    }

    try {
      setCreatingLink(true);

      const response = await api.post("/affiliates/events", {
        eventId: selectedEventId,
        affiliateId: selectedAffiliateId,
        commissionType,
        commissionValue: numericCommission,
      });

      const result =
        response?.data?.data ??
        response?.data ??
        {};

      const assignment =
        result?.eventAffiliate ??
        result;

      setGeneratedAssignment(assignment);

      setLinkMessage({
        type: "success",
        text: "Afiliado asignado correctamente al evento.",
      });
    } catch (error) {
      console.error("Error asignando afiliado:", error);

      setLinkMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "No fue posible asignar el afiliado al evento.",
      });
    } finally {
      setCreatingLink(false);
    }
  };

  // =========================================================
  // REPORTE
  // =========================================================

  useEffect(() => {
    const event = events.find(
      (eventItem) => eventItem.id === reportSelectedEventId,
    );

    setReportFunctions(
      Array.isArray(event?.functions) ? event.functions : [],
    );
    setReportSelectedFunctionId("");
    setReport(null);
    setReportData([]);
    setReportMessage(null);
  }, [reportSelectedEventId, events]);

  const formatMoney = (value, currency = "USD") => {
    const numericValue = Number(value || 0);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

    try {
      return new Intl.NumberFormat("es-US", {
        style: "currency",
        currency: String(currency || "USD").toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeValue);
    } catch {
      return `${String(currency || "USD").toUpperCase()} ${safeValue.toFixed(2)}`;
    }
  };

  const formatCommission = (row, currency = "USD") => {
    const value = Number(row?.commissionValue || 0);

    if (row?.commissionType === "PERCENT") {
      return `${value}%`;
    }

    return `${formatMoney(value, currency)} / ticket`;
  };

  const loadAffiliateReport = async () => {
    if (!reportSelectedEventId && !reportSelectedFunctionId) {
      setReportMessage({
        type: "error",
        text: "Selecciona un evento para generar el reporte.",
      });
      return;
    }

    try {
      setLoadingReport(true);
      setReportMessage(null);

      const params = {};

      if (reportSelectedEventId) {
        params.eventId = reportSelectedEventId;
      }

      if (reportSelectedFunctionId) {
        params.functionId = reportSelectedFunctionId;
      }

      const response = await api.get("/admin/reports/affiliates", {
        params,
      });

      const payload =
        response?.data?.data?.data ??
        response?.data?.data ??
        response?.data ??
        null;

      const rows = Array.isArray(payload?.affiliates)
        ? payload.affiliates
        : [];

      setReport(payload);
      setReportData(rows);

      if (rows.length === 0) {
        setReportMessage({
          type: "info",
          text: "El reporte se generó correctamente, pero no hay ventas atribuidas a afiliados para esta selección.",
        });
      } else {
        setReportMessage({
          type: "success",
          text: "Reporte cargado correctamente.",
        });
      }
    } catch (error) {
      console.error("Error cargando reporte:", error);

      setReport(null);
      setReportData([]);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "No fue posible cargar el reporte.";

      setReportMessage({
        type: "error",
        text: Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : String(backendMessage),
      });
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSelectReport = () => {
    setActiveSection("reports");
    setReportMessage(null);
  };

  const exportAffiliateReportPdf = async () => {
    if (!report) return;

    try {
      setExportingPdf(true);
      setReportMessage(null);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

            const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 12;

      const currency = String(
        report?.currency || "USD"
      ).toUpperCase();

      const selectedEvent = events.find(
        (eventItem) =>
          eventItem.id === reportSelectedEventId
      );

      const selectedFunction = reportFunctions.find(
        (functionItem) =>
          functionItem.id === reportSelectedFunctionId
      );

      const eventTitle =
        report?.event?.title ||
        selectedEvent?.title ||
        "Evento";

      // ============================================
      // CABECERA CORPORATIVA
      // ============================================

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 38, "F");

      // Logo ProntoTicketLive
      try {
        doc.addImage(
          logoProntoTicketLive,
          "PNG",
          margin,
          8,
          42,
          14
        );
      } catch (logoError) {
        console.warn(
          "[AffiliatesPage] No se pudo agregar el logo al PDF:",
          logoError
        );
      }

      // Título
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);

      doc.text(
        "Reporte de Afiliados",
        62,
        14
      );

      // Evento
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);

      doc.text(
        `Evento: ${eventTitle}`,
        62,
        22
      );

      // Función
      let functionText = "Todas las funciones";

      if (selectedFunction) {
        functionText = [
          selectedFunction?.date
            ? new Date(
                selectedFunction.date
              ).toLocaleString("es-US")
            : null,
          selectedFunction?.venueName,
          selectedFunction?.city,
        ]
          .filter(Boolean)
          .join(" - ");
      }

      doc.text(
        `Funcion: ${functionText}`,
        62,
        29
      );

      const summary = report?.summary || {};
      const boxY = 48;
      const gap = 4;
      const boxWidth = (pageWidth - margin * 2 - gap * 3) / 4;
      const boxes = [
        {
          label: "Afiliados con ventas",
          value: String(summary.affiliatesWithSales || 0),
        },
        {
          label: "Tickets vendidos",
          value: String(summary.ticketsSold || 0),
        },
        {
          label: "Ventas atribuidas",
          value: formatMoney(summary.ticketSales || 0, currency),
        },
        {
          label: "Comisiones generadas",
          value: formatMoney(summary.commissionGenerated || 0, currency),
        },
      ];

      boxes.forEach((box, index) => {
        const x = margin + index * (boxWidth + gap);

        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, boxY, boxWidth, 25, 3, 3, "FD");

        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(box.label, x + 4, boxY + 8);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(box.value, x + 4, boxY + 18);
      });

      let y = 84;

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Detalle por afiliado", margin, y);
      y += 7;

      const columns = [
        { label: "Afiliado", x: margin, width: 48 },
        { label: "Ref Code", x: margin + 50, width: 34 },
        { label: "Comision", x: margin + 86, width: 42 },
        { label: "Tickets", x: margin + 130, width: 25 },
        { label: "Ventas", x: margin + 157, width: 45 },
        { label: "Comision generada", x: margin + 204, width: 55 },
      ];

      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 10, "F");

      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);

      columns.forEach((column) => {
        doc.text(column.label, column.x + 2, y + 6.5);
      });

      y += 10;

            const drawHeaderOnNewPage = () => {
        doc.addPage();

        // Cabecera corporativa
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 30, "F");

        try {
          doc.addImage(
            logoProntoTicketLive,
            "PNG",
            margin,
            7,
            34,
            11
          );
        } catch (logoError) {
          console.warn(
            "[AffiliatesPage] No se pudo agregar el logo al PDF:",
            logoError
          );
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);

        doc.text(
          `Reporte de Afiliados - ${eventTitle}`,
          54,
          14
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225);

        doc.text(
          `Funcion: ${functionText}`,
          54,
          21
        );

        y = 38;

        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, pageWidth - margin * 2, 10, "F");

        doc.setTextColor(71, 85, 105);
        doc.setFontSize(8);

        columns.forEach((column) => {
          doc.text(column.label, column.x + 2, y + 6.5);
        });

        y += 10;
      };

      reportData.forEach((row) => {
        const salesByType = Array.isArray(row?.salesByType)
          ? row.salesByType
          : [];

        const rowHeight = Math.max(12, 12 + salesByType.length * 5);

        if (y + rowHeight > pageHeight - 18) {
          drawHeaderOnNewPage();
        }

        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        const affiliateName =
          row?.user?.name ||
          row?.user?.email ||
          "Afiliado";

        doc.text(
          String(affiliateName).slice(0, 28),
          columns[0].x + 2,
          y + 7,
        );

        doc.text(
          String(row?.refCode || "-"),
          columns[1].x + 2,
          y + 7,
        );

        doc.text(
          formatCommission(row, currency),
          columns[2].x + 2,
          y + 7,
        );

        doc.text(
          String(row?.ticketsSold || 0),
          columns[3].x + 2,
          y + 7,
        );

        doc.text(
          formatMoney(row?.ticketSales || 0, currency),
          columns[4].x + 2,
          y + 7,
        );

        doc.text(
          formatMoney(row?.commissionGenerated || 0, currency),
          columns[5].x + 2,
          y + 7,
        );

        if (salesByType.length > 0) {
          doc.setTextColor(100, 116, 139);
          doc.setFontSize(7);

          salesByType.forEach((typeRow, index) => {
            const detailY = y + 12 + index * 5;

            doc.text(
              `${typeRow?.ticketTypeName || "Entrada"}: ${
                typeRow?.ticketsSold || 0
              } ticket(s) - ${formatMoney(
                typeRow?.ticketSales || 0,
                currency,
              )} - comision ${formatMoney(
                typeRow?.commissionGenerated || 0,
                currency,
              )}`,
              columns[0].x + 4,
              detailY,
            );
          });
        }

        y += rowHeight;
      });

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(
        "Generado por ProntoTicketLive - Reporte administrativo de afiliados",
        margin,
        pageHeight - 6,
      );

      const safeEventName = String(eventTitle)
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 50);

      doc.save(`Reporte_Afiliados_${safeEventName || "evento"}.pdf`);
    } catch (error) {
      console.error("Error exportando reporte PDF:", error);

      setReportMessage({
        type: "error",
        text: "No fue posible exportar el reporte a PDF.",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  // =========================================================
  // COPY
  // =========================================================

  const getGeneratedAffiliateUrl = () => {
  const refCode = generatedAssignment?.refCode;

  if (!refCode) return "";

  const selectedEvent = events.find(
    (eventItem) => eventItem.id === selectedEventId
  );

  if (!selectedEvent?.id) return "";

  const eventPath = selectedEvent.slug
    ? `/evento/${selectedEvent.slug}-${selectedEvent.id}`
    : `/evento/${selectedEvent.id}`;

  return `${window.location.origin}${eventPath}?ref=${encodeURIComponent(
    refCode
  )}`;
};

const copyAffiliateUrl = async () => {
  const affiliateUrl = getGeneratedAffiliateUrl();

  if (!affiliateUrl) return;

  try {
    await navigator.clipboard.writeText(affiliateUrl);

    setLinkMessage({
      type: "success",
      text: "Link de afiliado copiado.",
    });
  } catch (error) {
    console.error("No fue posible copiar el link:", error);

    setLinkMessage({
      type: "error",
      text: "No fue posible copiar el link de afiliado.",
    });
  }
};

  const copyRefCode = async () => {
    const refCode = generatedAssignment?.refCode;

    if (!refCode) return;

    try {
      await navigator.clipboard.writeText(refCode);

      setLinkMessage({
        type: "success",
        text: "Código de afiliado copiado.",
      });
    } catch (error) {
      console.error("No fue posible copiar:", error);
    }
  };

  // =========================================================
  // HELPERS UI
  // =========================================================

  const Message = ({ message }) => {
    if (!message) return null;

    const isError = message.type === "error";
    const isSuccess = message.type === "success";

    return (
      <div
        className={`mt-4 rounded-xl border px-4 py-3 flex items-start gap-3 ${
          isError
            ? "border-red-500/20 bg-red-500/10 text-red-300"
            : isSuccess
              ? "border-green-500/20 bg-green-500/10 text-green-300"
              : "border-blue-500/20 bg-blue-500/10 text-blue-300"
        }`}
      >
        {isError ? (
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        )}

        <span className="text-sm">{message.text}</span>
      </div>
    );
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        {/* HEADER */}

        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-3"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Volver al Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#5856D6]/20 border border-[#5856D6]/30 flex items-center justify-center">
              <Users size={23} className="text-[#8b8af0]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">
                Gestión de Afiliados
              </h1>

              <p className="text-white/50 text-sm">
                Administra afiliados, enlaces por evento y comisiones.
              </p>
            </div>
          </div>
        </div>

        {/* TARJETAS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setActiveSection("affiliates")}
            className={`text-left rounded-2xl border bg-white/[0.04] p-5 hover:bg-white/[0.07] transition ${
              activeSection === "affiliates"
                ? "border-blue-500/50"
                : "border-white/10 hover:border-blue-500/30"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <UserPlus size={21} className="text-blue-400" />
            </div>

            <h2 className="text-white font-semibold text-lg mb-1">
              Afiliados
            </h2>

            <p className="text-white/50 text-sm">
              Crea y administra las personas autorizadas para promocionar
              eventos.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("links")}
            className={`text-left rounded-2xl border bg-white/[0.04] p-5 hover:bg-white/[0.07] transition ${
              activeSection === "links"
                ? "border-orange-500/50"
                : "border-white/10 hover:border-orange-500/30"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
              <Link2 size={21} className="text-orange-400" />
            </div>

            <h2 className="text-white font-semibold text-lg mb-1">
              Links por Evento
            </h2>

            <p className="text-white/50 text-sm">
              Asigna afiliados a eventos, configura su comisión y genera
              enlaces exclusivos.
            </p>
          </button>

          <button
            type="button"
            onClick={handleSelectReport}
            className={`text-left rounded-2xl border bg-white/[0.04] p-5 hover:bg-white/[0.07] transition ${
              activeSection === "reports"
                ? "border-green-500/50"
                : "border-white/10 hover:border-green-500/30"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
              <BarChart3 size={21} className="text-green-400" />
            </div>

            <h2 className="text-white font-semibold text-lg mb-1">
              Reporte de Afiliados
            </h2>

            <p className="text-white/50 text-sm">
              Consulta tickets vendidos, monto atribuido y comisiones
              generadas.
            </p>
          </button>
        </div>

        {/* ================================================= */}
        {/* AFILIADOS */}
        {/* ================================================= */}

        {activeSection === "affiliates" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-center gap-3 mb-6">
                <UserPlus size={22} className="text-blue-400" />

                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Crear afiliado
                  </h3>

                  <p className="text-white/40 text-sm">
                    Convierte un usuario registrado en afiliado.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateAffiliate}>
                <label className="block text-white/60 text-sm mb-2">
                  Usuario
                </label>

                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white mb-4"
                >
                  <option value="">
                    {loadingUsers
                      ? "Cargando usuarios..."
                      : "Selecciona un usuario"}
                  </option>

                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || "Sin nombre"} — {user.email}
                    </option>
                  ))}
                </select>

                <label className="block text-white/60 text-sm mb-2">
                  Teléfono opcional
                </label>

                <input
                  type="text"
                  value={affiliatePhone}
                  onChange={(e) => setAffiliatePhone(e.target.value)}
                  placeholder="Ej. +1 407 555 0000"
                  className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 mb-4"
                />

                <button
                  type="submit"
                  disabled={creatingAffiliate}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 flex items-center justify-center gap-2"
                >
                  {creatingAffiliate ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Crear afiliado
                    </>
                  )}
                </button>

                <Message message={affiliateMessage} />
              </form>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-center gap-3 mb-5">
                <Users size={22} className="text-blue-400" />

                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Afiliados registrados
                  </h3>

                  <p className="text-white/40 text-sm">
                    {affiliates.length} afiliado
                    {affiliates.length === 1 ? "" : "s"} registrado
                    {affiliates.length === 1 ? "" : "s"}.
                  </p>
                </div>
              </div>

              {loadingAffiliates ? (
                <div className="flex items-center gap-2 text-white/40">
                  <Loader2 size={18} className="animate-spin" />
                  Cargando afiliados...
                </div>
              ) : affiliates.length === 0 ? (
                <p className="text-white/40">
                  No hay afiliados registrados.
                </p>
              ) : (
                <div className="space-y-3">
                  {affiliates.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="rounded-xl border border-white/10 bg-white/[0.035] p-4"
                    >
                      <div className="font-semibold text-white">
                        {affiliate.user?.name || "Sin nombre"}
                      </div>

                      <div className="text-white/50 text-sm mt-1">
                        {affiliate.user?.email || "Sin email"}
                      </div>

                      {affiliate.phone && (
                        <div className="text-white/40 text-sm mt-1">
                          {affiliate.phone}
                        </div>
                      )}

                      <div className="mt-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            affiliate.isActive
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {affiliate.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* LINKS */}
        {/* ================================================= */}

        {activeSection === "links" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="flex items-center gap-3 mb-6">
              <Link2 size={22} className="text-orange-400" />

              <div>
                <h3 className="text-white font-semibold text-lg">
                  Crear link de afiliado
                </h3>

                <p className="text-white/40 text-sm">
                  Asigna un afiliado a un evento y configura su comisión.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateEventAffiliate}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-white/60 text-sm mb-2">
                  Evento
                </label>

                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white"
                >
                  <option value="">
                    {loadingEvents
                      ? "Cargando eventos..."
                      : "Selecciona un evento"}
                  </option>

                  {events.map((eventItem) => (
                    <option key={eventItem.id} value={eventItem.id}>
                      {eventItem.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">
                  Afiliado
                </label>

                <select
                  value={selectedAffiliateId}
                  onChange={(e) =>
                    setSelectedAffiliateId(e.target.value)
                  }
                  className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white"
                >
                  <option value="">Selecciona un afiliado</option>

                  {affiliates
                    .filter((affiliate) => affiliate.isActive)
                    .map((affiliate) => (
                      <option key={affiliate.id} value={affiliate.id}>
                        {affiliate.user?.name || affiliate.user?.email}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">
                  Tipo de comisión
                </label>

                <select
                  value={commissionType}
                  onChange={(e) => setCommissionType(e.target.value)}
                  className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white"
                >
                  <option value="PERCENT">Porcentaje (%)</option>
                  <option value="FIXED">Monto fijo por ticket</option>
                </select>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-2">
                  Valor de comisión
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(e.target.value)}
                  placeholder={
                    commissionType === "PERCENT"
                      ? "Ej. 10"
                      : "Ej. 2.50"
                  }
                  className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={creatingLink}
                  className="w-full md:w-auto px-6 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold py-3 flex items-center justify-center gap-2"
                >
                  {creatingLink ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Link2 size={18} />
                      Generar asignación
                    </>
                  )}
                </button>
              </div>
            </form>

            <Message message={linkMessage} />

            {generatedAssignment?.refCode && (
  <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-5">
    <div className="flex items-center gap-2 mb-5">
      <CheckCircle2 size={19} className="text-green-400" />
      <div>
        <p className="text-white font-semibold">
          Link de afiliado generado
        </p>
        <p className="text-white/40 text-xs mt-1">
          La asignación quedó asociada correctamente al afiliado y al evento.
        </p>
      </div>
    </div>

    {/* CÓDIGO DE REFERENCIA */}
    <div className="mb-5">
      <p className="text-white/50 text-sm mb-2">
        Código de referencia
      </p>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <code className="text-orange-300 font-semibold text-lg bg-black/20 rounded-lg px-4 py-3">
          {generatedAssignment.refCode}
        </code>

        <button
          type="button"
          onClick={copyRefCode}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-white/80 hover:bg-white/5"
        >
          <Copy size={17} />
          Copiar código
        </button>
      </div>
    </div>

    {/* LINK DEL AFILIADO */}
    <div>
      <p className="text-white/50 text-sm mb-2">
        Link exclusivo del afiliado
      </p>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 min-w-0 bg-black/20 border border-white/5 rounded-xl px-4 py-3">
          <p
            className="text-blue-300 text-sm break-all font-mono"
            title={getGeneratedAffiliateUrl()}
          >
            {getGeneratedAffiliateUrl()}
          </p>
        </div>

        <button
          type="button"
          onClick={copyAffiliateUrl}
          className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-[#007AFF] hover:bg-[#0066d6] px-5 py-3 text-white font-semibold"
        >
          <Copy size={17} />
          Copiar link
        </button>
      </div>
    </div>

    <p className="text-white/40 text-xs mt-4">
      Comparte este link con el afiliado. Las compras realizadas desde este
      enlace quedarán identificadas con su código de referencia.
    </p>
  </div>
)}
          </div>
        )}

        {/* ================================================= */}
        {/* REPORTES */}
        {/* ================================================= */}

        {activeSection === "reports" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <BarChart3 size={22} className="text-green-400" />

                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Reporte de Afiliados
                    </h3>

                    <p className="text-white/40 text-sm">
                      Selecciona un evento y, si aplica, una función para consultar ventas y comisiones.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={loadAffiliateReport}
                    disabled={
                      loadingReport ||
                      !reportSelectedEventId
                    }
                    className="rounded-xl border border-green-500/20 bg-green-500/10 text-green-300 px-4 py-2.5 hover:bg-green-500/15 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingReport ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <RefreshCw size={17} />
                    )}

                    {loadingReport ? "Generando..." : "Generar reporte"}
                  </button>

                  <button
                    type="button"
                    onClick={exportAffiliateReportPdf}
                    disabled={!report || exportingPdf}
                    className="rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white px-4 py-2.5 font-semibold hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {exportingPdf ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Download size={17} />
                    )}

                    Exportar PDF
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2">
                    Evento
                  </label>

                  <select
                    value={reportSelectedEventId}
                    onChange={(e) =>
                      setReportSelectedEventId(e.target.value)
                    }
                    className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white"
                  >
                    <option value="">
                      {loadingEvents
                        ? "Cargando eventos..."
                        : "Selecciona un evento"}
                    </option>

                    {events.map((eventItem) => (
                      <option key={eventItem.id} value={eventItem.id}>
                        {eventItem.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">
                    Función
                  </label>

                  <select
                    value={reportSelectedFunctionId}
                    onChange={(e) =>
                      setReportSelectedFunctionId(e.target.value)
                    }
                    disabled={!reportSelectedEventId}
                    className="w-full bg-[#171717] border border-white/10 rounded-xl px-4 py-3 text-white disabled:opacity-50"
                  >
                    <option value="">
                      {!reportSelectedEventId
                        ? "Selecciona primero un evento"
                        : "Todas las funciones"}
                    </option>

                    {reportFunctions.map((functionItem) => {
                      const functionLabel = [
                        functionItem?.date
                          ? new Date(functionItem.date).toLocaleString("es-US")
                          : null,
                        functionItem?.venueName,
                        functionItem?.city,
                      ]
                        .filter(Boolean)
                        .join(" — ");

                      return (
                        <option
                          key={functionItem.id}
                          value={functionItem.id}
                        >
                          {functionLabel || "Función"}
                        </option>
                      );
                    })}
                  </select>

                  {reportSelectedEventId &&
                    reportFunctions.length === 0 && (
                      <p className="text-white/35 text-xs mt-2">
                        Este evento no expone funciones en la respuesta actual. Puedes generar el reporte completo del evento.
                      </p>
                    )}
                </div>
              </div>

              <Message message={reportMessage} />
            </div>

            {loadingReport && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] py-14 flex flex-col items-center justify-center gap-3 text-white/50">
                <Loader2
                  size={30}
                  className="animate-spin text-green-400"
                />
                Generando reporte de afiliados...
              </div>
            )}

            {!loadingReport && report && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                      <Users size={20} className="text-blue-400" />
                    </div>

                    <p className="text-white/45 text-sm">
                      Afiliados con ventas
                    </p>

                    <p className="text-white text-2xl font-bold mt-1">
                      {report?.summary?.affiliatesWithSales ?? 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                      <Ticket size={20} className="text-purple-400" />
                    </div>

                    <p className="text-white/45 text-sm">
                      Tickets vendidos
                    </p>

                    <p className="text-white text-2xl font-bold mt-1">
                      {report?.summary?.ticketsSold ?? 0}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                      <DollarSign size={20} className="text-orange-400" />
                    </div>

                    <p className="text-white/45 text-sm">
                      Ventas atribuidas
                    </p>

                    <p className="text-white text-2xl font-bold mt-1">
                      {formatMoney(
                        report?.summary?.ticketSales ?? 0,
                        report?.currency,
                      )}
                    </p>

                    <p className="text-white/30 text-xs mt-2">
                      Valor de tickets, sin fee ni impuestos.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.06] p-5">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                      <BarChart3 size={20} className="text-green-400" />
                    </div>

                    <p className="text-white/45 text-sm">
                      Comisiones generadas
                    </p>

                    <p className="text-green-400 text-2xl font-bold mt-1">
                      {formatMoney(
                        report?.summary?.commissionGenerated ?? 0,
                        report?.currency,
                      )}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        Detalle por afiliado
                      </h3>

                      <p className="text-white/40 text-sm mt-1">
                        {report?.event?.title ||
                          events.find(
                            (eventItem) =>
                              eventItem.id === reportSelectedEventId,
                          )?.title ||
                          "Evento seleccionado"}
                      </p>
                    </div>

                    <div className="text-white/35 text-xs">
                      Moneda:{" "}
                      <span className="text-white/60 font-semibold">
                        {String(report?.currency || "USD").toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {reportData.length === 0 ? (
                    <div className="py-10 text-center text-white/40">
                      No hay ventas atribuidas a afiliados para esta selección.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[900px]">
                        <thead>
                          <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wide">
                            <th className="py-3 px-3">Afiliado</th>
                            <th className="py-3 px-3">Ref Code</th>
                            <th className="py-3 px-3">Comisión</th>
                            <th className="py-3 px-3 text-right">Tickets</th>
                            <th className="py-3 px-3 text-right">Ventas</th>
                            <th className="py-3 px-3 text-right">
                              Comisión generada
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {reportData.map((row, index) => (
                            <React.Fragment
                              key={
                                row.eventAffiliateId ||
                                row.affiliateId ||
                                index
                              }
                            >
                              <tr className="border-b border-white/5 text-white/80 hover:bg-white/[0.025]">
                                <td className="py-4 px-3">
                                  <div className="font-semibold text-white">
                                    {row?.user?.name ||
                                      row?.user?.email ||
                                      "Afiliado"}
                                  </div>

                                  {row?.user?.email &&
                                    row?.user?.name && (
                                      <div className="text-white/40 text-xs mt-1">
                                        {row.user.email}
                                      </div>
                                    )}
                                </td>

                                <td className="py-4 px-3">
                                  <code className="rounded-lg bg-orange-500/10 text-orange-300 px-2 py-1 text-xs font-semibold">
                                    {row?.refCode || "-"}
                                  </code>
                                </td>

                                <td className="py-4 px-3">
                                  {formatCommission(
                                    row,
                                    report?.currency,
                                  )}
                                </td>

                                <td className="py-4 px-3 text-right font-semibold">
                                  {row?.ticketsSold ?? 0}
                                </td>

                                <td className="py-4 px-3 text-right font-semibold">
                                  {formatMoney(
                                    row?.ticketSales ?? 0,
                                    report?.currency,
                                  )}
                                </td>

                                <td className="py-4 px-3 text-right text-green-400 font-bold">
                                  {formatMoney(
                                    row?.commissionGenerated ?? 0,
                                    report?.currency,
                                  )}
                                </td>
                              </tr>

                              {Array.isArray(row?.salesByType) &&
                                row.salesByType.length > 0 && (
                                  <tr className="border-b border-white/10 bg-black/20">
                                    <td
                                      colSpan={6}
                                      className="px-5 py-4"
                                    >
                                      <div className="text-white/35 text-xs uppercase tracking-wide mb-3">
                                        Desglose por tipo de entrada
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {row.salesByType.map(
                                          (typeRow, typeIndex) => (
                                            <div
                                              key={
                                                typeRow.ticketTypeId ||
                                                typeIndex
                                              }
                                              className="rounded-xl border border-white/10 bg-white/[0.025] p-3"
                                            >
                                              <div className="text-white/80 font-medium text-sm">
                                                {typeRow.ticketTypeName ||
                                                  "Entrada"}
                                              </div>

                                              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                                                <div>
                                                  <div className="text-white/30">
                                                    Tickets
                                                  </div>
                                                  <div className="text-white/70 mt-1 font-semibold">
                                                    {typeRow.ticketsSold ??
                                                      0}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-white/30">
                                                    Ventas
                                                  </div>
                                                  <div className="text-white/70 mt-1 font-semibold">
                                                    {formatMoney(
                                                      typeRow.ticketSales ??
                                                        0,
                                                      report?.currency,
                                                    )}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-white/30">
                                                    Comisión
                                                  </div>
                                                  <div className="text-green-400 mt-1 font-semibold">
                                                    {formatMoney(
                                                      typeRow.commissionGenerated ??
                                                        0,
                                                      report?.currency,
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
