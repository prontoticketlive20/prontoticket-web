import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  CalendarDays,
  Ticket,
  Receipt,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Clock3,
  MapPin,
} from "lucide-react";

import api from "../api/api";

export default function AccountPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadAccount = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.get("/users/me/orders");
      const payload =
        res.data?.data?.data ??
        res.data?.data ??
        res.data ??
        null;

      const user = payload?.user || null;
      const ordersList = Array.isArray(payload?.orders) ? payload.orders : [];

      setProfile(user);
      setOrders(ordersList);

      if (user?.name) localStorage.setItem("ptl_user_name", user.name);
      if (user?.role) localStorage.setItem("ptl_user_role", user.role);
    } catch (error) {
      console.error("Error loading account:", error?.response?.data || error);
      setErrorMsg("No pude cargar la información de tu cuenta.");
      setProfile(null);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const money = (n) => {
    const v = Number(n);
    const safe = Number.isFinite(v) ? v : 0;
    return `$${safe.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalTickets = orders.reduce(
      (acc, order) => acc + Number(order.activeTicketsCount || 0),
      0,
    );
    const totalSpent = orders.reduce(
      (acc, order) =>
        acc +
        (Number(order.total || 0) -
          Number(order.cancelledTotal || 0) -
          Number(order.refundedTotal || 0)),
      0,
    );

    return {
      totalOrders,
      totalTickets,
      totalSpent,
    };
  }, [orders]);

  const getStatusBadge = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "PAID") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 border border-green-500/30 text-green-300">
          <CheckCircle2 size={12} />
          PAID
        </span>
      );
    }

    if (normalized === "REFUNDED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300">
          <RefreshCw size={12} />
          REFUNDED
        </span>
      );
    }

    if (normalized === "CANCELLED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-orange-500/10 border border-orange-500/30 text-orange-300">
          <Clock3 size={12} />
          CANCELLED
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-white/70">
        <Clock3 size={12} />
        {normalized || "N/A"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mi Cuenta</h1>
            <p className="text-sm text-white/50 mt-1">
              Consulta tus compras, órdenes y accesos a tickets.
            </p>
          </div>

          <button
            onClick={loadAccount}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 disabled:opacity-60"
            type="button"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 text-white/70">
            Cargando cuenta…
          </div>
        ) : errorMsg ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
            {errorMsg}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-[#121212] p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <User size={20} className="text-white/80" />
                  </div>

                  <div>
                    <div className="text-white font-semibold text-lg">
                      {profile?.name || "Cliente"}
                    </div>
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Mail size={14} />
                      <span>{profile?.email || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-black/30 border border-white/10 p-4">
                    <div className="text-white/50 text-sm">Órdenes</div>
                    <div className="text-white text-2xl font-bold mt-1">
                      {summary.totalOrders}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/30 border border-white/10 p-4">
                    <div className="text-white/50 text-sm">Tickets activos</div>
                    <div className="text-white text-2xl font-bold mt-1">
                      {summary.totalTickets}
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/30 border border-white/10 p-4">
                    <div className="text-white/50 text-sm">Total vigente</div>
                    <div className="text-white text-2xl font-bold mt-1">
                      {money(summary.totalSpent)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
                <div className="text-white font-semibold mb-4">Accesos rápidos</div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 text-white/80"
                  >
                    Seguir comprando
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (orders[0]?.id) navigate(`/my-tickets/${orders[0].id}`);
                    }}
                    disabled={!orders[0]?.id}
                    className="w-full text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 text-white/80 disabled:opacity-50"
                  >
                    Ver últimos tickets
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#121212] p-5">
              <div className="flex items-center gap-2 text-white font-semibold mb-4">
                <Receipt size={16} />
                Mis órdenes
              </div>

              {orders.length === 0 ? (
                <div className="rounded-xl bg-black/30 border border-white/10 p-6 text-white/60 text-sm">
                  Aún no tienes compras registradas en tu cuenta.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-white font-semibold">
                            {order.event?.title || "Evento"}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/50">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={14} />
                              {order.function?.date
                                ? new Date(order.function.date).toLocaleString()
                                : "Sin fecha"}
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <MapPin size={14} />
                              {order.function?.venueName || "Sin venue"}
                            </span>
                          </div>

                          <div className="mt-2 text-xs text-white/35 font-mono break-all">
                            Orden: {order.id}
                          </div>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-2">
                          {getStatusBadge(order.status)}
                          <div className="text-white font-semibold">
                            {money(
                              Number(order.total || 0) -
                                Number(order.cancelledTotal || 0) -
                                Number(order.refundedTotal || 0),
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-xl bg-[#121212] border border-white/10 p-3">
                          <div className="text-white/45 text-xs">Tickets totales</div>
                          <div className="text-white text-lg font-semibold mt-1">
                            {order.ticketsCount}
                          </div>
                        </div>

                        <div className="rounded-xl bg-[#121212] border border-white/10 p-3">
                          <div className="text-white/45 text-xs">Tickets activos</div>
                          <div className="text-white text-lg font-semibold mt-1">
                            {order.activeTicketsCount}
                          </div>
                        </div>

                        <div className="rounded-xl bg-[#121212] border border-white/10 p-3">
                          <div className="text-white/45 text-xs">Check-in</div>
                          <div className="text-white text-lg font-semibold mt-1">
                            {order.checkedInCount}
                          </div>
                        </div>

                        <div className="rounded-xl bg-[#121212] border border-white/10 p-3">
                          <div className="text-white/45 text-xs">Fecha de compra</div>
                          <div className="text-white text-sm font-semibold mt-1">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString()
                              : "-"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
                          to={`/my-tickets/${order.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#0056b3] text-white font-semibold hover:brightness-110"
                        >
                          <Ticket size={16} />
                          Ver tickets
                        </Link>

                        <Link
                          to={`/evento/${order.event?.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
                        >
                          Ver evento
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}