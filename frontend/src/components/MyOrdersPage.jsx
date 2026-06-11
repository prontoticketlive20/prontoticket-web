import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Ticket,
  Loader2,
  ChevronRight,
  ShieldCheck,
  History,
  XCircle,
} from "lucide-react";

import Header from "./Header";
import Footer from "./Footer";
import api from "../api/api";
import icono2026 from "../assets/icono_2026.png";

const MyOrdersPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    let alive = true;

    const loadOrders = async () => {
      try {
        setLoading(true);

        const res = await api.get("/orders/my-orders");

        const payload =
          res.data?.data?.data ||
          res.data?.data ||
          res.data ||
          [];

        if (!alive) return;

        setOrders(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("[MyOrdersPage] Error cargando órdenes:", error);
        if (alive) setOrders([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      alive = false;
    };
  }, []);

  const isHistory = (order) => {
    const status = String(order?.status || "").toUpperCase();
    const eventDate = getOrderDate(order);
    const now = new Date();

    return status === "PAID" && eventDate && eventDate < now;
  };

  const groupedOrders = useMemo(() => {
  const getOrderDate = (order) => {
    const raw = order?.function?.date;

    if (!raw) return null;

    const date = new Date(raw);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  const isCancelledOrRefunded = (order) => {
    const status = String(order?.status || "").toUpperCase();

    return (
      status === "CANCELLED" ||
      status === "CANCELED" ||
      status === "REFUNDED"
    );
  };

  const isUpcomingPaid = (order) => {
    const status = String(order?.status || "").toUpperCase();

    const eventDate = getOrderDate(order);

    const now = new Date();

    return (
      status === "PAID" &&
      eventDate &&
      eventDate >= now
    );
  };

  const isHistory = (order) => {
    const status = String(order?.status || "").toUpperCase();

    const eventDate = getOrderDate(order);

    const now = new Date();

    return (
      status === "PAID" &&
      eventDate &&
      eventDate < now
    );
  };

  return {
    upcoming: orders.filter(isUpcomingPaid),
    history: orders.filter(isHistory),
    invalid: orders.filter(isCancelledOrRefunded),
    all: orders.filter(order => String(order?.status || "").toUpperCase() !== "PENDING"),
  };
}, [orders]);

  const visibleOrders = groupedOrders[activeTab] || [];

  const tabs = [
    {
      key: "upcoming",
      label: "Próximos",
      icon: <Ticket size={15} />,
      count: groupedOrders.upcoming.length,
    },
    {
      key: "history",
      label: "Historial",
      icon: <History size={15} />,
      count: groupedOrders.history.length,
    },
    {
      key: "invalid",
      label: "Anuladas",
      icon: <XCircle size={15} />,
      count: groupedOrders.invalid.length,
    },
    {
      key: "all",
      label: "Todas",
      icon: <ShieldCheck size={15} />,
      count: groupedOrders.all.length,
    },
  ];

  const getStatusClasses = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "PAID") {
      return "bg-green-500/10 text-green-400 border border-green-500/20";
    }

    if (normalized === "REFUNDED") {
      return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
    }

    if (normalized === "CANCELLED" || normalized === "CANCELED") {
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    }

    return "bg-zinc-500/10 text-zinc-300 border border-zinc-500/20";
  };

  const getEmptyMessage = () => {
    if (activeTab === "upcoming") {
      return "No tienes próximos eventos activos.";
    }

    if (activeTab === "history") {
      return "Todavía no tienes eventos pasados en tu historial.";
    }

    if (activeTab === "invalid") {
      return "No tienes compras canceladas o reembolsadas.";
    }

    return "No encontramos compras asociadas a tu cuenta.";
  };

  const renderOrderCard = (order) => {
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

    const normalizedStatus = String(order.status || "").toUpperCase();

    return (
      <div
        key={order.id}
        className="overflow-hidden rounded-[30px] border border-white/10 bg-[#111111] shadow-2xl shadow-black/30"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
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

          <div className="p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClasses(
                    normalizedStatus
                  )}`}
                >
                  {normalizedStatus || "N/A"}
                </span>

                <span className="px-3 py-1 rounded-full text-xs bg-[#007AFF]/10 text-[#8ec5ff] border border-[#007AFF]/20">
                  {order.ticketsCount || 0} Tickets
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

                  <div className="text-white">{formattedDate}</div>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
                  <div className="flex items-center gap-2 text-[#FFB347] text-xs font-semibold mb-2">
                    <MapPin size={14} />
                    Ciudad
                  </div>

                  <div className="text-white">{func?.city || "-"}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(`/my-tickets/${order.id}`)}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-bold flex items-center justify-center gap-2 hover:brightness-110 transition"
              >
                <Ticket size={18} />
                Ver Tickets
              </button>

              {event?.id ? (
                <button
                  onClick={() => navigate(`/evento/${event.slug}-${eventId}`)}
                  className="px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition flex items-center justify-center gap-2"
                >
                  Ver Evento
                  <ChevronRight size={16} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

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

            <button
               type="button"
               onClick={() => navigate("/account")}
               className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-semibold transition"
               >
               ← Regresar a Mi Cuenta
            </button>

          </div>

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
            <>
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-2xl px-4 py-3 border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                      activeTab === tab.key
                        ? "bg-[#007AFF]/15 border-[#007AFF]/40 text-[#8ec5ff]"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    <span className="text-xs opacity-70">({tab.count})</span>
                  </button>
                ))}
              </div>

              {visibleOrders.length === 0 ? (
                <div className="bg-[#121212] border border-white/10 rounded-[32px] p-10 text-center">
                  <div className="text-white/70 text-lg mb-2">
                    {getEmptyMessage()}
                  </div>

                  <p className="text-white/45 text-sm">
                    Puedes cambiar de pestaña para consultar otras compras.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {visibleOrders.map((order) => renderOrderCard(order))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyOrdersPage;