import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Ticket,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import Header from "./Header";
import Footer from "./Footer";
import api from "../api/api";
import icono2026 from "../assets/icono_2026.png";

const MyOrdersPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let alive = true;

    const loadOrders = async () => {
      try {
        setLoading(true);

        const res = await api.get("/orders/my-orders");

        const payload =
          res.data?.data ||
          [];

        if (!alive) return;

        setOrders(payload);
      } catch (error) {
        console.error("[MyOrdersPage] Error cargando órdenes:", error);

        if (alive) {
          setOrders([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white/70">
          <Loader2 size={28} className="animate-spin" />
          <span>Cargando tus compras...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-20 h-20 rounded-[26px] bg-white/5 border border-white/10 flex items-center justify-center shadow-xl shadow-black/30">
              <img
                src={icono2026}
                alt="ProntoTicketLive"
                className="w-12 h-12 object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#007AFF]/20 bg-[#007AFF]/10 text-[#8ec5ff] text-xs sm:text-sm mb-4">
              <ShieldCheck size={16} />
              Tus compras y tickets
            </div>

            <h1
              className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Mis Compras
            </h1>

            <p className="text-white/60 max-w-2xl mx-auto text-sm sm:text-base">
              Accede rápidamente a tus órdenes, tickets y eventos comprados.
            </p>
          </div>

          {/* EMPTY */}
          {!orders.length ? (
            <div className="bg-[#121212] border border-white/10 rounded-[32px] p-10 text-center">
              <div className="text-white/70 text-lg mb-2">
                No encontramos compras asociadas a tu cuenta.
              </div>

              <p className="text-white/45 text-sm">
                Si compraste como invitado, asegúrate de haber iniciado sesión
                con el mismo email usado en la compra.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {orders.map((order) => {
                const event = order.event;
                const func = order.function;

                const formattedDate = func?.date
                  ? new Intl.DateTimeFormat("es-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      timeZone: "America/New_York",
                    }).format(new Date(func.date))
                  : "-";

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-[30px] border border-white/10 bg-[#111111] shadow-2xl shadow-black/30"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">

                      {/* IMAGE */}
                      <div className="relative">
                        {event?.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event?.title}
                            className="w-full h-full object-cover min-h-[220px]"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[220px] bg-[#1a1a1a]" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      </div>

                      {/* CONTENT */}
                      <div className="p-5 sm:p-6 flex flex-col justify-between">

                        <div>

                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === "PAID"
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {order.status}
                            </span>

                            <span className="px-3 py-1 rounded-full text-xs bg-[#007AFF]/10 text-[#8ec5ff] border border-[#007AFF]/20">
                              {order.ticketsCount} Tickets
                            </span>
                          </div>

                          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                            {event?.title || "Evento"}
                          </h2>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                            <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                              <div className="flex items-center gap-2 text-[#8ec5ff] text-xs font-semibold mb-2">
                                <Calendar size={14} />
                                Fecha
                              </div>

                              <div className="text-white">
                                {formattedDate}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                              <div className="flex items-center gap-2 text-[#FFB347] text-xs font-semibold mb-2">
                                <MapPin size={14} />
                                Ciudad
                              </div>

                              <div className="text-white">
                                {func?.city || "-"}
                              </div>
                            </div>

                          </div>

                        </div>

                        {/* ACTIONS */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3">

                          <button
                            onClick={() =>
                              navigate(`/my-tickets/${order.id}`)
                            }
                            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold flex items-center justify-center gap-2 hover:brightness-110 transition"
                          >
                            <Ticket size={18} />
                            Ver Tickets
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/evento/${event?.id}`)
                            }
                            className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition flex items-center justify-center gap-2"
                          >
                            Ver Evento
                            <ChevronRight size={16} />
                          </button>

                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyOrdersPage;