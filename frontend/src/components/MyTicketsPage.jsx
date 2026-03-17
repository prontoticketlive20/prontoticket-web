import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { jsPDF } from "jspdf";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Download,
  Mail,
  User,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";

import Header from "./Header";
import Footer from "./Footer";
import api from "../api/api";
import { usePurchase } from "../context/PurchaseContext";
import logoProntoTicketLiveLarge from "../assets/logo-prontoticketlive-large.png";

const MyTicketsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = usePurchase();

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    let alive = true;

    const loadOrder = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/orders/${orderId}`);

        const payload =
          res.data?.data?.data ||
          res.data?.data ||
          res.data ||
          null;

        if (!alive) return;
        setOrderData(payload);
      } catch (error) {
        console.error("[MyTicketsPage] No pude cargar la orden:", error);
        if (alive) setOrderData(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (orderId) loadOrder();

    return () => {
      alive = false;
    };
  }, [orderId]);

  const firstTicket = useMemo(() => orderData?.tickets?.[0] || null, [orderData]);
  const functionInfo = useMemo(() => firstTicket?.function || null, [firstTicket]);

  const eventInfo = useMemo(() => {
    const event = functionInfo?.event || null;

    return {
      id: event?.id || null,
      title: event?.title || "Evento",
      imageUrl: event?.imageUrl || "",
      venue: functionInfo?.venueName || event?.location || "",
      city: functionInfo?.city || "",
      eventDateISO: functionInfo?.date || null,
    };
  }, [functionInfo]);

  const formattedDate = useMemo(() => {
    if (!eventInfo?.eventDateISO) return "-";
    try {
      return new Intl.DateTimeFormat("es-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "America/New_York",
      }).format(new Date(eventInfo.eventDateISO));
    } catch {
      return "-";
    }
  }, [eventInfo]);

  const formattedTime = useMemo(() => {
    if (!eventInfo?.eventDateISO) return "-";
    try {
      return new Intl.DateTimeFormat("es-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/New_York",
      }).format(new Date(eventInfo.eventDateISO));
    } catch {
      return "-";
    }
  }, [eventInfo]);

  const locationLine = useMemo(() => {
    if (eventInfo.venue && eventInfo.city) return `${eventInfo.venue}, ${eventInfo.city}`;
    return eventInfo.venue || eventInfo.city || "-";
  }, [eventInfo]);

  const ticketCount = orderData?.tickets?.length || 0;

  const handleCopyOrderId = () => {
    if (!orderData?.id) return;
    navigator.clipboard.writeText(orderData.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTicketTypeLabel = (ticket) => {
    return (
      ticket?.ticketType?.name ||
      ticket?.ticketTypeName ||
      ticket?.ticketType ||
      ticket?.ticketTypeId ||
      "Entrada"
    );
  };

  const buildQrPayload = (ticket) => {
    return (
      ticket?.qrCode ||
      JSON.stringify({
        ticketId: ticket.id,
        orderId: orderData?.id,
        eventId: ticket?.function?.event?.id || null,
        functionId: ticket?.functionId || null,
        ticketTypeId: ticket?.ticketTypeId || null,
        seatId: ticket?.seatId || null,
      })
    );
  };

  const loadImageAsDataUrl = async (src) => {
    if (!src) return null;

    try {
      const response = await fetch(src);
      const blob = await response.blob();

      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn("[MyTicketsPage] No pude cargar imagen para PDF:", src, error);
      return null;
    }
  };

  const qrSvgToPngDataUrl = async (value, size = 220) => {
    const svgString = renderToStaticMarkup(
      <QRCodeSVG value={value} size={size} level="M" includeMargin={true} />
    );

    const svgWithNamespace = svgString.includes("xmlns=")
      ? svgString
      : svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');

    const svgBlob = new Blob([svgWithNamespace], {
      type: "image/svg+xml;charset=utf-8",
    });

    const blobUrl = URL.createObjectURL(svgBlob);

    return await new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(blobUrl);
            reject(new Error("No se pudo crear canvas para QR."));
            return;
          }

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);

          const pngDataUrl = canvas.toDataURL("image/png");
          URL.revokeObjectURL(blobUrl);
          resolve(pngDataUrl);
        } catch (err) {
          URL.revokeObjectURL(blobUrl);
          reject(err);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        reject(new Error("No se pudo convertir el QR a PNG."));
      };

      img.src = blobUrl;
    });
  };

  const generateTicketPDF = async (
    ticket,
    ticketIndex,
    totalTickets,
    existingDoc = null
  ) => {
    const doc =
      existingDoc || new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const logoDataUrl = await loadImageAsDataUrl(logoProntoTicketLiveLarge);
    const eventImageDataUrl = await loadImageAsDataUrl(eventInfo.imageUrl);
    const qrPayload = buildQrPayload(ticket);
    const qrPngDataUrl = await qrSvgToPngDataUrl(qrPayload, 240);

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setFillColor(10, 10, 10);
    doc.roundedRect(margin, 10, contentWidth, 34, 4, 4, "F");

    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, "PNG", margin + 6, 15, 70, 18, undefined, "FAST");
      } catch (error) {
        console.warn("[MyTicketsPage] No pude insertar logo en PDF:", error);
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Ticket ${ticketIndex + 1} de ${totalTickets}`, pageWidth - margin - 6, 20, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Orden: ${orderData?.id || ""}`, pageWidth - margin - 6, 27, {
      align: "right",
    });
    doc.text(`Ticket ID: ${ticket.id || ""}`, pageWidth - margin - 6, 33, {
      align: "right",
    });

    let currentY = 52;

    if (eventImageDataUrl) {
      try {
        doc.addImage(
          eventImageDataUrl,
          "PNG",
          margin,
          currentY,
          contentWidth,
          52,
          undefined,
          "FAST"
        );
        currentY += 58;
      } catch (error) {
        console.warn("[MyTicketsPage] No pude insertar imagen del evento en PDF:", error);
        currentY += 4;
      }
    }

    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(eventInfo.title || "Evento", margin, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Fecha: ${formattedDate}`, margin, currentY);
    currentY += 6;
    doc.text(`Hora: ${formattedTime}`, margin, currentY);
    currentY += 6;
    doc.text(`Lugar: ${eventInfo.venue || ""}`, margin, currentY);
    currentY += 6;
    doc.text(`Ciudad: ${eventInfo.city || ""}`, margin, currentY);
    currentY += 10;

    doc.setFillColor(248, 249, 251);
    doc.roundedRect(margin, currentY, contentWidth, 34, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text("Datos del ticket", margin + 5, currentY + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Comprador: ${orderData?.buyerName || ""}`.trim(), margin + 5, currentY + 16);
    doc.text(`Email: ${orderData?.buyerEmail || ""}`, margin + 5, currentY + 22);
    doc.text(`Tipo de entrada: ${getTicketTypeLabel(ticket)}`, margin + 5, currentY + 28);

    if (ticket.seatId) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 149, 0);
      doc.text(`Asiento: ${ticket.seatId}`, pageWidth - margin - 5, currentY + 16, {
        align: "right",
      });
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "normal");
    }

    currentY += 42;

    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, currentY, contentWidth, 78, 3, 3, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Código QR de acceso", margin + 5, currentY + 8);

    if (qrPngDataUrl) {
      const qrSize = 52;
      doc.addImage(
        qrPngDataUrl,
        "PNG",
        margin + 5,
        currentY + 14,
        qrSize,
        qrSize,
        undefined,
        "FAST"
      );
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.text(
      "Presenta este código QR en la entrada del evento. Cada ticket es único y solo puede usarse una vez.",
      margin + 64,
      currentY + 24,
      { maxWidth: contentWidth - 70 }
    );

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(qrPayload, margin + 64, currentY + 48, {
      maxWidth: contentWidth - 70,
    });

    doc.setDrawColor(230, 230, 230);
    doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text("ProntoTicketLive.com", margin, pageHeight - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Ticket generado automáticamente por la plataforma.", margin, pageHeight - 9);

    return doc;
  };

  const handleDownloadTickets = async () => {
    if (!orderData || isGeneratingPDF || !orderData.tickets?.length) return;

    setIsGeneratingPDF(true);

    try {
      const combinedDoc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let i = 0; i < orderData.tickets.length; i++) {
        const ticket = orderData.tickets[i];
        if (i > 0) combinedDoc.addPage();
        await generateTicketPDF(ticket, i, orderData.tickets.length, combinedDoc);
      }

      combinedDoc.save(`ProntoTicketLive_Tickets_${orderData.id}.pdf`);
    } catch (error) {
      console.error("[MyTicketsPage] Error generating PDF:", error);
      alert("No pude generar el PDF. Intenta nuevamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/70">
          <Loader2 size={20} className="animate-spin" />
          <span>Cargando tickets...</span>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <Header />
        <div className="pt-28 pb-20 px-4">
          <div className="max-w-xl mx-auto bg-[#121212] border border-white/10 rounded-3xl p-6 text-center shadow-2xl shadow-black/30">
            <h1 className="text-2xl font-bold mb-3">No pudimos encontrar esta orden</h1>
            <p className="text-white/60 text-sm mb-6">
              Verifica el enlace o vuelve a intentar desde tu correo de confirmación.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold"
              type="button"
            >
              Volver al inicio
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <div className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#007AFF]/20 bg-[#007AFF]/10 text-[#8ec5ff] text-sm mb-4">
              <ShieldCheck size={16} />
              Acceso seguro a tus entradas
            </div>

            <h1
              className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Mis Tickets
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto">
              Accede a tus entradas desde cualquier dispositivo y presenta tu QR en puerta.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0d2340] via-[#0f172a] to-[#3a2410] p-5 sm:p-6 mb-6 shadow-2xl shadow-black/30">
            <div className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white/60 text-sm mb-1">Número de pedido</p>
                  <p className="text-sm sm:text-base font-bold text-white tracking-wide font-mono break-all leading-snug">
                    {orderData.id}
                  </p>
                </div>

                <button
                  onClick={handleCopyOrderId}
                  className="shrink-0 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  type="button"
                >
                  {copied ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-white/70" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10">
                  <div className="text-white/50 text-xs">Entradas</div>
                  <div className="text-white font-bold">{ticketCount}</div>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/10">
                  <div className="text-white/50 text-xs">Total</div>
                  <div className="text-[#FFB347] font-bold">
                    {formatPrice(orderData.total)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {eventInfo.imageUrl ? (
            <div className="mb-6 rounded-3xl overflow-hidden border border-white/10 bg-[#121212] shadow-2xl shadow-black/30">
              <img
                src={eventInfo.imageUrl}
                alt={eventInfo.title}
                className="w-full h-52 sm:h-64 object-cover"
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 mb-6">
            <div className="bg-[#121212] rounded-3xl border border-white/10 p-6 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-2 mb-4">
                <Ticket size={18} className="text-[#FFB347]" />
                <h2
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Detalles del evento
                </h2>
              </div>

              <h3 className="text-white font-bold text-2xl mb-5 leading-tight">
                {eventInfo.title}
              </h3>

              <div className="rounded-2xl bg-white/5 border border-white/5 p-4 sm:p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#8ec5ff] text-sm font-semibold mb-2">
                      <Calendar size={15} />
                      Fecha
                    </div>
                    <div className="text-white/85 text-lg">{formattedDate}</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-[#FFB347] text-sm font-semibold mb-2">
                      <Clock size={15} />
                      Hora
                    </div>
                    <div className="text-white/85 text-lg">{formattedTime}</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[#8ec5ff] text-sm font-semibold mb-2">
                    <MapPin size={15} />
                    Lugar
                  </div>
                  <div className="text-white/85">{locationLine}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#121212] rounded-3xl border border-white/10 p-6 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-2 mb-4">
                <User size={16} className="text-[#007AFF]" />
                <h3 className="text-white font-semibold">Comprador</h3>
              </div>

              <div className="text-white text-2xl font-bold mb-3">
                {orderData.buyerName || "-"}
              </div>

              <div className="space-y-2">
                <p className="text-white/70 text-base break-all">
                  {orderData.buyerEmail || "-"}
                </p>
                {orderData.buyerPhone ? (
                  <p className="text-white/55 text-base">{orderData.buyerPhone}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2">
            <Ticket size={18} className="text-[#007AFF]" />
            <h2
              className="text-xl font-bold text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Tus entradas ({ticketCount})
            </h2>
          </div>

          <div className="space-y-5">
            {orderData.tickets?.map((ticket, idx) => {
              const qrData = buildQrPayload(ticket);
              const ticketTypeLabel = getTicketTypeLabel(ticket);

              return (
                <div
                  key={ticket.id || idx}
                  className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] shadow-2xl shadow-black/30"
                >
                  <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-[#007AFF] via-[#2f86ff] to-[#FFB347]" />
                  <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0A0A]" />
                  <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0A0A]" />

                  <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/15 text-[#8ec5ff] text-xs font-semibold mb-3">
                            <Ticket size={13} />
                            Entrada {idx + 1}
                          </div>

                          <h3 className="text-white text-2xl font-bold leading-tight mb-3">
                            {eventInfo.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm">
                              {ticketTypeLabel}
                            </span>

                            {ticket.seatId ? (
                              <span className="px-3 py-1 rounded-full bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FFB347] font-semibold text-sm">
                                Asiento {ticket.seatId}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="text-left lg:text-right max-w-[220px]">
                          <div className="text-white/40 text-xs mb-1">Ticket ID</div>
                          <div className="text-white/65 text-xs font-mono break-all leading-relaxed">
                            {ticket.id}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/5 border border-white/5 p-4 mb-4">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 text-[#8ec5ff] text-xs font-semibold mb-1.5">
                              <Calendar size={14} />
                              Fecha
                            </div>
                            <div className="text-white text-lg">{formattedDate}</div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-[#FFB347] text-xs font-semibold mb-1.5">
                              <Clock size={14} />
                              Hora
                            </div>
                            <div className="text-white text-lg">{formattedTime}</div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-[#8ec5ff] text-xs font-semibold mb-1.5">
                            <MapPin size={14} />
                            Lugar
                          </div>
                          <div className="text-white/85">{locationLine}</div>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-white/10 pt-4">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div>
                            <div className="text-white/40 text-xs mb-1">Comprador</div>
                            <div className="text-white text-lg font-semibold">
                              {orderData.buyerName || "-"}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <div className="text-white/40 text-xs mb-1">Correo</div>
                              <div className="text-white/80 break-all">
                                {orderData.buyerEmail || "-"}
                              </div>
                            </div>

                            {orderData.buyerPhone ? (
                              <div>
                                <div className="text-white/40 text-xs mb-1">Teléfono</div>
                                <div className="text-white/80">{orderData.buyerPhone}</div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t lg:border-t-0 lg:border-l border-dashed border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-5 sm:p-6 flex flex-col justify-between">
                      <div className="flex flex-col items-center">
                        <div className="text-white/60 text-[11px] uppercase tracking-[0.25em] mb-3 text-center">
                          Código QR
                        </div>

                        <div className="bg-white p-3 rounded-[22px] shadow-xl shadow-black/20">
                          <QRCodeSVG value={qrData} size={150} level="M" includeMargin={false} />
                        </div>

                        <p className="text-white/45 text-xs mt-3 text-center max-w-[220px] leading-relaxed">
                          Presenta este código en la entrada. Cada ticket puede usarse una sola vez.
                        </p>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-2.5">
                        <button
                          type="button"
                          disabled
                          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/35 font-semibold cursor-not-allowed"
                          title="Apple Wallet se añadirá en la siguiente fase"
                        >
                          Añadir a Wallet
                        </button>

                        <button
                          type="button"
                          disabled
                          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/35 font-semibold cursor-not-allowed"
                          title="Compartir ticket se añadirá en la siguiente fase"
                        >
                          Compartir ticket
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            <div className="bg-[#0f1c2c] rounded-3xl border border-[#007AFF]/20 p-5 shadow-2xl shadow-black/20">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-[#4ea3ff] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm mb-1">
                    Tus entradas están listas
                  </p>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Puedes mostrar estos códigos QR directamente desde tu teléfono o descargar todas las entradas en un solo PDF.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadTickets}
              disabled={isGeneratingPDF || !orderData.tickets?.length}
              className="w-full py-4 bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold rounded-2xl transition-all duration-300 hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-[#007AFF]/20"
              type="button"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Descargar entradas en PDF</span>
                </>
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-white/35 text-xs">
            ProntoTicketLive • Ticketing & entertainment technology
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyTicketsPage;