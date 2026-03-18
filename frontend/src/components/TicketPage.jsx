import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";

import Header from "./Header";
import Footer from "./Footer";
import api from "../api/api";

const TicketPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    let alive = true;

    const loadTicket = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/orders/ticket/${ticketId}`);
        const payload =
          res.data?.data?.data ||
          res.data?.data ||
          res.data ||
          null;

        if (!alive) return;
        setTicketData(payload);
      } catch (error) {
        console.error("[TicketPage] No pude cargar el ticket:", error);
        if (alive) setTicketData(null);
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (ticketId) loadTicket();

    return () => {
      alive = false;
    };
  }, [ticketId]);

  const eventInfo = useMemo(() => {
    const func = ticketData?.function || null;
    const event = func?.event || null;

    return {
      title: event?.title || "Evento",
      imageUrl: event?.imageUrl || "",
      venue: func?.venueName || event?.location || "",
      city: func?.city || "",
      dateISO: func?.date || null,
    };
  }, [ticketData]);

  const formattedDate = useMemo(() => {
    if (!eventInfo?.dateISO) return "-";
    try {
      return new Intl.DateTimeFormat("es-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "America/New_York",
      }).format(new Date(eventInfo.dateISO));
    } catch {
      return "-";
    }
  }, [eventInfo]);

  const formattedTime = useMemo(() => {
    if (!eventInfo?.dateISO) return "-";
    try {
      return new Intl.DateTimeFormat("es-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/New_York",
      }).format(new Date(eventInfo.dateISO));
    } catch {
      return "-";
    }
  }, [eventInfo]);

  const locationLine = useMemo(() => {
    if (eventInfo.venue && eventInfo.city) return `${eventInfo.venue}, ${eventInfo.city}`;
    return eventInfo.venue || eventInfo.city || "-";
  }, [eventInfo]);

  const ticketTypeLabel = useMemo(() => {
    return (
      ticketData?.ticketType?.name ||
      ticketData?.ticketTypeName ||
      ticketData?.ticketType ||
      ticketData?.ticketTypeId ||
      "Entrada"
    );
  }, [ticketData]);

  const qrValue = useMemo(() => {
    if (!ticketData) return "";
    return (
      ticketData?.qrCode ||
      JSON.stringify({
        ticketId: ticketData.id,
        orderId: ticketData?.order?.id || null,
        eventId: ticketData?.function?.event?.id || null,
        functionId: ticketData?.functionId || null,
        ticketTypeId: ticketData?.ticketTypeId || null,
        seatId: ticketData?.seatId || null,
      })
    );
  }, [ticketData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/70">
          <Loader2 size={20} className="animate-spin" />
          <span>Cargando ticket...</span>
        </div>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <Header />
        <div className="pt-28 pb-20 px-4">
          <div className="max-w-xl mx-auto bg-[#121212] border border-white/10 rounded-3xl p-6 text-center shadow-2xl shadow-black/30">
            <h1 className="text-2xl font-bold mb-3">No pudimos encontrar este ticket</h1>
            <p className="text-white/60 text-sm mb-6">
              Verifica el enlace compartido o vuelve a intentar.
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#007AFF]/20 bg-[#007AFF]/10 text-[#8ec5ff] text-sm mb-4">
              <ShieldCheck size={16} />
              Ticket individual compartido
            </div>

            <h1
              className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Tu Ticket
            </h1>
            <p className="text-white/60">
              Presenta este código QR en la entrada del evento.
            </p>
          </div>

          {eventInfo.imageUrl ? (
            <div className="mb-6 rounded-3xl overflow-hidden border border-white/10 bg-[#121212] shadow-2xl shadow-black/30">
              <img
                src={eventInfo.imageUrl}
                alt={eventInfo.title}
                className="w-full h-56 sm:h-72 object-cover"
              />
            </div>
          ) : null}

          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#111111] shadow-2xl shadow-black/30">
            <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-[#007AFF] via-[#2f86ff] to-[#FFB347]" />
            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0A0A]" />
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0A0A0A]" />

            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-6 sm:p-7">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/15 text-[#8ec5ff] text-xs font-semibold mb-4">
                  <Ticket size={13} />
                  Ticket individual
                </div>

                <h2 className="text-white text-3xl font-bold leading-tight mb-4">
                  {eventInfo.title}
                </h2>

                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm">
                    {ticketTypeLabel}
                  </span>

                  {ticketData?.seatId ? (
                    <span className="px-3 py-1 rounded-full bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FFB347] font-semibold text-sm">
                      Asiento {ticketData.seatId}
                    </span>
                  ) : null}
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
                      <div className="text-white/40 text-xs mb-1">Ticket ID</div>
                      <div className="text-white/80 font-mono break-all">
                        {ticketData?.id || "-"}
                      </div>
                    </div>

                    <div>
                      <div className="text-white/40 text-xs mb-1">Comprador</div>
                      <div className="text-white/80 flex items-center gap-2">
                        <User size={14} className="text-[#007AFF]" />
                        <span>{ticketData?.order?.buyerName || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t lg:border-t-0 lg:border-l border-dashed border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 sm:p-7 flex flex-col items-center justify-center">
                <div className="text-white/60 text-[11px] uppercase tracking-[0.25em] mb-3 text-center">
                  Código QR
                </div>

                <div className="bg-white p-3 rounded-[22px] shadow-xl shadow-black/20">
                  <QRCodeSVG value={qrValue} size={190} level="M" includeMargin={false} />
                </div>

                <p className="text-white/45 text-xs mt-4 text-center max-w-[220px] leading-relaxed">
                  Presenta este código en la entrada. Este ticket puede usarse una sola vez.
                </p>
              </div>
            </div>
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

export default TicketPage;